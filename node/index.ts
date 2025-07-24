import { PaymentProviderService, PaymentProviderState } from '@vtex/payment-provider'
import { Clients, clientsConfig } from './clients/index'

import PalomaConnector from './connector'
import routes from './routes'
import { ParamsContext, ServiceContext } from '@vtex/api'
import type { PaymentRequest } from '@vtex/payment-provider'

declare global {
  type Context = ServiceContext<Clients, PaymentProviderState<PaymentRequest>, ParamsContext>
}

export default new PaymentProviderService({
  connector: PalomaConnector,
  clients: clientsConfig,
  routes,
})
