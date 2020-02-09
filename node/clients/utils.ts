import { InstanceOptions, IOContext } from '@vtex/api'

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
