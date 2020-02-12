import { IncomingHttpHeaders } from 'http'

import { contains } from 'ramda'
import { Enum } from 'typescript-string-enums'

export type Maybe<T> = T | undefined
export const RecipientRole = Enum('marketplace', 'seller')
export type RecipientRole = Enum<typeof RecipientRole>

export const DocumentType = Enum('CNPJ', 'CPF', 'SSN')
export type DocumentType = Enum<typeof DocumentType>

export interface Recipient {
  id: string
  name: string
  documentType: DocumentType
  document: string
  role: RecipientRole
  chargeProcessingFee: boolean
  chargebackLiable: boolean
  amount: number
}

export interface Card {
  number: string
  holder: string
  expiration: Expiration
  csc: string
  document: unknown
}

export interface Expiration {
  month: string
  year: string
}

export interface MiniCart {
  buyer: Buyer
  shippingAddress: Maybe<Address>
  billingAddress: Maybe<Address>
  items: Maybe<Item[]>
  shippingValue: Maybe<number>
  taxValue: Maybe<number>
}

export interface Buyer {
  id: Maybe<string>
  firstName: string
  lastName: string
  document: string
  documentType: Maybe<string>
  corporateName: Maybe<string>
  tradeName: Maybe<string>
  corporateDocument: Maybe<string>
  isCorporate: Maybe<boolean>
  email: Maybe<string>
  phone: Maybe<string>
  createdDate: Maybe<Date>
}

export interface Address {
  country: Maybe<string>
  street: Maybe<string>
  number: Maybe<string>
  complement: Maybe<string>
  neighborhood: Maybe<string>
  postalCode: Maybe<string>
  city: Maybe<string>
  state: Maybe<string>
}

export interface Item {
  id: Maybe<string>
  name: Maybe<string>
  price: Maybe<number>
  quantity: Maybe<number>
  discount: Maybe<number>
  deliveryType: Maybe<string>
}

export interface AppData {
  appName: Maybe<string>
  payload: Maybe<string>
}

export interface PaymentIdParam {
  paymentId: string
}

export interface AuthenticationHeaders extends IncomingHttpHeaders {
  ['x-vtex-api-appkey']: string | string[] | undefined
  ['x-vtex-api-apptoken']: string | string[] | undefined
  ['x-vtex-api-is-testsuite']: string | string[] | undefined
}

export const DebitCard = Enum('Visa Electron', 'Maestro', 'Mastercard Debit')
export type DebitCard = Enum<typeof DebitCard>

export const CreditCard = Enum(
  'Visa',
  'Mastercard',
  'American Express',
  'Discover',
  'JCB',
  'Diners',
  'Elo',
  'Hipercard',
  'Aura',
  'Benricompras',
  'Credz',
  'Cabal'
)
export type CreditCard = Enum<typeof CreditCard>

export const AdhocCard = Enum('Cobranded', 'Privatelabels')
export type AdhocCard = Enum<typeof AdhocCard>

export const BankInvoice = Enum('BankInvoice')
export type BankInvoice = Enum<typeof BankInvoice>

export const Generic = Enum('Promissories', 'Cash')
export type Generic = Enum<typeof Generic>

export const Voucher = Enum('SPEI', 'Safetypay')
export type Voucher = Enum<typeof Voucher>

export const Cryptocurrency = Enum('Bitcoin')
export type Cryptocurrency = Enum<typeof Cryptocurrency>

export type PaymentMethod =
  | CreditCard
  | DebitCard
  | AdhocCard
  | Generic
  | BankInvoice
  | Voucher
  | Cryptocurrency

export interface AvailablePaymentsResponse {
  paymentMethods: PaymentMethod[]
}

export interface CancellationRequest extends PaymentRequest {
  authorizationId: string
}

export interface CancellationResponse extends PaymentRequest {
  cancellationId: Maybe<string>
  code: Maybe<'cancel-manually'>
  message: Maybe<string>
}

export interface PaymentRequest {
  transactionId: string
  paymentId: string
  requestId: string
}

export interface Authorization extends PaymentRequest {
  reference: string
  orderId: string
  paymentMethod: PaymentMethod
  paymentMethodCustomCode: Maybe<string>
  merchantName: string
  value: number
  currency: string
  installments: Maybe<number>
  deviceFingerprint: Maybe<string>
  ipAddress: Maybe<string>
  miniCart: MiniCart
  url: Maybe<string>
  callbackUrl: string
  inboundRequestsUrl: string
  returnUrl: Maybe<string>
}

export interface CardAuthorization extends Authorization {
  card: Card
  paymentMethod: CreditCard | DebitCard | AdhocCard
}

export interface CreditCardAuthorization extends CardAuthorization {
  paymentMethod: CreditCard
}

export interface DebitCardAuthorization extends CardAuthorization {
  paymentMethod: DebitCard
}

export interface AdhocCardAuthorization extends CardAuthorization {
  paymentMethod: AdhocCard
}

export interface BankInvoiceAuthorization extends Authorization {
  paymentMethod: BankInvoice
}

export type AuthorizationRequest =
  | CreditCardAuthorization
  | DebitCardAuthorization
  | AdhocCardAuthorization
  | BankInvoiceAuthorization
  | Authorization

export const isCardAuthorization = (
  authorization: AuthorizationRequest
): authorization is CardAuthorization =>
  typeof (authorization as CardAuthorization).card !== 'undefined'

export const isCreditCardAuthorization = (
  authorization: AuthorizationRequest
): authorization is CreditCardAuthorization =>
  contains(authorization.paymentMethod, Enum.values(CreditCard))

export const isDebitCardAuthorization = (
  authorization: AuthorizationRequest
): authorization is CreditCardAuthorization =>
  contains(authorization.paymentMethod, Enum.values(DebitCard))

export const isBankInvoiceAuthorization = (
  authorization: AuthorizationRequest
): authorization is CardAuthorization =>
  authorization.paymentMethod === 'BankInvoice'

type AuthorizationStatus = 'approved' | 'denied' | 'undefined'

export interface PaymentResponse {
  paymentId: string
  code: Maybe<string>
  message: Maybe<string>
}

export interface Authorized extends PaymentResponse {
  status: AuthorizationStatus
  tid: Maybe<string>
  acquirer: Maybe<string>
  paymentAppData: Maybe<AppData>
}

export interface ApprovedAuthorization extends Authorized {
  tid: string
  authorizationId: string
  nsu: string
}

export interface CreditCardAuthorized extends ApprovedAuthorization {
  delayToAutoSettle: Maybe<number>
  delayToAutoSettleAfterAntifraud: Maybe<number>
}

export interface BankInvoiceAuthorized extends ApprovedAuthorization {
  paymentUrl: string
  identificationNumber: Maybe<string>
  identificationNumberFormatted: Maybe<string>
  barCodeImageType: Maybe<string>
  barCodeImageNumber: Maybe<string>
  delayToCancel: Maybe<number>
}

export interface FailedAuthorization extends Authorized {
  status: 'denied'
}

export interface UndefinedAuthorization extends Authorized {
  status: 'undefined'
  delayToCancel: number
}

export type AuthorizationResponse =
  | ApprovedAuthorization
  | CreditCardAuthorized
  | BankInvoiceAuthorized
  | FailedAuthorization
  | UndefinedAuthorization

export interface SettlementRequest extends PaymentRequest {
  value: number
  authorizationId: string
  recipients: Maybe<Recipient[]>
}

export interface SettlementResponse extends PaymentResponse {
  settleId: Maybe<string>
  value: number
  requestId: string
}

export interface RefundRequest extends PaymentRequest {
  value: number
  settleId: string
  recipients: Maybe<Recipient[]>
}

export interface RefundResponse extends PaymentResponse {
  requestId: string
  refundId: Maybe<string>
  value: number
}

export interface InboundRequest extends PaymentRequest {
  authorizationId: string
  tid: string
  requestData: { body: string }
}

export interface InboundResponse extends PaymentResponse {
  responseData: {
    statusCode: number
    contentType: string
    content: string
  }
  requestId: string
}
