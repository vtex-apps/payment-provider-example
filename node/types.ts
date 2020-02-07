type Maybe<T> = T | undefined

export enum DocumentType {
  'CNPJ',
  'CPF',
  'SSN',
}
export enum RecipientRole {
  'marketplace',
  'seller',
}

export enum DebitCard {
  'Visa Electron',
  'Maestro',
  'Mastercard Debit',
}
export enum CreditCard {
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
  'Cabal',
}

export enum AdhocCard {
  'Cobranded',
  'Privatelabels',
}

export enum BankInvoice {
  'BankInvoice',
}

export enum Generic {
  'Promissories',
  'Cash',
}

export enum Voucher {
  'SPEI',
  'Safetypay',
}

export enum Cryptocurrency {
  'Bitcoin',
}

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

export interface PaymentCancellationRequest extends PaymentOperationRequest {
  authorizationId: string
}

export interface PaymentCancelationResponse extends PaymentOperationRequest {
  cancellationId: Maybe<string>
  code: Maybe<'cancel-manually'>
  message: Maybe<string>
}

export interface PaymentOperationRequest {
  transactionId: string
  paymentId: string
  requestId: string
}

export interface Authorization extends PaymentOperationRequest {
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

export type PaymentAuthorizationRequest =
  | CreditCardAuthorization
  | DebitCardAuthorization
  | AdhocCardAuthorization
  | BankInvoiceAuthorization
  | Authorization

export const isBankInvoiceAuthorization = (
  authorization: PaymentAuthorizationRequest
): authorization is CardAuthorization =>
  authorization.paymentMethod.toString() === 'BankInvoice'

type AuthorizationStatus = 'approved' | 'denied' | 'undefined'

export interface PaymentOperationResponse {
  paymentId: string
  code: Maybe<string>
  message: Maybe<string>
}

export interface PaymentAuthorization extends PaymentOperationResponse {
  status: AuthorizationStatus
  tid: Maybe<string>
  acquirer: Maybe<string>
  paymentAppData: Maybe<AppData>
}

export interface ApprovedAuthorization extends PaymentAuthorization {
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

export interface FailedAuthorization extends PaymentAuthorization {
  status: 'denied'
}

export interface UndefinedAuthorization extends PaymentAuthorization {
  status: 'undefined'
  delayToCancel: number
}

export type PaymentAuthorizationResponse =
  | ApprovedAuthorization
  | CreditCardAuthorized
  | BankInvoiceAuthorized
  | FailedAuthorization
  | UndefinedAuthorization

export interface PaymentSettlementRequest extends PaymentOperationRequest {
  value: number
  authorizationId: string
  recipients: Maybe<Recipient[]>
}

export interface PaymentSettlementResponse extends PaymentOperationResponse {
  settleId: Maybe<string>
  value: number
  requestId: string
}

export interface PaymentRefundRequest extends PaymentOperationRequest {
  value: number
  settleId: string
  recipients: Maybe<Recipient[]>
}

export interface PaymentRefundResponse extends PaymentOperationResponse {
  requestId: string
  refundId: Maybe<string>
  value: number
}

export interface InboundRequest extends PaymentOperationRequest {
  authorizationId: string
  tid: string
  requestData: { body: string }
}

export interface InboundResponse extends PaymentOperationResponse {
  responseData: {
    statusCode: number
    contentType: string
    content: string
  }
  requestId: string
}
