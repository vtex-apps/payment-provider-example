import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { VBase, IOClients } from '@vtex/api'

import { executeAuthorization } from './flow'
import stripeClient from './clients/stripe'
import StripePCIClient from './clients/stripePCI'
import { PaymentMethods } from './clients/stripe/types'

export interface TransferGroup {
  id: string
  transfer_group: string
  amount: number
}

const authorizationsBucket = 'stripepay'
const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)

const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

export class ExtendedClients extends IOClients {
  public get stripePCIClient() {
    return this.getOrSet('stripePCIClient', StripePCIClient)
  }
}
export default class OnboardingStripeConnector extends PaymentProvider<
  ExtendedClients
> {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  private async convertInCents(value: number) {
    const totalCents = (value * 100).toFixed(0)

    return Number(totalCents)
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    const persistedResponse = await getPersistedAuthorizationResponse(
      this.context.clients.vbase,
      authorization
    )

    const {
      vtex: { account },
      clients: { stripePCIClient },
      headers,
    } = this.context

    const appSecret = headers['x-provider-api-apptoken']

    if (persistedResponse !== undefined && persistedResponse !== null) {
      return persistedResponse
    }

    /* const {
        clients: { vbase },
        vtex: { logger, account, userAgent, workspace },
        headers
      } = this.context */

    const { value, currency, orderId, paymentId, transactionId } = authorization

    const captureMethod = 'automatic'
    const transferGroup = `${authorization.reference}#${authorization.paymentId}`

    const creditCardIntentConfigs = {
      accountName: account,
      amount: await this.convertInCents(value),
      currency,
      orderId,
      paymentId,
      transactionId,
      captureMethod,
      transferGroup,
    }

    const creditCardPaymentMethods = [PaymentMethods.card]

    const creditCardIntent = await stripeClient.createPaymentIntent(
      creditCardIntentConfigs,
      creditCardPaymentMethods,
      false,
      String(appSecret)
    )

    const { id: paymentMethodId } = await stripePCIClient.createPaymentMethod(
      authorization as any,
      {
        orderId,
        paymentId,
        transactionId,
      },
      String(appSecret)
    )
    /*
      const { id: paymentMethodId } = await stripeClient.createPaymentMethods(
          authorization as any, {
            orderId: orderId,
            paymentId: paymentId,
            transactionId: transactionId,
          }) */

    await stripeClient.updatePaymentIntent(
      creditCardIntent.id,
      paymentMethodId,
      String(appSecret)
    )

    return executeAuthorization(authorization, response =>
      this.saveAndRetry(authorization, response)
    )
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    return Cancellations.approve(cancellation, {
      cancellationId: String(cancellation.tid),
    })
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    const {
      clients: { vbase },
      vtex: { logger },
    } = this.context

    const { tid } = refund

    const { headers } = this.context

    const appSecret = headers['x-provider-api-apptoken']

    const tidSplitted = tid?.split('#')

    if (tidSplitted?.length) {
      const [paymentIntent] = tidSplitted

      try {
        // if the file does not exists then an error is displayed
        const transferGroupVbase = await vbase.getJSON<TransferGroup>(
          'PaymentTransferGroup',
          refund.paymentId
        )

        if (transferGroupVbase.amount === refund.value) {
          const transfersResponse = await stripeClient.retrievePaymentTransfers(
            transferGroupVbase.transfer_group,
            String(appSecret)
          )

          if (
            transfersResponse !== undefined &&
            transfersResponse?.data?.length > 0
          ) {
            for (const transfer of transfersResponse.data) {
              const transferId: string = transfer.id
              const amount: number = transfer.amount * 100

              try {
                const transferReversalResponse = stripeClient.createReversalTransfer(
                  amount,
                  transferId,
                  String(appSecret)
                )

                logger.info({
                  workflowType: 'Payment',
                  workflowInstance: 'TransferReversal',
                  message: 'Response',
                  data: JSON.stringify({ transferReversalResponse }),
                })
              } catch (error) {
                logger.error({
                  workflowInstance: 'TransferReversal',
                  message: 'Response',
                  data: JSON.stringify({ transferId, amount, error }),
                })
              }
            }
          }
        }

        const paymentRefunded = await stripeClient.refundPaymentIntent(
          paymentIntent,
          refund.value,
          String(appSecret)
        )

        logger.info({
          workflowType: 'Payment',
          workflowInstance: 'onRefund',
          message: 'Refund Payment Intent Response',
          data: JSON.stringify({ paymentRefunded }),
        })

        if (paymentRefunded.status === 'succeeded') {
          return Refunds.approve(refund, {
            refundId: paymentIntent,
            message: `value ${refund.value} refunded`,
          })
        }
      } catch (error) {
        logger.error({
          workflowType: 'Payment',
          workflowInstance: 'Refund',
          message: 'UnknownError',
          data: { error },
        })

        return Refunds.deny(refund)
      }

      return Refunds.deny(refund)
    }

    return Refunds.deny(refund)
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
