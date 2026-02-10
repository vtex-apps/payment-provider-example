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

export default class UcpPaymentProviderMock extends PaymentProvider {

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    return Authorizations.approve(authorization, {
      authorizationId: randomString(),
      nsu: randomString(),
      tid: randomString(),
    })
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    return Cancellations.approve(cancellation, {
      cancellationId: `${randomString()}`,
      code: 'success',
      message: 'Payment has been canceled.',
    })
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    return Refunds.approve(refund, {
      refundId: `${randomString()}`,
      code: 'success',
      message: 'Payment has been refunded',
    })
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    return Settlements.approve(settlement, {
      settleId: randomString(),
      code: 'success',
      message: 'Payment has been captured',
    })
  }

  public inbound: undefined
}
