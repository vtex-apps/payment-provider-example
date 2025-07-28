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
import type { CreditCardAuthorization, PaymentRequest } from '@vtex/payment-provider/lib/service/typings/api'
import { AxiosError } from 'axios';
import { ConfirmPaymentIntentResponseDto } from './clients/dtos/ConfirmPaymentIntentResponseDto';

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
  ): Promise<AuthorizationResponse> {
    const { clients: { stripe: stripeClient, stripePCI: stripePCIClient }, headers } = this.context;
    const apiSecret = headers['x-provider-api-apptoken'] as string;

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


    let paymentConfirmResponse : ConfirmPaymentIntentResponseDto | null = null;
    try {
      const paymentMethodPayload = StripeMapper.getPaymentMethodPayload(authorization);
      const paymentMethodResponse = await stripePCIClient.paymentMethods(paymentMethodPayload, (authorization as CreditCardAuthorization).secureProxyUrl as string, apiSecret);

      const createPaymentIntentPayload = StripeMapper.getPaymentIntentPayload(authorization);
      const createPaymentIntentResponse = await stripeClient.paymentIntents(createPaymentIntentPayload, apiSecret);

      const paymentIntentConfirmPayload = StripeMapper.getConfirmPaymentIntentPayload(paymentMethodResponse.id);
      paymentConfirmResponse = await stripeClient.confirmPayment(paymentIntentConfirmPayload, createPaymentIntentResponse.id, apiSecret);
    } catch (error) {
      const exception = error as AxiosError;
      return {
        paymentId: authorization.paymentId,
        status: 'denied',
        message: exception.message
      } as AuthorizationResponse;
    }

    return {
      paymentId: authorization.paymentId,
      status: paymentConfirmResponse.status === 'requires_capture' ? 'approved' : 'denied',
    } as AuthorizationResponse;
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    const { clients: { stripe: stripeClient }, headers } = this.context;
    const apiKey = headers['x-provider-api-apptoken'] as string;

    const { success, data: cancellationResponse, errorMessage } = await stripeClient.cancelIntent(cancellation.paymentId as string, apiKey);
    const cancelResponse = {
      paymentId: cancellation.paymentId,
      cancellationId: success ? cancellationResponse?.id ?? null : null,
      code: success ? 'canceled' : (cancellationResponse as any).code ?? null,
      message: success ? 'canceled' : errorMessage,
    } as CancellationResponse;

    return cancelResponse;
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.deny(refund)
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest,
  ): Promise<SettlementResponse> {

    if (this.isTestSuite) {
      return Settlements.deny(settlement)
    }
    const { clients: { stripe: stripeClient }, headers } = this.context;
    const apiKey = headers['x-provider-api-apptoken'] as string;

    const confirmationResponse = await stripeClient.captureIntent(settlement.paymentId as string, apiKey);

    return {
      settleId: confirmationResponse.id,
      value: confirmationResponse.amount,
      code: null,
      requestId: settlement.requestId,
      name: '',
      message: '',
      paymentId: settlement.paymentId,
    } as SettlementResponse;
  }

  public inbound: undefined
}
