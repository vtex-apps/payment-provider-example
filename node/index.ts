import { PaymentProviderService } from '@vtex/payment-provider'

import OnboardingStripeConnector from './connector'

export default new PaymentProviderService({
  connector: OnboardingStripeConnector,
})
