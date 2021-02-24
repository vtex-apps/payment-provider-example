import { PaymentProviderService } from '@vtex/payment-provider-sdk'

import TestSuiteApprover from './business/implementation/testSuitApprover'

export default new PaymentProviderService({
  connector: TestSuiteApprover,
})
