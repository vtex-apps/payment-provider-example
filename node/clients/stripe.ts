import { CreatePaymentIntentsPayload } from './dtos/CreatePaymentIntentDto'
import { URLSearchParams } from 'url'
import { CreatePaymentIntentResponseDto } from './dtos/CreatePaymentIntentResponseDto'
import { ConfirmPaymentIntentResponseDto } from './dtos/ConfirmPaymentIntentResponseDto'
import { ConfirmPaymentIntentRequestDto } from './dtos/ConfirmPaymentIntentRequestDto'
import { ExternalClient, InstanceOptions, IOContext, RequestConfig } from '@vtex/api'
import { CapturePaymentIntentResponseDto } from './dtos/CapturePaymentIntentResponseDto'
import { CancelPaymentIntentResponseDto } from './dtos/CancelPaymentIntentResponseDto'
import { AxiosError } from 'axios'

export default class StripeClient extends ExternalClient {
	constructor(context: IOContext, options?: InstanceOptions) {
		super('http://api.stripe.com', context,
			{
				...options, timeout: 10000, headers: { 'X-Vtex-Use-Https': 'true', 'Content-Type': 'application/x-www-form-urlencoded' }
			})
		// super('https://api.stripe.com', context,
		// 	{
		// 		...options, headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
		// 	})
	}

	public async paymentIntents(
		paymentIntentsPayload: CreatePaymentIntentsPayload,
		apiKey: string,
	): Promise<CreatePaymentIntentResponseDto> {
		const params = new URLSearchParams();

		params.append('amount', paymentIntentsPayload.amount.toString());
		params.append('currency', paymentIntentsPayload.currency);
		params.append('capture_method', paymentIntentsPayload.capture_method || 'automatic');
		params.append('transfer_group', paymentIntentsPayload.transfer_group || '');

		if (paymentIntentsPayload.automatic_payment_methods) {
			params.append('automatic_payment_methods[enabled]', String(paymentIntentsPayload.automatic_payment_methods.enabled));
		}

		const config: RequestConfig = {
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			metric: 'stripe-payment-intents',
		};

		return this.http.post('/v1/payment_intents', params.toString(), config);
	}

	public async confirmPayment(
		payload: ConfirmPaymentIntentRequestDto,
		intentId: string,
		apiKey: string,
	): Promise<ConfirmPaymentIntentResponseDto> {
		const params = new URLSearchParams()
		params.append('payment_method', payload.payment_method);
		params.append('return_url', '')

		const config: RequestConfig = {
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			metric: 'stripe-confirm-payment',
		};

		return this.http.post(
			`/v1/payment_intents/${intentId}/confirm`,
			params.toString(),
			config
		)
	}

	public async captureIntent(
		intentId: string,
		apiKey: string,
	): Promise<CapturePaymentIntentResponseDto> {
		const config: RequestConfig = {
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			metric: 'stripe-confirm-payment',
		};

		return this.http.post(
			`/v1/payment_intents/${intentId}/capture`,
			undefined,
			config
		)
	}

	public async cancelIntent(
		intentId: string,
		apiKey: string,
	): Promise<{ success: boolean, data: CancelPaymentIntentResponseDto | null, errorMessage?: string | null }> {
		const config: RequestConfig = {
			headers: {
				Authorization: `Bearer ${apiKey}`
			},
			metric: 'stripe-confirm-payment',
		};

		try {
			const response = await this.http.post<CancelPaymentIntentResponseDto>(
				`/v1/payment_intents/${intentId}/cancel`,
				null,
				config
			);

			return { success: true, data: response };
		} catch (error) {
			const exception = error as AxiosError;
			let errorMessage: string | null = null;
			let success = false;
			
			const stripeErrorData = exception.response?.data ?? null;
			const isAlreadyCancelled = stripeErrorData ? stripeErrorData?.error?.payment_intent?.status === 'canceled' : false;
			if (isAlreadyCancelled) success = true;

			if (!isAlreadyCancelled) {
				errorMessage = stripeErrorData ? stripeErrorData.error.message : exception.message;
			}

			return { success, data: stripeErrorData.error ?? null, errorMessage: success ? null : errorMessage };
		}
	}
}
