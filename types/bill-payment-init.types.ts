// this class is for two request post (/api/payment-means/bill-payments/confirm,/api/payment-means/bill-payments/init)
export enum BillPaymentInitStatus {
  INIT = 'INIT',
  TRANSFER = 'TRANSFER',
  PENDING = 'PENDING'

}
export interface BillPaymentInit {
    billPaymentStatus:BillPaymentInitStatus,
    billerId: string,
    invoiceId: string,
    paymentAmount: number,
    requestedAmount: number,
    sourceAccount: string,
    paymentMean: BillPaymentInitStatus,
    transactionId: string,
    createdAt: string,
    updatedAt: string
}
export interface BillPaymentConfirm {
    id: string,
    billPaymentStatus:BillPaymentInitStatus,
    billerId: string,
    invoiceId: string,
    paymentAmount: number,
    requestedAmount: number,
    sourceAccount: string,
    paymentMean: BillPaymentInitStatus,
    updatedAt: string
}
export type PaymentInitResponse = BillPaymentInit;
export type PaymentConfirmResponse = BillPaymentConfirm;