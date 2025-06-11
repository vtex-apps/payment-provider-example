import { Maybe, CardAuthorization, Card } from '@vtex/payment-provider'
import Stripe from 'stripe'

export interface StripeSDK {
  createPaymentIntent(
    intentConfigs: StripePaymentIntentConfigs,
    paymentMethodTypes: PaymentMethods[],
    confirm: boolean,
    stripeSecretKey: string,
    paymentMethodData?: StripePaymentMethodData,
    hasInstallments?: boolean
  ): any
  updatePaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string,
    stripeSecretKey: string
  ): any
  // confirmPaymentIntent(paymentIntentId: string, installmentsInfo: Installments, returnUrl: Maybe<string>): Promise<Stripe.Response<Stripe.PaymentIntent>>
  refundPaymentIntent(
    paymentIntentId: string,
    value: number,
    stripeSecretKey: string
  ): any
  retrievePaymentTransfers(
    transferGroup: string,
    stripeSecretKey: string
  ): Promise<Stripe.Response<Stripe.ApiList<Stripe.Transfer>> | undefined>
  createReversalTransfer(
    amount: number,
    id: string,
    stripeSecretKey: string
  ): any
  createPaymentMethods(
    cardRequest: CardAuthorization & {
      card: Card
    },
    metadata: any,
    stripeSecretKey: string
  ): any
}

export type Installments = {
  installments: Maybe<number>
  installmentsInterestRate: number
  installmentsValue: number
}

export type StripePaymentMethodData = {
  type: any
  billing_details: StripeBillingDetails
  boleto: {
    tax_id: string
  }
}

export type StripeBillingDetails = {
  name: string
  email: string
  address: {
    line1: string
    line2?: string
    city: string
    state: string
    country: string
    postal_code: string
  }
}

export type StripeDefaultConfigs = {
  stripeApiSecret: string
  hasBoletoBeta: boolean
  appVersion: string
}

export type StripePaymentIntentConfigs = {
  amount: number
  currency: string
  orderId: string
  transactionId: string
  paymentId: string
  accountName: string
  captureMethod: Maybe<string>
  transferGroup: Maybe<string>
}

export enum PaymentMethods {
  boleto = 'boleto',
  oxxo = 'oxxo',
  card = 'card',
}

export enum StripeStatus {
  succeeded = 'succeeded',
}

export type StripeTransferMetadata = {
  orderId: string
  paymentId: string
  transactionId: string
  sellerId: string
  sellerName: string
}
