import { PaymentProviderService } from '@vtex/payment-provider'
import OnboardingStripeConnector from './connector'
import {ServiceContext} from "@vtex/api";
import {Clients} from "./clients";
import {clients} from "./clients";

declare global {
  type Context = ServiceContext<Clients>
}


export default new PaymentProviderService({
  connector: OnboardingStripeConnector,
  clients: clients
})
