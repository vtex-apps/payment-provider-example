import { InstanceOptions, IOContext } from '@vtex/api'
import { replace } from 'ramda'

export const withProxyAuthorization = (
  context: IOContext,
  options: InstanceOptions
): InstanceOptions => ({
  ...options,
  headers: {
    'Proxy-Authorization': context.authToken,
    ...(options?.headers ?? {}),
  },
})

export const withMiddlwares = (
  middlewares: Required<InstanceOptions>['middlewares'],
  options: InstanceOptions
) => ({
  ...options,
  middlewares: [...(options?.middlewares ?? []), ...middlewares],
})

export const useHTTP = replace('https', 'http')
