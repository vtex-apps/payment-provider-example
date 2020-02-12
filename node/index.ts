import { PaymentProviderService } from '@vtex/payment-provider-sdk'

import {
  authorize,
  cancel,
  inbound,
  paymentMethods,
  refund,
  settle,
} from './middlewares'

// Export a service that defines route handlers and client options.
export default new PaymentProviderService({
  paymentProvider: {
    authorize,
    cancel,
    settle,
    refund,
    paymentMethods,
    inbound,
  },
})
