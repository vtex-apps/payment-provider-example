import { Context } from '@vtex/api'

import { Clients } from '../clients'
import { ConnectorContext } from '../service'
import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  InboundRequest,
  PaymentMethod,
  RefundRequest,
  SettlementRequest,
  InboundResponse,
  RefundResponse,
} from '../types'

export function cancel({
  connector: { transactionId, paymentId, requestId },
}: ConnectorContext<CancellationRequest, Clients>): CancellationResponse {
  return {
    cancellationId: 'connector-example-cancellationId',
    code: undefined,
    message: 'connector cancellation',
    transactionId,
    paymentId,
    requestId,
  }
}

export function paymentMethods(_: Context<Clients>) {
  const availablePaymentMethods: PaymentMethod[] = []
  return {
    paymentMethods: availablePaymentMethods,
  }
}

export function authorize({
  connector: { paymentId },
}: ConnectorContext<AuthorizationRequest, Clients>): AuthorizationResponse {
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
}: ConnectorContext<SettlementRequest, Clients>) {
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
}: ConnectorContext<RefundRequest, Clients>): RefundResponse {
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
}: ConnectorContext<InboundRequest, Clients>): InboundResponse {
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
