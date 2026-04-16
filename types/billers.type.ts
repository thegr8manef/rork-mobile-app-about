/**
 * ============================================================
 * Biller Types
 * ============================================================
 */

import { BillPaymentInitStatus } from "./bill-payment-init.types";

export interface BillerCategory {
  categoryCode: string;
  categoryLabel: string;
}

export interface BillerOption {
  value: string;
  label: string;
}

export interface BillerLabel {
  value: string;
  label: string;
}

export interface BillerSearchCriteria {
  id: number;
  label: BillerLabel;
  type: "input" | "select";
  groupId: string;
  groupLabel: string;
  options: BillerOption[];
  isRequired: string | null;
  showInFormCondition: boolean;
  refRegexPattern: string | null;
}

export interface Biller {
  id: string;
  label: string;
  type: "invoices" | "recharges";
  category: BillerCategory;
  iconUrl: string;
  clientIdentityRequired: string | null;
  enabled: boolean;
  searchCriteria: BillerSearchCriteria[];
}

/**
 * List response
 */
export type BillerListResponse = Biller[];
/**
 * ============================================================
 * Bill Payment (Init + Confirm)
 * ============================================================
 */

/**
 * INIT — request body
 */
export interface InitBillRequest {
  billerId: string;
  paymentMean: "TRANSFER"; // extend later if needed
  sourceAccountId: string;
  invoiceId: string;
  paymentAmount: string;
  requestedAmount: string;
}

/**
 * INIT — response body
 */
export interface InitBillResponse {
  id: string;
  billPaymentStatus: string; // e.g. "INIT"
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

/**
 * CONFIRM — request body
 */
export interface ConfirmBillRequest {
  requestId: string;
  confirmationMethod: "TOTP" | "OTP" | string;
  confirmationValue: string;
}

/**
 * CONFIRM — response body
 * (temporary — we’ll update when you share the real payload)
 */
export type ConfirmBillResponse = unknown;
/* -------------------------------------------------------------------------- */
/*                                Types (RAW)                                 */
/* -------------------------------------------------------------------------- */

/** GET /billers */
export interface BillersApiResponse {
  count: number;
  data: {
    id: string;
    label: string;
    type: "invoices" | "recharges";
    category: { categoryCode: string; categoryLabel: string };
    iconUrl: string;
    clientIdentityRequired: any;
    enabled: boolean;
    searchCriteria: {
      id: number;
      label: { value: string; label: string };
      type: "select" | "input";
      groupId: string;
      groupLabel: string;
      options: { value: string; label: string }[];
      isRequired: string;
      showInFormCondition: boolean;
      refRegexPattern: string | null;
    }[];
  }[];
}
/** GET /contracts */
export interface ContractsApiResponse {
  count: number;
  data: {
    id: string;
    billerId: string;
    isFavorite: boolean;
    label: string;
    searchCriterias: { searchCriteria: string; searchCriteriaValue: string }[];
  }[];
}

/** GET /bills */
export interface SearchBillsParams {
  billerId: string;
  searchCriteriaValue: string;
  searchCriteriaLabel: string;
  reloadAmount?: string;
  contractLabel?: string;
  isFavorite?: boolean;
}

export interface SearchBillsApiResponse {
  count: number;
  data: {
    id: string;
    billNumber: string;
    amount: string;
    description: string;
    biller: string;
    billerAuthIds: string[];
    objectRef: string;
    objectOriginalAmount: string;
    objectAmountToPay: string;
    amountCurrency: string;
    amountDecimals: string;
    objectDate: string;
    paymentStatus: string;
    acceptedPaymentModes: { paymentMode: string; destinationAccount: string }[];
    requestedAmount: string;
  }[];
}

/** GET /bill-payments */
export interface BillPaymentsApiResponse {
  count: number;
  data: {
    id: string;
    serviceType: string | null;
    transactionCode: string | null;
    billPaymentStatus?: "INIT" | "PAID" | "REJECTED";
    transactionStatus?: "INIT" | "PAID" | "REJECTED";
    customerId?: string;
    billerId: string;
    objectId?: string;
    objectReference?: string;
    billerAuthIds?: string[];
    rejectionReason: string | null;
    transactionReference?: string | null;
    originalAmount: any;
    paymentAmount: any;
    taxAmount?: any;
    discount?: any;
    paymentDate: string;
    sourceAccount?: string | null;
    destinationAccount: string;
    paymentReceipt: string;
    paymentCanal?: string | null;
    paymentMode: string;
    paymentMean?: string;
    clicToPayData?: string | null;
    requestedAmount: any;
    invoiceId?: string; // backend sends it in logs
  }[];
}

/* INIT */
export interface InitBillPaymentRequest {
  billerId: string;
  invoiceId: string;
  paymentAmount: string;
  paymentMean: string;
  requestedAmount: string;
  sourceAccountId: string;
}

/* CONFIRM */
export interface ConfirmBillPaymentRequest {
  requestId: string;
  confirmationMethod: "TOTP" | "CHALLENGE";
  confirmationValue?: string;
  challengeConfirmationValue?: BillChallengeConfirmationValue;
}
export type BillChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};
