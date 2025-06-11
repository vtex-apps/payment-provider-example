import { IOContext, RequestConfig } from '@vtex/api'
import {
  CardAuthorization,
  SecureExternalClient,
  TokenizedCard,
} from '@vtex/payment-provider'
import { stringify } from 'qs'

export interface CreatePaymentMethod {
  id: string
  object: string
  billing_details: BillingDetails
  card: Card
  created: number
  customer: null
  livemode: boolean
  type: string
}

export interface BillingDetails {
  address: Address
  email: null
  name: null
  phone: null
}

export interface Address {
  city: null
  country: null
  line1: null
  line2: null
  postal_code: null
  state: null
}

export interface Card {
  brand: string
  checks: Checks
  country: string
  exp_month: number
  exp_year: number
  fingerprint: string
  funding: string
  generated_from: null
  last4: string
  networks: Networks
  three_d_secure_usage: ThreeDSecureUsage
  wallet: null
}

export interface Checks {
  address_line1_check: null
  address_postal_code_check: null
  cvc_check: string
}

export interface Networks {
  available: string[]
  preferred: null
}

export interface ThreeDSecureUsage {
  supported: boolean
}

export default class StripePCICertifiedClient extends SecureExternalClient {
  constructor(protected context: IOContext, options?: any) {
    super('http://api.stripe.com', context, {
      ...options,
      timeout: 10000,
      headers: {
        Accept: 'application/json',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        VtexIdclientAutCookie: context.authToken,
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public createPaymentMethod = (
    cardRequest: CardAuthorization & {
      card: TokenizedCard
    },
    metadata: any,
    stripeSecretKey: string
  ) => {
    return this.http.post<CreatePaymentMethod>(
      '/v1/payment_methods',
      stringify({
        type: 'card',
        metadata: { ...metadata },
        card: {
          exp_month: cardRequest.card.expiration.month,
          exp_year: cardRequest.card.expiration.year,
          number: cardRequest.card.numberToken,
          cvc: cardRequest.card.cscToken,
        },
      }),
      {
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
        },
        secureProxy: cardRequest.secureProxyUrl,
      } as RequestConfig
    )
  }
}
