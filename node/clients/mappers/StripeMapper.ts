import { AuthorizationRequest, CreditCardAuthorization, TokenizedCard } from '@vtex/payment-provider'
import { CreatePaymentIntentsPayload, CaptureMethodEnum } from '../dtos/CreatePaymentIntentDto'
import { ConfirmPaymentIntentRequestDto } from '../dtos/ConfirmPaymentIntentRequestDto';

export default class StripeMapper {
	static getPaymentMethodPayload(authorizationRequest: AuthorizationRequest): CreatePaymentMethodDto {
		const authorization = authorizationRequest as CreditCardAuthorization;
		return {
			// TODO: Verify how to define the type
			type: 'card',
			card: {
				// NOTE: Verify how to define if is a Card or a TokenizedCard: defined by using the secure proxy or not. Using: TokenizedCard;
				number: (authorization.card as TokenizedCard).numberToken,
				exp_month: (authorization.card as TokenizedCard).expiration.month,
				exp_year: (authorization.card as TokenizedCard).expiration.year,
				cvc: (authorization.card as TokenizedCard).cscToken,
			}
		}
	}


	static getPaymentIntentPayload(authorizationRequest: AuthorizationRequest): CreatePaymentIntentsPayload {
		return {
			amount: Math.round(authorizationRequest.value * 100),
			currency: authorizationRequest.currency.toLowerCase(),
			// TODO: Verify how to assert the property below
			automatic_payment_methods: {
				enabled: false,
			},
			// TODO: Verify how to assert the capture method
			capture_method: CaptureMethodEnum.MANUAL,
			// TODO: Verify how to assert the property below
			transfer_group: 'ORDER_20',
		}
	}

	static getConfirmPaymentIntentPayload(
		paymentMethodId: string
	): ConfirmPaymentIntentRequestDto {
		return {
			payment_method: paymentMethodId
		}
	}
}
