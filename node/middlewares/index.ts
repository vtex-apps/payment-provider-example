/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
import { IncomingHttpHeaders } from 'http2'

import { IOClients, ServiceContext } from '@vtex/api'
import {
  APIContext,
  APIResponse,
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  BankInvoiceAuthorized,
  CancellationRequest,
  CancellationResponse,
  InboundRequest,
  InboundResponse,
  isCreditCardAuthorization,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
} from '@vtex/payment-provider-sdk'

type PaymentProviderClient = IOClients['paymentProvider']
type PaymentProviderContext<
  RequestBody = unknown,
  RouteParams = unknown,
  QueryParams = unknown,
  Headers extends IncomingHttpHeaders = IncomingHttpHeaders
> = APIContext<ServiceContext, RouteParams, RequestBody, QueryParams, Headers>

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
  request: {
    body: { transactionId, paymentId, requestId },
  },
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

export function availablePaymentMethods(): AvailablePaymentsResponse {
  return {
    paymentMethods: ['Visa'],
  }
}

const callbackWith = (
  status: AuthorizationResponse['status'],
  request: AuthorizationRequest,
  client: PaymentProviderClient
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
      paymentId: ctx.request.body.paymentId,
    }
  },
  4444333322221112: async ({
    request: {
      body: { paymentId },
    },
  }: PaymentProviderContext<AuthorizationRequest>): Promise<
    AuthorizationResponse
  > => {
    return {
      ...RESPONSE_BASE,
      status: 'denied',
      paymentId,
    }
  },
  4222222222222224: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    callbackWith('approved', ctx.request.body, ctx.clients.paymentProvider)
    return {
      ...RESPONSE_BASE,
      status: 'undefined',
      paymentId: ctx.request.body.paymentId,
    }
  },
  4222222222222225: async (
    ctx: PaymentProviderContext<AuthorizationRequest>
  ): Promise<AuthorizationResponse> => {
    callbackWith('denied', ctx.request.body, ctx.clients.paymentProvider)
    return {
      ...RESPONSE_BASE,
      status: 'undefined',
      paymentId: ctx.request.body.paymentId,
    }
  },
}

export async function authorize(
  ctx: PaymentProviderContext<AuthorizationRequest>
): Promise<APIResponse<AuthorizationResponse>> {
  const {
    request: { body: content },
  } = ctx
  if (isCreditCardAuthorization(content)) {
    return statusByCard[+content.card.number](ctx)
  }
  return {
    authorizationId: 'payment-provider-example-authorizationId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId: content.paymentId,
    tid: 'payment-provider-example-tid',
    nsu: 'payment-provider-example-nsu',
    status: 'undefined',
    acquirer: undefined,
    paymentAppData: undefined,
    paymentUrl: 'https://foo.com',
  } as BankInvoiceAuthorized
}

export function settle({
  request: {
    body: { paymentId, requestId, value },
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
  request: {
    body: { paymentId, requestId, value },
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
  request: {
    body: { requestId, paymentId, ...content },
  },
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
