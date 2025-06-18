import {ClientsConfig, IOClients} from "@vtex/api";
import StripeClient from "./stripe";
import StripePCIClient from "./stripePCI";

export class Clients extends IOClients {
    public get stripePCIClient() {
      return this.getOrSet('stripePCIClient', StripePCIClient)
    }
    public get stripeClient() {
        return this.getOrSet('stripeClient', StripeClient)
    }
}

export const clients: ClientsConfig<Clients> = {
    implementation: Clients,
    options: {
        default: {
            retries: 2,
            timeout: 10000,
        },
    },
}