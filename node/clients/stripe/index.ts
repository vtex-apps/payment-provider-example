import { CardAuthorization, Card } from '@vtex/payment-provider'
import Stripe from 'stripe'

// import stripeClient from '../../libs/stripe'
import {
  StripeSDK,
  PaymentMethods,
  StripePaymentIntentConfigs,
  StripePaymentMethodData,
} from './types'

const stripeSDK: StripeSDK = {
  createPaymentIntent: async (
    intentConfigs: StripePaymentIntentConfigs,
    paymentMethodTypes: PaymentMethods[],
    confirm: boolean,
    stripeSecretKey: string,
    paymentMethodData?: StripePaymentMethodData
  ) => {
    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

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

    const intent = await stripe.paymentIntents.create(data)

    return intent
  },

  updatePaymentIntent: async (
    paymentIntentId: string,
    paymentMethodId: string,
    stripeSecretKey: string
  ) => {
    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

    const intent = await stripe.paymentIntents.update(paymentIntentId, {
      payment_method: paymentMethodId,
    })

    return intent
  },
  refundPaymentIntent: async (
    paymentIntentId: string,
    value: number,
    stripeSecretKey: string
  ) => {
    const valueToRefundInCents = value * 100

    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

    const paymentRefundend = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: valueToRefundInCents,
    })

    return paymentRefundend
  },
  createPaymentMethods: async (
    cardRequest: CardAuthorization & {
      card: Card
    },
    metadata: any,
    stripeSecretKey: string
  ) => {
    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

    const data: any = {
      type: 'card',
      metadata: { ...metadata },
      card: {
        exp_month: cardRequest.card.expiration.month,
        exp_year: cardRequest.card.expiration.year,
        number: cardRequest.card.number,
        cvc: cardRequest.card.csc,
      },
    }

    const intent = await stripe.paymentMethods.create(data)

    return intent
  },
  retrievePaymentTransfers: async (
    transferGroup: string,
    stripeSecretKey: string
  ) => {
    const data: any = {
      transferGroup,
    }

    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

    const transfers = await stripe.transfers.list(data)

    return transfers
  },
  createReversalTransfer: async (
    amount: number,
    id: string,
    stripeSecretKey: string
  ) => {
    const data: any = {
      amount,
    }

    const stripe = new Stripe(stripeSecretKey, {
      appInfo: {
        name: 'Stripe Official VTEX',
        version: '1',
        url: 'https://www.stripe.com/partners/vtex',
      },
    })

    const transfer = await stripe.transfers.createReversal(id, data)

    return transfer
  },
}

export default stripeSDK
