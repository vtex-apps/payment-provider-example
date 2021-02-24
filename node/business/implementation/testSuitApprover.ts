import {
  AuthorizationRequest,
  AuthorizationResponse,
  CancellationRequest,
  CancellationResponse,
  PaymentProvider,
  ProviderManifestResponse,
  RefundRequest,
  RefundResponse,
  SettlementRequest,
  SettlementResponse,
} from '@vtex/payment-provider-sdk'

import {
  getAuthorizationCallbackSampleResponse,
  getAuthorizationSampleResponse,
  getSettlementSampleResponse,
  getRefundSampleResponse,
  getCancellationSampleResponse,
} from '../../utils/testSuitUtils'

export default class TestSuiteApprover extends PaymentProvider {
  public manifest(): ProviderManifestResponse {
    return {
      paymentMethods: [
        {
          name: 'Visa',
          allowsSplit: 'onCapture',
        },
        {
          name: 'Mastercard',
          allowsSplit: 'onCapture',
        },
      ],
    }
  }

  public async authorize(
    authorization: AuthorizationRequest
  ): Promise<AuthorizationResponse> {
    if (this.isTestSuite) {
      const expectedResponse = getAuthorizationSampleResponse(authorization)
      const callbackResponse = getAuthorizationCallbackSampleResponse(
        authorization
      )

      if (callbackResponse) {
        this.callback(authorization, callbackResponse)
      }

      return expectedResponse
    }

    throw new Error('Not implemented')
  }

  public async cancel(
    cancellation: CancellationRequest
  ): Promise<CancellationResponse> {
    if (this.isTestSuite) {
      return getCancellationSampleResponse(cancellation)
    }

    throw new Error('Not implemented')
  }

  public async refund(refund: RefundRequest): Promise<RefundResponse> {
    if (this.isTestSuite) {
      return getRefundSampleResponse(refund)
    }

    throw new Error('Not implemented')
  }

  public async settle(
    settlement: SettlementRequest
  ): Promise<SettlementResponse> {
    if (this.isTestSuite) {
      return getSettlementSampleResponse(settlement)
    }

    throw new Error('Not implemented')
  }

  public inbound: undefined
}
