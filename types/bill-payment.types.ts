import { ApiBillerListResponse } from "./commonBillers.type";

export interface BillPayment {
  id: string;
  serviceType: string | null;
  transactionCode: string | null;
  transactionStatus: "INIT" | "PAID" | "REJECTED";
  customerId: string;
  billerId: string;
  objectId: string;
  objectReference: string;
  billerAuthIds: string[];
  rejectionReason?: string | null;
  transactionReference?: string | null;
  originalAmount: string;
  paymentAmount: string;
  taxAmount: string | null;
  discount: string | null;
  paymentDate: string;
  sourceAccount: string | null;
  destinationAccount: string;
  paymentReceipt: string;
  paymentCanal: string | null;
  paymentMode: string;
  paymentMean: string;
  clicToPayData: string | null;
  requestedAmount: string;
}

export type PaymentObjectsResponse = ApiBillerListResponse<BillPayment>;
