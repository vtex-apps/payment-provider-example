import { json as requestParser } from 'co-body'

import {
  AvailablePaymentsResponse,
  InboundRequest,
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationResponse,
  CancellationRequest,
  PaymentMethod,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
  SettlementResponse,
} from '../types'

import { Context } from '..'

export async function cancellations(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const { transactionId, paymentId, requestId } = (await requestParser(
    ctx.req
  )) as CancellationRequest
  const cancellationResponse: CancellationResponse = {
    cancellationId: 'connector-example-cancellationId',
    code: undefined,
    message: 'connector cancellation',
    transactionId,
    paymentId,
    requestId,
  }
  ctx.body = cancellationResponse
  ctx.status = 200
  await next()
}

export async function paymentMethods(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const availablePaymentMethods: PaymentMethod[] = []
  const response: AvailablePaymentsResponse = {
    paymentMethods: availablePaymentMethods,
  }
  ctx.body = response
  ctx.status = 200
  await next()
}

export async function authorizations(
  ctx: Context,
  next: () => Promise<unknown>
) {
  const { paymentId } = (await requestParser(ctx.req)) as AuthorizationRequest
  const authorizationResponse: AuthorizationResponse = {
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
  ctx.body = authorizationResponse
  ctx.status = 200
  await next()
}

export async function settlements(ctx: Context, next: () => Promise<unknown>) {
  const { paymentId, value, requestId } = (await requestParser(
    ctx.req
  )) as SettlementRequest
  const settlementResponse: SettlementResponse = {
    settleId: 'connector-example-settleId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    value,
    requestId,
  }
  ctx.body = settlementResponse
  ctx.status = 200
  await next()
}

export async function refunds(ctx: Context, next: () => Promise<unknown>) {
  const { paymentId, requestId, value } = (await requestParser(
    ctx.req
  )) as RefundRequest
  const refundResponse: RefundResponse = {
    refundId: 'connector-example-refundId',
    code: undefined,
    message: 'successfully cancelled',
    paymentId,
    requestId,
    value,
  }
  ctx.body = refundResponse
  ctx.status = 200
  await next()
}

export async function inbound(ctx: Context, next: () => Promise<unknown>) {
  const requestBody = (await requestParser(ctx.req)) as InboundRequest
  ctx.body = requestBody
  ctx.status = 200
  await next()
}
