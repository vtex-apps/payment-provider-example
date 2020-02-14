/* eslint-disable no-console */
import {
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  BankInvoiceAuthorized,
  CancellationRequest,
  CancellationResponse,
  InboundRequest,
  InboundResponse,
  isCreditCardAuthorization,
  PaymentProviderContext,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
} from '@vtex/payment-provider-sdk'
import { IOClients } from '@vtex/api'

const RESPONSE_BASE = {
  authorizationId: 'payment-provider-example-authorizationId',
  code: undefined,
  message: 'successfully cancelled',
  tid: 'payment-provider-example-tid',
  nsu: 'payment-provider-example-nsu',
  acquirer: 'cielo',
  paymentAppData: undefined,
}
export function cancel({
  paymentProvider: { transactionId, paymentId, requestId },
}: PaymentProviderContext<CancellationRequest>): CancellationResponse {
  return {
    cancellationId: 'payment-provider-example-cancellationId',
    code: undefined,
    message: 'payment provider cancellation',
    transactionId,
    paymentId,
    requestId,
  }
}

export const paymentMethods: AvailablePaymentsResponse = {
  paymentMethods: ['Visa'],
}

const callbackWith = (
  status: AuthorizationResponse['status'],
  request: AuthorizationRequest,
  client: IOClients['paymentProvider']
) => {
  setTimeout(
    () =>
      client.callback(request.transactionId, request.paymentId, {
        ...RESPONSE_BASE,
        paymentId: request.paymentId,
        status,
      }),
    15000
  )
}

const statusByCard: Record<
  number,
  (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ) => Promise<AuthorizationResponse>
> = {
  4444333322221111: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    return {
      ...RESPONSE_BASE,
      status: 'approved',
      paymentId: ctx.paymentProvider.paymentId,
    }
  },
  4444333322221112: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    return {
      ...RESPONSE_BASE,
      status: 'denied',
      paymentId: ctx.paymentProvider.paymentId,
    }
  },
  4222222222222224: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    callbackWith(
      'approved',
      ctx.paymentProvider.content,
      ctx.clients.paymentProvider
    )
    return {
      ...RESPONSE_BASE,
      status: 'undefined',
      paymentId: ctx.paymentProvider.paymentId,
    }
  },
  4222222222222225: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    callbackWith(
      'denied',
      ctx.paymentProvider.content,
      ctx.clients.paymentProvider
    )
    return {
      ...RESPONSE_BASE,
      status: 'undefined',
      paymentId: ctx.paymentProvider.paymentId,
    }
  },
}

export async function authorize(
  ctx: PaymentProviderContext<AuthorizationRequest>
): Promise<AuthorizationResponse> {
  const {
    paymentProvider: { paymentId, content },
  } = ctx
  if (isCreditCardAuthorization(content)) {
    return statusByCard[+content.card.number](ctx)
  }
  return {
    authorizationId: 'payment-provider-example-authorizationId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    tid: 'payment-provider-example-tid',
    nsu: 'payment-provider-example-nsu',
    status: 'undefined',
    acquirer: undefined,
    paymentAppData: undefined,
    paymentUrl: 'https://foo.com',
  } as BankInvoiceAuthorized
}

export function settle({
  paymentProvider: {
    paymentId,
    requestId,
    content: { value },
  },
}: PaymentProviderContext<SettlementRequest>) {
  return {
    settleId: 'payment-provider-example-settleId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    value,
    requestId,
  }
}

export function refund({
  paymentProvider: {
    paymentId,
    requestId,
    content: { value },
  },
}: PaymentProviderContext<RefundRequest>): RefundResponse {
  return {
    refundId: 'payment-provider-example-refundId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    requestId,
    value,
  }
}

export function inbound({
  paymentProvider: { requestId, paymentId, content },
}: PaymentProviderContext<InboundRequest>): InboundResponse {
  return {
    paymentId,
    code: undefined,
    message: undefined,
    requestId,
    responseData: {
      content: JSON.stringify(content),
      contentType: 'application/json',
      statusCode: 200,
    },
  }
}
