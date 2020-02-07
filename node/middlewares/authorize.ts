import { Context } from '..'
import { InvalidAppKeyAndAppTokenError } from './errors'

export const VTEX_PROVIDER_KEY = 'x-provider-api-appkey'
export const VTEX_PROVIDER_TOKEN = 'x-provider-api-apptoken'

// Use this middleware to receive the appkey/apptoken keys from gateway
export async function authorize(
  context: Context,
  executeOperation: () => Promise<unknown>
) {
  const {
    request: {
      headers: {
        [VTEX_PROVIDER_KEY]: providerKey,
        [VTEX_PROVIDER_TOKEN]: providerToken,
      },
    },
  } = context

  if (!providerKey || !providerToken) {
    throw new InvalidAppKeyAndAppTokenError()
  }

  context.state.appKey = providerKey
  context.state.appToken = providerToken

  await executeOperation()
}
