import {
  ClientsConfig,
  LRUCache,
  method,
  ParamsContext,
  RecorderState,
  Service,
  ServiceContext,
} from '@vtex/api'
import { Clients } from './clients'
import {
  authorizations,
  cancellations,
  inbound,
  paymentMethods,
  refunds,
  settlements,
} from './middlewares'
import { authorize } from './middlewares/authorize'

const TIMEOUT_MS = 800

// Create a LRU memory cache for the Status client.
// The @vtex/api HttpClient respects Cache-Control headers and uses the provided cache.
const memoryCache = new LRUCache<string, any>({ max: 5000 })
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

// We declare a global Context type just to avoid re-writing ServiceContext<Clients, State> in every handler and resolver
export interface State extends RecorderState {
  appKey: string
  appToken: string
}

export type Context = ServiceContext<Clients, State>
// Export a service that defines route handlers and client options.
export default new Service<Clients, State, ParamsContext>({
  clients,
  routes: {
    authorizations: method({
      POST: [authorize, authorizations],
      // POST: [authorizations] uncomment if you dont want to check appkey and apptoken
    }),
    cancellations: method({
      POST: [authorize, cancellations],
    }),
    settlements: method({
      POST: [authorize, settlements],
    }),
    refunds: method({
      POST: [authorize, refunds],
    }),
    paymentMethods: method({
      GET: paymentMethods,
    }),
    inbound,
  },
})
