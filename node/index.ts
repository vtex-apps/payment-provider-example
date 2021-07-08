import { PaymentProviderService } from '@vtex/payment-provider'

import TestSuiteApprover from './connector'
import { Clients } from './clients'

export default new PaymentProviderService({
  connector: TestSuiteApprover,
  clients: {
    implementation: Clients,
    options: {
      default: {
        timeout: 1000 * 10,
        retries: 1,
      },
    },
  },
})
