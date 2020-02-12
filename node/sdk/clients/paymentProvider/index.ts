import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { replace } from 'ramda'

import { AuthorizationResponse } from '../../service/typings/api'
import { withProxyAuthorization, useHTTP } from '../utils'

const useAction = replace(':action')
export default class PaymentProvider extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('', context, withProxyAuthorization(context, options ?? {}))
  }

  public callback = (callbackUrl: string, callback: AuthorizationResponse) =>
    this.http.post<unknown>(useHTTP(callbackUrl), callback, {
      metric: 'gateway-callback',
      headers: {
        'X-Vtex-Use-Https': 'true',
      },
    })

  public inbound = <T>(
    inboundRequestsUrl: string,
    action: string,
    payload: T
  ) =>
    this.http.post(useAction(action, useHTTP(inboundRequestsUrl)), payload, {
      metric: 'gateway-inbound-request',
      headers: {
        'X-Vtex-Use-Https': 'true',
      },
    })
}
