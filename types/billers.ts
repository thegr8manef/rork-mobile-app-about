export type BillerCategory =
  | "electricity"
  | "water"
  | "gas"
  | "telecom"
  | "internet"
  | "insurance"
  | "other";

export interface SearchCriterionOption {
  value: string;
  label: string;
}

export interface SearchCriterion {
  id: number;
  label: {
    value: string;
    label: string;
  };
  type: "select" | "input";
  groupId: string;
  groupLabel: string;
  options: SearchCriterionOption[];
  isRequired: string;
  showInFormCondition: boolean;
  refRegexPattern: string | null;
}

export interface BillerCategoryInfo {
  categoryCode: string;
  categoryLabel: string;
}

export interface Biller {
  id: string;
  billerLabel: string;
  billerType: "invoices" | "recharges";
  billerCategory: BillerCategoryInfo;
  billerIcon: string;
  clientIdentityRequired: any;
  enabled: boolean;
  searchCriteria: SearchCriterion[];
}

export interface BillerContractSearchCriteria {
  searchCriteria: string;
  searchCriteriaValue: string;
}

export interface BillerContract {
  id: string;
  billerId: string;
  label: string;
  isFavorite?: boolean;
  searchCriterias: BillerContractSearchCriteria[];
}

export interface PaymentMode {
  paymentMode: string;
  destinationAccount: string;
}

export interface Bill {
  id: string;
  billNumber?: string;
  amount: string;
  description: string;
  biller?: string;
  billerAuthIds?: string[];
  objectRef?: string;
  objectOriginalAmount?: string;
  objectAmountToPay?: string;
  amountCurrency?: string;
  amountDecimals?: string;
  objectDate?: string;
  paymentStatus?: string;
  acceptedPaymentModes?: PaymentMode[];
  requestedAmount?: string;
}

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
  rejectionReason: string | null;
  transactionReference: string | null;
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

export interface BillPaymentInitRequest {
  billerId: string;
  paymentMean: string;
  sourceAccountId: string;
  invoiceId: string;
  paymentAmount: number;
  requestedAmount: number;
}

export interface BillPaymentInitResponse {
  id: string;
  billPaymentStatus: string;
  billerId: string;
  invoiceId: string;
  paymentAmount: number;
  requestedAmount: number;
  sourceAccount: string;
  paymentMean: string;
  transactionId: string;
  createdAt: string;
  updatedAt: string;
}

export interface BillPaymentConfirmRequest {
  requestId: string;
  confirmationMethod: string;
  confirmationValue: string;
}

export interface BillPaymentConfirmResponse {
  id: string;
  billPaymentStatus: string;
  billerId: string;
  invoiceId: string;
  paymentAmount: number;
  requestedAmount: number;
  sourceAccount: string;
  paymentMean: string;
  transactionId: string;
  updatedAt: string;
}
