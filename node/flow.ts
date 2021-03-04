import {
  isBankInvoiceAuthorization,
  isCardAuthorization,
  isTokenizedCard,
  AuthorizationRequest,
  AuthorizationResponse,
  Authorizations,
} from '@vtex/payment-provider'

import { randomString, randomUrl } from './utils'

type Flow =
  | 'Authorize'
  | 'Denied'
  | 'Cancel'
  | 'AsyncApproved'
  | 'AsyncDenied'
  | 'BankInvoice'
  | 'Redirect'

export const flows: Record<
  Flow,
  (
    authorization: AuthorizationRequest,
    callback: (response: AuthorizationResponse) => void
  ) => AuthorizationResponse
> = {
  // Flow for the Authorize test
  // Authorizes payment with random values for authorizationId, nsu and tid
  Authorize: request =>
    Authorizations.approve(request, {
      authorizationId: randomString(),
      nsu: randomString(),
      tid: randomString(),
    }),

  // Flow for the Denied test
  // Refuses the authorization with random value for the tid
  Denied: request => Authorizations.deny(request, { tid: randomString() }),

  // Flow for the Cancel test
  // This is called in the first part of the cancellation test and
  // it should appprove like in the authorize flow, so we reuse that flow
  Cancel: (request, callback) => flows.Authorize(request, callback),

  // Flow for the AsyncApproved test
  AsyncApproved: (request, callback) => {
    // Makes the callback with an approved response
    callback(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )

    // Returns a pending response
    return Authorizations.pending(request, {
      delayToCancel: 1000,
      tid: randomString(),
    })
  },

  // Flow for the AsyncDenied test
  AsyncDenied: (request, callback) => {
    // Makes the callback with a denied response
    callback(Authorizations.deny(request, { tid: randomString() }))

    // Returns a pending response
    return Authorizations.pending(request, {
      delayToCancel: 1000,
      tid: randomString(),
    })
  },

  // Flow for the BankInvoice test
  BankInvoice: (request, callback) => {
    // Makes the callback with an approved response
    callback(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )

    // Returns a pending bank invoice response
    return Authorizations.pendingBankInvoice(request, {
      delayToCancel: 1000,
      paymentUrl: randomUrl(),
      tid: randomString(),
    })
  },

  // Flow for the Redirect test
  Redirect: (request, callback) => {
    // Makes the callback with an approved response
    callback(
      Authorizations.approve(request, {
        authorizationId: randomString(),
        nsu: randomString(),
        tid: randomString(),
      })
    )

    // Returns the redirect response
    return Authorizations.redirect(request, {
      delayToCancel: 1000,
      redirectUrl: randomUrl(),
      tid: randomString(),
    })
  },
}

export type CardNumber =
  | '4444333322221111'
  | '4444333322221112'
  | '4222222222222224'
  | '4222222222222225'
  | 'null'

// Stores the card numbers of each test suite flow
const cardResponses: Record<CardNumber, Flow> = {
  '4444333322221111': 'Authorize',
  '4444333322221112': 'Denied',
  '4222222222222224': 'AsyncApproved',
  '4222222222222225': 'AsyncDenied',
  null: 'Redirect',
}

// Detects which of the test suite approver flows the request is from
const findFlow = (request: AuthorizationRequest): Flow => {
  // Checks if it's a bank invoice request
  if (isBankInvoiceAuthorization(request)) return 'BankInvoice'

  // Checks if it's a card request
  if (isCardAuthorization(request)) {
    const { card } = request
    const cardNumber = isTokenizedCard(card) ? null : card.number

    // Returns the flow associated with the card number (or the null value)
    return cardResponses[cardNumber as CardNumber]
  }

  return 'Authorize'
}

export const executeAuthorization = (
  request: AuthorizationRequest,
  callback: (response: AuthorizationResponse) => void
): AuthorizationResponse => {
  // finds the test suite the request is from
  const flow = findFlow(request)

  // executes the flow with the request and callback
  return flows[flow](request, callback)
}
