/* eslint-disable @typescript-eslint/no-explicit-any */
import { PaymentProviderService } from '@vtex/payment-provider-sdk'
import { IOClients } from '@vtex/api'

import {
  authorize,
  cancel,
  inbound,
  paymentMethods,
  refund,
  settle,
} from './middlewares'

// Export a service that defines route handlers and client options.
export default new PaymentProviderService<IOClients>({
  paymentProvider: {
    authorize,
    cancel,
    settle,
    refund,
    paymentMethods,
    inbound,
  },
})
