import { InstanceOptions, MiddlewareContext } from '@vtex/api'

import { PaymentProviderContext } from '../service'

export const usePCIProxy: (
  ctx: PaymentProviderContext
) => Required<InstanceOptions>['middlewares'][0] = (
  context: PaymentProviderContext
) => async (
  middlewareContext: MiddlewareContext,
  next: () => Promise<unknown>
) => {
  const proxy = {
    host: `${context.vtex.account}.vtexpayments.com.br/payment-provider/transactions/${context.paymentProvider.transactionId}/payments/${context.paymentProvider.paymentId}/proxy`,
    protocol: 'https',
    port: 443,
  }
  middlewareContext.config.proxy = proxy
  await next()
}
