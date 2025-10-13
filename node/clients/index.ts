import { ClientsConfig, IOClients, LRUCache } from '@vtex/api'

import StripeClient from './stripe'
import StripePCIClient from './stripePCI'

const appsCache = new LRUCache<string, any>({ max: 200 })
const providerManagerCache = new LRUCache<string, any>({
  max: 1,
  ttl: 2 * 60 * 1000,
})

metrics.trackCache('apps', appsCache)

const DEFAULT_TIMEOUT_MS = 3000

export class Clients extends IOClients {
  public get stripe() {
    return this.getOrSet('stripe', StripeClient)
  }

  public get stripePCI() {
    return this.getOrSet('stripePCI', StripePCIClient)
  }
}

export const clientsConfig: ClientsConfig<Clients> = {
  implementation: Clients,
  options: {
    default: {
      metrics,
      retries: 2,
      timeout: DEFAULT_TIMEOUT_MS,
    },
    apps: {
      memoryCache: appsCache,
      retries: 1,
      timeout: DEFAULT_TIMEOUT_MS,
    },
    providerManager: {
      memoryCache: providerManagerCache,
      retries: 1,
      timeout: DEFAULT_TIMEOUT_MS,
    },
  },
}
