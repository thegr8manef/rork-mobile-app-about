/**
 * ============================================================
 * Bill of Exchange Types
 * ============================================================
 */

export interface Currency {
  alphaCode: string;
  numericCode: string;
  designation: string;
}

export interface BillType {
  code: string;
  designation: string;
}

export interface PaymentType {
  code: string;
  designation: string;
}

export interface BillReason {
  code: string;
  designation: string;
}

export interface BillOfExchangeRecord {
  id: string;
  billNumber: string;
  amount: string;
  currency: Currency;
  remittanceDate: string;
  instalmentDate: string;
  type: BillType;
  paymentType: PaymentType;
  remitterAccount: string;
  remitterBranch: string;
  remitterBankCode: string;
  remitterRib: string;
  remitterName: string;
  draweeAccount: string;
  draweeBranch: string;
  draweeBankCode: string | null;
  draweeRib: string;
  draweeName: string | null;
  outcome: string;
  outcomeDate: string;
  reason: BillReason;
  sens: "C" | "D";
  remittanceNumber: string;
}

export interface BillOfExchangeListResponse {
  count: number;
  data: BillOfExchangeRecord[];
}

export type BillImageResponse = string;

// ✅ UPDATED: Added "IMPAID" status
export type BillStatus = "all" | "PAID" | "IMPAID" | "PENDING" | "REJECTED" | "CNP";

export interface BillFilterParams {
  sens?: "D" | "C";
  accountId?: string;
  billNumber?: string;
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  billReceivedType?: string;
  outcome?: string;
  draweeName?: string;
  remitterName?: string;
  remittanceNumber?: string;
  codeType?: string;
  rib?: string;
  typeEffet?: string;
  bankCode?: string;
  billType?: string; // ✅ ADDED: New bill type filter
}