import {
  AuthorizationRequest,
  AuthorizationResponse,
  AvailablePaymentsResponse,
  CancellationRequest,
  CancellationResponse,
  ConnectorContext,
  InboundRequest,
  InboundResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
} from '@vtex/connector-sdk'

export function cancel({
  connector: { transactionId, paymentId, requestId },
}: ConnectorContext<CancellationRequest>): CancellationResponse {
  return {
    cancellationId: 'connector-example-cancellationId',
    code: undefined,
    message: 'connector cancellation',
    transactionId,
    paymentId,
    requestId,
  }
}

export const paymentMethods: AvailablePaymentsResponse = {
  paymentMethods: [],
}

export function authorize({
  connector: { paymentId },
}: ConnectorContext<AuthorizationRequest>): AuthorizationResponse {
  return {
    authorizationId: 'connector-example-authorizationId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    tid: 'connector-example-tid',
    nsu: 'connector-example-nsu',
    status: 'approved',
    acquirer: undefined,
    paymentAppData: undefined,
  }
}

export function settle({
  connector: {
    paymentId,
    requestId,
    content: { value },
  },
}: ConnectorContext<SettlementRequest>) {
  return {
    settleId: 'connector-example-settleId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    value,
    requestId,
  }
}

export function refund({
  connector: {
    paymentId,
    requestId,
    content: { value },
  },
}: ConnectorContext<RefundRequest>): RefundResponse {
  return {
    refundId: 'connector-example-refundId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    requestId,
    value,
  }
}

export function inbound({
  connector: { requestId, paymentId, content },
}: ConnectorContext<InboundRequest>): InboundResponse {
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
