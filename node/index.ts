/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IOClients,
  ParamsContext,
  RecorderState,
  Service,
  ServiceContext,
} from '@vtex/api'
import {
  implementsAPI,
  PaymentProviderProtocol,
} from '@vtex/payment-provider-sdk'

import {
  authorize,
  availablePaymentMethods,
  cancel,
  inbound,
  refund,
  settle,
} from './middlewares'

// Export a service that defines route handlers and client options.
export default new Service<IOClients, RecorderState, ParamsContext>({
  routes: implementsAPI<PaymentProviderProtocol<ServiceContext>>({
    authorizations: {
      POST: authorize,
    },
    cancellations: {
      POST: cancel,
    },
    settlements: {
      POST: settle,
    },
    refunds: { POST: refund },
    paymentMethods: {
      GET: availablePaymentMethods,
    },
    inbound: { POST: inbound },
  }),
})
