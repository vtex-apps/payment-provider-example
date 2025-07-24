interface CreatePaymentMethodDto {
  type: string
  card: {
    number: string
    exp_month: string | number
    exp_year: string | number
    cvc: string
  }
}
