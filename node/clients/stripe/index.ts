import {ExternalClient, IOContext, RequestConfig} from '@vtex/api'

import { stringify } from 'qs'
import {PaymentMethods, StripePaymentIntentConfigs, StripePaymentMethodData} from "./types";
import Stripe from "stripe";

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

export default class StripeClient extends ExternalClient {
  constructor(protected context: IOContext, options?: any) {
    super('http://api.stripe.com', context, {
      ...options,
      timeout: 10000,
      headers: {
        Accept: 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Vtex-Use-Https': 'true',
      },
    })
  }

  public updatePaymentIntent = (
      paymentIntentId: string,
      paymentMethodId: string,
      stripeSecretKey: string
  ) => {
    console.log('ENTROU NO NOVO UPDATE PAYMENT')
    return this.http.post<CreatePaymentMethod>(
        `/v1/payment_intents/${paymentIntentId}/confirm`,
        stringify({
          payment_method: paymentMethodId,
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }


  public createPaymentIntent = (
      intentConfigs: StripePaymentIntentConfigs,
      paymentMethodTypes: PaymentMethods[],
      confirm: boolean,
      stripeSecretKey: string,
      paymentMethodData?: StripePaymentMethodData
  ) => {
    console.log('ENTROU NO NOVO createPaymentIntent')
    const {
      accountName,
      amount,
      currency,
      orderId,
      paymentId,
      transactionId,
      captureMethod,
      transferGroup,
    } = intentConfigs

    const data: any = {
      amount,
      currency,
      confirm,
      metadata: {
        order_id: orderId,
        transaction_id: transactionId,
        payment_id: paymentId,
        account_name: accountName,
      },
      payment_method_types: paymentMethodTypes,
      captureMethod,
      transferGroup,
    }

    if (paymentMethodData) {
      data.payment_method_data = paymentMethodData
    }
    
    return this.http.post<CreatePaymentMethod>(
        '/v1/payment_intents',
        stringify({
          amount: data.amount,
          currency: data.currency,
          capture_method: data.captureMethod,
          transfer_group: data.transferGroup,
          automatic_payment_methods: { enabled: false}
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }


  public retrievePaymentTransfers =  (stripeSecretKey: string
  ) => {
    return this.http.get(
        '/v1/payment_intents',
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }


  public createReversalTransfer = (amount : number, id: string, stripeSecretKey: string
  ) => {

    const data : any = {
      amount
    }

    return this.http.post(
        `/v1/transfers/${id}/reversals`,
        stringify({
          amount: data.amount
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }

  public refundPaymentIntent = (
      paymentIntentId: string,
      value: number,
      stripeSecretKey: string
  ) => {
    console.log('refundPaymentIntent: ')
    console.log(paymentIntentId)
    
    return this.http.post<Stripe.Refund>(
        '/v1/refunds',
        stringify({
          //charge: 'ch_3Rab1hCp13eGpuNm0WFf1GDF',
          payment_intent: paymentIntentId,
          amount: value
        }),
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }
  public capturePaymentIntent = (
      paymentIntentId: string,
      stripeSecretKey: string
  ) => {
    console.log('capturePaymentIntent: ')
    console.log(paymentIntentId)

    return this.http.post<Stripe.Refund>(
        `/v1/payment_intents/${paymentIntentId}/capture`,null,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }


  public cancelPaymentIntent = (
      paymentIntentId: string,
      stripeSecretKey: string
  ) => {
    console.log('cancelPaymentIntent: ')
    console.log(paymentIntentId)

    return this.http.post(
        `/v1/payment_intents/${paymentIntentId}/cancel`,null,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          }
        } as RequestConfig
    )
  }

}
