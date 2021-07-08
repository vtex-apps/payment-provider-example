import { IOClients } from '@vtex/api'
import { MockSecureClient } from './SecureClient'

export class Clients extends IOClients {
    public get mockSecureClient() {
        return this.getOrSet('mockSecureClient', MockSecureClient)
    }
}