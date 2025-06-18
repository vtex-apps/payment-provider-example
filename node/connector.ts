import {
  AuthorizationRequest,
  AuthorizationResponse, Authorizations,
  CancellationRequest,
  CancellationResponse,
  Cancellations, CardAuthorization,
  PaymentProvider,
  RefundRequest,
  RefundResponse, Refunds,
  //Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { VBase } from '@vtex/api'

import { PaymentMethods } from './clients/stripe/types'
import {Clients} from "./clients";

export interface TransferGroup {
  id: string
  transfer_group: string
  amount: number
}

const authorizationsBucket = 'stripepay'
/*const persistAuthorizationResponse = async (
  vbase: VBase,
  resp: AuthorizationResponse
) => vbase.saveJSON(authorizationsBucket, resp.paymentId, resp)
*/
const getPersistedAuthorizationResponse = async (
  vbase: VBase,
  req: AuthorizationRequest
) =>
  vbase.getJSON<AuthorizationResponse | undefined>(
    authorizationsBucket,
    req.paymentId,
    true
  )

export default class OnboardingStripeConnector extends PaymentProvider<Clients> {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.
  /*
  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }
*/
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
      clients: { stripeClient, stripePCIClient },
      headers,
    } = this.context

    const appSecret = headers['x-provider-api-apptoken']

    if (persistedResponse !== undefined && persistedResponse !== null) {
      return persistedResponse
    }

    const { value, currency, orderId, paymentId, transactionId } = authorization

    const captureMethod = 'manual'
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

    const { id: paymentMethodId } = await stripePCIClient.createPaymentMethod(
      authorization as any,
      {
        orderId,
        paymentId,
        transactionId,
      },
      String(appSecret)
    )
    
    const creditCardIntent = await stripeClient.createPaymentIntent(
      creditCardIntentConfigs,
      creditCardPaymentMethods,
      false,
      String(appSecret)
    )
    /*
    const { id: paymentMethodId } = await stripeClient.createPaymentMethod(
          authorization as any, {
            orderId: orderId,
            paymentId: paymentId,
            transactionId: transactionId,
          },
          String(appSecret))*/

    console.log('creditCardIntent.id: '+ creditCardIntent.id)
    console.log('paymentMethodId:' + paymentMethodId)
    await stripeClient.updatePaymentIntent(
      creditCardIntent.id,
      paymentMethodId,
      String(appSecret)
    )
    
    const cardAuthorization = authorization as CardAuthorization
    return Authorizations.approveCard(cardAuthorization, {
      authorizationId: authorization.paymentId,
      nsu: `${authorization.paymentId}#${PaymentMethods.card}`,
      tid: `${authorization.paymentId}#${PaymentMethods.card}`,
      code: "succeeded",
      message: `Card Payment Approved. Pending Capture`,
      delayToAutoSettle: 10
    })
  }

  public async cancel(
    cancellation: CancellationRequest): Promise<CancellationResponse> {

    const {
      //clients: { vbase },
      clients: { stripeClient },
    } = this.context
    const { tid } = cancellation

    const { headers } = this.context
    console.log('entrou no cancel')

    const appSecret = headers['x-provider-api-apptoken']

    const tidSplitted = tid?.split('#')

    if (tidSplitted?.length) {
      const [paymentIntent] = tidSplitted

      const cancelPaymentIntent = await stripeClient.cancelPaymentIntent(
          paymentIntent,
          String(appSecret)
      )

      console.log('cancelPaymentIntent: '+ cancelPaymentIntent)
    }
    
    return Cancellations.approve(cancellation, {
      cancellationId: String(cancellation.tid),
    })
  }
    public async refund(refund: RefundRequest): Promise<RefundResponse> {
      const {
        //clients: { vbase },
        clients: { stripeClient },
        vtex: { logger },
      } = this.context
      const { tid } = refund
  
      const { headers } = this.context
          console.log('entrou no refund')
      
          const appSecret = headers['x-provider-api-apptoken']
      
          const tidSplitted = tid?.split('#')
      
          if (tidSplitted?.length) {
            const [paymentIntent] = tidSplitted
      
            try {
              /*
              const transferGroupVbase = await vbase.getJSON<TransferGroup>(
                'PaymentTransferGroup',
                refund.paymentId
              )
              if (transferGroupVbase.amount === refund.value) {
                const transfersResponse = await stripeClient.retrievePaymentTransfers(
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
              */
              console.log('paymentIntent: '+ paymentIntent)
              console.log('refund.value: '+ refund.value)
              
              const paymentRefunded = await stripeClient.refundPaymentIntent(
                paymentIntent,
                refund.value,
                String(appSecret)
              )
              console.log('paymentRefunded: '+ paymentRefunded)
              
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
              console.log('error: '+ error)
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

    const {
      clients: { stripeClient},
      headers,
    } = this.context

    const appSecret = headers['x-provider-api-apptoken']

    const { transactionId } = settlement

    await stripeClient.capturePaymentIntent(
        transactionId,
        String(appSecret)
    )

    return Settlements.approve(settlement, {
        settleId: String(settlement.transactionId),
        code: '201',
        message: 'Card approved',
      })
  }

  public inbound: undefined
}
