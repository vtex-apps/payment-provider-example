import { ExternalClient, InstanceOptions, IOContext } from '@vtex/api'
import { replace } from 'ramda'
import { PaymentAuthorizationResponse } from '../types'
import { withProxyAuthorization } from './utils'

const useHTTP = replace('https', 'http')
const useAction = replace(':action')
export default class PaymentProvider extends ExternalClient {
  constructor(protected context: IOContext, options?: InstanceOptions) {
    super('', context, withProxyAuthorization(context, options || {}))
  }

  public callback = (
    callbackUrl: string,
    callback: PaymentAuthorizationResponse
  ) =>
    this.http.post<unknown>(useHTTP(callbackUrl), callback, {
      metric: 'gateway-callback',
    })

  public inbound = <T>(
    inboundRequestsUrl: string,
    action: string,
    payload: T
  ) =>
    this.http.post(useAction(action, useHTTP(inboundRequestsUrl)), payload, {
      metric: 'gateway-inbound-request',
    })
}
