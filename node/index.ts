import { PaymentProviderService } from '@vtex/payment-provider'

import TestSuiteApprover from './connector'

// This will create the service with the required routes for your provider.
export default new PaymentProviderService({
  connector: TestSuiteApprover,
})
