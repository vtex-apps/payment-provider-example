import {
  AuthorizationRequest,
  AuthorizationResponse,
  Authorizations,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  PaymentProvider,
  RefundRequest,
  RefundResponse,
  Refunds,
  SettlementRequest,
  SettlementResponse,
  Settlements,
} from '@vtex/payment-provider'

import { randomString } from './utils'
import { executeAuthorization } from './flow'

// This is your connector class
export default class TestSuiteApprover extends PaymentProvider {
  // It needs modifications to pass the test suite.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about each test.

  // This is the function responsible for the /payments route.
  // It should handle payments creations and initiate the payment flow.
  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    // This condition is true when we receive a request from the test suite.
    if (this.isTestSuite) {
      // This function will execute the second parameter, which is the callback,
      // and then return with the expected response for the authorization.
      return executeAuthorization(authorization, response =>
        this.callback(authorization, response)
      )
    }

    // The payment-provider lib has objects to handle the construction of responses of each type.
    // When referring to creating/authorizing a payment, we use the Authorizations object,
    // which has functions for approving and denying requests.
    // You can check the notion doc for the complete description of each function.

    // This function will return the response with the default fields for a denied authorization.
    return Authorizations.deny(authorization)
  }

  // This is the function responsible for the /payments/:paymentId/cancellation route.
  // It should handle the cancellations of payments that have not yet be approved.
  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      // Just like the Authorizations, this function will construct a cancellation response.
      // Note that in order to approve, we need to send a second parameter to fill the
      // required fields.

      // For the test suite, we only need to fill in the cancellationId, but you might want to use the
      // code and message to facilitate the logistics.

      // To check all the available fields, refer to
      // https://developers.vtex.com/vtex-developer-docs/reference/payment-flow#cancelpayment .
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    // This will deny the cancellations with the default values for a denied cancellation.
    return Cancellations.deny(cancellation)
  }

  // This is the function responsible for the /payments/:paymentId/refunds route.
  // It should handle the refunds of payments that have already been settled.
  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    // This is one of the functions you'll need to change in order to pass the test suite.
    // In order to look for the available fields, refer to
    // https://developers.vtex.com/vtex-developer-docs/reference/payment-flow#capturepayment .

    // It's currently denying with the default values for each field of a refund response.
    return Refunds.deny(refund)
  }

  // This is the function responsible for the /payments/:paymentId/settlements route.
  // It should handle the capture of payments that have been approved.
  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    // This is one of the functions you'll need to change in order to pass the test suite.
    // In order to look for the available fields, refer to
    // https://developers.vtex.com/vtex-developer-docs/reference/payment-flow#refundpayment .

    // It's currently denying with the default values for each field of a settlement response.
    return Settlements.deny(settlement)
  }

  // This is the function responsible for the /payments/:paymentId/inbound/:action route.
  // It's an optional route that can be defined to forward a request back to your endpoint
  // using the inboundRequestsUrl provided in the POST /payments payload.
  public inbound: undefined
}
