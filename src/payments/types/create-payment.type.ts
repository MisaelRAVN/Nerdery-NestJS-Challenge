export interface CreatePaymentType {
  orderId: string;
  customerId: string;
  amountInCents: number;
  currency: string;
}
