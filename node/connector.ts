import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  Cancellations,
  isCardAuthorization,
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
import { Clients } from './clients'

export default class TestSuiteApprover extends PaymentProvider<Clients> {
  // This class needs modifications to pass the test suit.
  // Refer to https://help.vtex.com/en/tutorial/payment-provider-protocol#4-testing
  // in order to learn about the protocol and make the according changes.

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      return executeAuthorization(authorization, response =>
        this.callback(authorization, response)
      )
    }

    if (isCardAuthorization(authorization)) {
      await this.context.clients.mockSecureClient.myPCIEndpoint(authorization)
    }

    return executeAuthorization(authorization, () => {})
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }
    console.info('hello cancel')

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.approve(refund, {
        refundId: randomString(),
      })
    }

    console.info('hello refund')
    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.approve(settlement, {
        settleId: randomString(),
      })
    }
    console.info('hello settle')
    throw new Error('Not implemented')
  }

  public inbound: undefined
}
