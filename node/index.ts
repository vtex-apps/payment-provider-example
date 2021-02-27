import { PaymentProviderService } from '@vtex/payment-provider'

import TestSuiteApprover from './connector'

export default new PaymentProviderService({
  connector: TestSuiteApprover,
})
