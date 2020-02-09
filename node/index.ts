import {
  Cached,
  ClientsConfig,
  LRUCache,
  ParamsContext,
  RecorderState,
} from '@vtex/api'

import { Clients } from './clients'
import {
  authorize,
  cancel,
  inbound,
  paymentMethods,
  refund,
  settle,
} from './middlewares'
import { ConnectorService } from './service'

const TIMEOUT_MS = 800

// Create a LRU memory cache for the Status client.
// The @vtex/api HttpClient respects Cache-Control headers and uses the provided cache.
const memoryCache = new LRUCache<string, Cached>({ max: 5000 })
metrics.trackCache('paymentProvider', memoryCache)

// This is the configuration for clients available in `ctx.clients`.
const clients: ClientsConfig<Clients> = {
  // We pass our custom implementation of the clients bag, containing the PaymentProvider client.
  implementation: Clients,
  options: {
    // All IO Clients will be initialized with these options, unless otherwise specified.
    default: {
      retries: 2,
      timeout: TIMEOUT_MS,
    },
    // This key will be merged with the default options and add this cache to our PaymentProvider client.
    paymentProvider: {
      memoryCache,
      headers: {
        'Content-Type': 'application/json',
        'X-Vtex-Use-Https': 'true',
      },
    },
  },
}

// Export a service that defines route handlers and client options.
export default new ConnectorService<Clients, RecorderState, ParamsContext>({
  clients,
  connector: {
    authorize,
    cancel,
    settle,
    refund,
    paymentMethods,
    inbound,
  },
})
