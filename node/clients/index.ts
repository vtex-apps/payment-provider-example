import { IOClients } from '@vtex/api'

import PaymentProvider from './paymentProvider'

// Extend the default IOClients implementation with our own custom clients.
export class Clients extends IOClients {
  public get paymentProvider() {
    return this.getOrSet('paymentProvider', PaymentProvider)
  }
}
