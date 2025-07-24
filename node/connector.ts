import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  PaymentProviderState,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'
import { ParamsContext, VBase } from '@vtex/api'

import { randomString } from './utils'
import { executeAuthorization } from './flow'
import StripeMapper from './clients/mappers/StripeMapper';
import { Clients } from './clients';
import type { PaymentRequest } from '@vtex/payment-provider/lib/service/typings/api'

const authorizationsBucket = 'authorizations';
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

export default class PalomaConnector extends PaymentProvider<Clients, PaymentProviderState<PaymentRequest>, ParamsContext> {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  constructor(context: Context) {
    super(context)
  }

  private async saveAndRetry(
    req: AuthorizationRequest,
    resp: AuthorizationResponse
  ) {
    await persistAuthorizationResponse(this.context.clients.vbase, resp)
    this.callback(req, resp)
  }

  public async authorize(
    authorization: AuthorizationRequest
    // ): Promise<AuthorizationResponse> {
  ): Promise<any> {
    const stripeClient = this.context.clients.stripe;

    if (this.isTestSuite) {
      const persistedResponse = await getPersistedAuthorizationResponse(
        this.context.clients.vbase,
        authorization
      )

      if (persistedResponse !== undefined && persistedResponse !== null) {
        return persistedResponse
      }

      return executeAuthorization(authorization, response =>
        this.saveAndRetry(authorization, response)
      )
    }

    const paymentMethodPayload = StripeMapper.getPaymentMethodPayload(authorization);
    await stripeClient.paymentMethods(paymentMethodPayload, this.context);

    const createPaymentIntentPayload = StripeMapper.getPaymentIntentPayload(authorization);
    console.log('createPaymentIntentPayload --->', createPaymentIntentPayload);
    const createPaymentIntentResponse = await stripeClient.paymentIntents(createPaymentIntentPayload);
    console.log('createPaymentIntentResponse --->', createPaymentIntentResponse);

    const paymentConfirmPayload = StripeMapper.getConfirmPaymentIntentPayload(createPaymentIntentResponse.id);
    console.log('paymentConfirmPayload --->', paymentConfirmPayload);
    const paymentConfirmResponse = stripeClient.confirmPayment(paymentConfirmPayload, createPaymentIntentResponse.id);
    console.log('paymentConfirmResponse --->', paymentConfirmResponse);
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    throw new Error('Not implemented')
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
