import {
  AuthorizationRequest,
  AuthorizationResponse,
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

export default class TestSuiteApprover extends PaymentProvider {
  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      return executeAuthorization(authorization, response =>
        this.callback(authorization, response)
      )
    }

    throw new Error('Not implemented')
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return Cancellations.approve(cancellation, {
        cancellationId: randomString(),
      })
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return Refunds.approve(refund, { refundId: randomString() })
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return Settlements.approve(settlement, { settleId: randomString() })
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
