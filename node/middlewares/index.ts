import {
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  CancellationRequest,
  CancellationResponse,
  PaymentProviderContext,
  InboundRequest,
  InboundResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
} from '../sdk'

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
  paymentMethods: [],
}

export function authorize({
  paymentProvider: { paymentId },
}: PaymentProviderContext<AuthorizationRequest>): AuthorizationResponse {
  return {
    authorizationId: 'payment-provider-example-authorizationId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    tid: 'payment-provider-example-tid',
    nsu: 'payment-provider-example-nsu',
    status: 'approved',
    acquirer: undefined,
    paymentAppData: undefined,
  }
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
