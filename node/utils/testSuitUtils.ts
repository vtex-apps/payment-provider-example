import {
  approvedSampleResponse,
  deniedSampleResponse,
  asyncSampleResponse,
  redirectSampleResponse,
  isBankInvoiceAuthorization,
  isCardAuthorization,
  isTokenizedCard,
  AuthorizationRequest,
  AuthorizationResponse,
  Maybe,
  settlementSampleResponse,
  SettlementRequest,
  SettlementResponse,
  refundSampleResponse,
  RefundResponse,
  RefundRequest,
  cancellationSampleResponse,
  CancellationRequest,
  CancellationResponse,
} from '@vtex/payment-provider-sdk'

type Flow = 'accept' | 'denied' | 'async-accept' | 'async-denied' | 'null'

export type CardNumber =
  | '4444333322221111'
  | '4444333322221112'
  | '4222222222222224'
  | '4222222222222225'
  | 'null'

const cardResponses: Record<CardNumber, Flow> = {
  '4444333322221111': 'accept',
  '4444333322221112': 'denied',
  '4222222222222224': 'async-accept',
  '4222222222222225': 'async-denied',
  null: 'null',
}

export const getAuthorizationSampleResponse = (
  request: AuthorizationRequest
): AuthorizationResponse => {
  const { paymentId } = request

  if (isBankInvoiceAuthorization(request)) {
    const { returnUrl } = request

    return {
      ...asyncSampleResponse(paymentId, returnUrl),
      paymentUrl: returnUrl,
    }
  }

  if (isCardAuthorization(request)) {
    const { card } = request
    const cardNumber = isTokenizedCard(card) ? null : card.number

    const response = cardResponses[cardNumber as CardNumber]

    if (response === 'accept') return approvedSampleResponse(paymentId)
    if (response === 'denied') return deniedSampleResponse(paymentId)
    if (response === 'async-accept' || response === 'async-denied')
      return asyncSampleResponse(paymentId)
    if (response === 'null') {
      return redirectSampleResponse(paymentId)
    }
  }

  return approvedSampleResponse(request.paymentId)
}

export const getAuthorizationCallbackSampleResponse = (
  request: AuthorizationRequest
): Maybe<AuthorizationResponse> => {
  const { paymentId } = request

  if (isCardAuthorization(request)) {
    const { card } = request
    const cardNumber = isTokenizedCard(card) ? null : card.number

    const response = cardResponses[cardNumber as CardNumber]

    if (response === 'accept' || response === 'denied') return undefined
    if (response === 'async-accept') return approvedSampleResponse(paymentId)
    if (response === 'async-denied') return deniedSampleResponse(paymentId)

    const { returnUrl } = request

    return {
      ...redirectSampleResponse(paymentId),
      paymentUrl: returnUrl,
    }
  }

  return approvedSampleResponse(paymentId)
}

export const getSettlementSampleResponse = (
  settlement: SettlementRequest
): SettlementResponse => {
  const { paymentId, value, requestId } = settlement

  return settlementSampleResponse(paymentId, value, requestId)
}

export const getRefundSampleResponse = (
  refund: RefundRequest
): RefundResponse => {
  const { paymentId, value, requestId } = refund

  return refundSampleResponse(paymentId, value, requestId)
}

export const getCancellationSampleResponse = (
  cancellation: CancellationRequest
): CancellationResponse => {
  const { paymentId, requestId, transactionId } = cancellation

  return cancellationSampleResponse(paymentId, requestId, transactionId)
}
