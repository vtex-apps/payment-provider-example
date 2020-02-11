import { ConnectorService } from '@vtex/connector-sdk'

import {
  authorize,
  cancel,
  inbound,
  paymentMethods,
  refund,
  settle,
} from './middlewares'

// Export a service that defines route handlers and client options.
export default new ConnectorService({
  connector: {
    authorize,
    cancel,
    settle,
    refund,
    paymentMethods,
    inbound,
  },
})
