import type { InstanceOptions, IOContext } from '@vtex/api'
import { ExternalClient } from '@vtex/api'
import { CreatePaymentIntentsPayload } from './dtos/CreatePaymentIntentDto'
import { URLSearchParams } from 'url'
import { CreatePaymentIntentResponseDto } from './dtos/CreatePaymentIntentResponseDto'
import { ConfirmPaymentIntentResponseDto } from './dtos/ConfirmPaymentIntentResponseDto'
import { ConfirmPaymentIntentRequestDto } from './dtos/ConfirmPaymentIntentRequestDto'
import { CreatePaymentMethodResponseDto } from './dtos/CreatePaymentMethodResponseDto'

export default class Stripe extends ExternalClient {
	constructor(context: IOContext, options?: InstanceOptions) {
		super('https://api.stripe.com', context, {
			...options,
			headers: {
				Authorization: '',
			},
		})
	}

	public async paymentIntents(
		paymentIntentsPayload: CreatePaymentIntentsPayload
	): Promise<CreatePaymentIntentResponseDto> {
		const params = new URLSearchParams();

		params.append('amount', paymentIntentsPayload.amount.toString());
		params.append('currency', paymentIntentsPayload.currency);
		params.append('capture_method', paymentIntentsPayload.capture_method || 'automatic');
		params.append('transfer_group', paymentIntentsPayload.transfer_group || '');

		if (paymentIntentsPayload.automatic_payment_methods) {
			params.append('automatic_payment_methods[enabled]', String(paymentIntentsPayload.automatic_payment_methods.enabled));
		}

		const config = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			metric: 'stripe-payment-intents',
		}

		return this.http.post('/v1/payment_intents', params.toString(), config);
	}

	public async paymentMethods(
		paymentMethodsPayload: CreatePaymentMethodDto,
		context: Context,
	): Promise<CreatePaymentMethodResponseDto> {
		const params = new URLSearchParams()
		const secureProxyClient = context.clients.secureProxy;

		params.append('type', paymentMethodsPayload.type);
		params.append('card[number]', paymentMethodsPayload.card.number);
		params.append('card[exp_month]', paymentMethodsPayload.card.exp_month.toString());
		params.append('card[exp_year]', paymentMethodsPayload.card.exp_year.toString());
		params.append('card[cvc]', paymentMethodsPayload.card.cvc);

		const config = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'X-PROVIDER-Forward-To': `${this.options?.baseURL}/v1/payment_methods`,
			},
			metric: 'stripe-confirm-payment',
		} as InstanceOptions;

		const response = await secureProxyClient.applyProxy<CreatePaymentMethodResponseDto>(params.toString(), config);

		return response;
	}


	public async confirmPayment(
		payload: ConfirmPaymentIntentRequestDto,
		intentId: string
	): Promise<ConfirmPaymentIntentResponseDto> {
		const params = new URLSearchParams()
		params.append('payment_method', payload.payment_method)

		const config = {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			metric: 'stripe-confirm-payment',
		}

		return this.http.post(
			`/v1/payment_intents/${intentId}/confirm`,
			params.toString(),
			config
		)
	}
}
