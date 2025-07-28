import { PaymentIntentStatusEnum } from "./ConfirmPaymentIntentResponseDto"

export interface CapturePaymentIntentResponseDto {
  id: string
  object: 'payment_intent'
  amount: number
  amount_capturable: number
  amount_details: {
    tip: Record<string, never>
  }
  amount_received: number
  application: string | null
  application_fee_amount: number | null
  automatic_payment_methods: unknown | null
  canceled_at: number | null
  cancellation_reason: string | null
  capture_method: 'automatic' | 'manual'
  client_secret: string
  confirmation_method: 'automatic' | 'manual'
  created: number
  currency: string
  customer: string | null
  description: string | null
  last_payment_error: unknown | null
  latest_charge: string | null
  livemode: boolean
  metadata: Record<string, string>
  next_action: unknown | null
  on_behalf_of: string | null
  payment_method: string | null
  payment_method_options: Record<string, unknown>
  payment_method_types: string[]
  processing: unknown | null
  receipt_email: string | null
  redaction: unknown | null
  review: string | null
  setup_future_usage: string | null
  shipping: unknown | null
  statement_descriptor: string | null
  statement_descriptor_suffix: string | null
  status: PaymentIntentStatusEnum,
  transfer_data: unknown | null
  transfer_group: string | null
}
