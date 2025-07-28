import type { InstanceOptions, IOContext, RequestConfig } from '@vtex/api'
import { URLSearchParams } from 'url'
import { CreatePaymentMethodResponseDto } from './dtos/CreatePaymentMethodResponseDto'
import { SecureExternalClient } from '@vtex/payment-provider'

export default class StripePCIClient extends SecureExternalClient {
  constructor(context: IOContext, options?: InstanceOptions) {
    super('http://api.stripe.com', context,
      {
        ...options, headers: { 'X-Vtex-Use-Https': 'true', 'Content-Type': 'application/x-www-form-urlencoded' }
      })
  }

  public async paymentMethods(
    paymentMethodsPayload: CreatePaymentMethodDto,
    secureProxyUrl: string,
    apiKey: string,
  ): Promise<CreatePaymentMethodResponseDto> {
    const params = new URLSearchParams()

    params.append('type', paymentMethodsPayload.type);
    params.append('card[number]', paymentMethodsPayload.card.number);
    params.append('card[exp_month]', paymentMethodsPayload.card.exp_month.toString());
    params.append('card[exp_year]', paymentMethodsPayload.card.exp_year.toString());
    params.append('card[cvc]', paymentMethodsPayload.card.cvc);

    const config = {
      headers: {
        Authorization: `Bearer ${apiKey}`
      },
      secureProxy: secureProxyUrl,
    } as RequestConfig;

    return await this.http.post('/v1/payment_methods', params.toString(), config);
  }
}
