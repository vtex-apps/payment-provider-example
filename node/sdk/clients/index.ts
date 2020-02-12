import { IOClients } from '@vtex/api'

import PaymentProvider from './paymentProvider'

export class PaymentProviderClients extends IOClients {
  public get payments() {
    return this.getOrSet('payments', PaymentProvider)
  }
}

export * from './middlewares'
