
export const ACQUIRER_DOMAINS = {
    SANDBOX: 'https://en60bodz6scm5rf.m.pipedream.net/',
    // SANDBOX: 'http://1af3f8f9-7d5f-4442-8de2-d51e9b6e6b35.mock.pstmn.io',
    // LIVE: 'http://secure.payu.ro/',
}

import { CardAuthorization, SecureExternalClient, TokenizedCard } from '@vtex/payment-provider'
import type {
  InstanceOptions,
  IOContext,
  RequestConfig
} from '@vtex/api'

export class MockSecureClient extends SecureExternalClient {

    constructor(protected context: IOContext, options?: InstanceOptions) {
    super(ACQUIRER_DOMAINS.SANDBOX, context, options)
    }

    public myPCIEndpoint = (cardRequest: CardAuthorization) => {
        const tokenizedCard = cardRequest.card as TokenizedCard // Should this throw an error?
        const data = {
            holder: tokenizedCard.holderToken,
            number: tokenizedCard.numberToken,
            expiration: tokenizedCard.expiration,
            csc: tokenizedCard.cscToken
        }
        const url = 'authorize' //'my-pci-endpoint'
        const config: RequestConfig = {
            headers: {
                Authorization: 'my-pci-endpoint-authorization',
                secureProxyUrl: cardRequest.secureProxyUrl
            }
        }
        console.info(data)
        return this.http.post(url, data, config).then(response => {
            console.info('Response from the acquirer: ', response)
        }).catch(error => {
            console.info(error)
            // throw error
        })
    }

}