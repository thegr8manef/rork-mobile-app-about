// types/bills.types.ts

export type PaymentMode = 'W' | 'C' | 'V' | (string & {});

export type BillPaymentStatus = 'Active' | 'Paid' | (string & {});

export interface AcceptedPaymentMode {
  paymentMode: PaymentMode;
  destinationAccount: string;
}

/**
 * Raw bill shape returned by your backend API (based on your JSON example).
 */
export interface BillApiModel {
  id: string;
  biller: string;
  billerAuthIds: string[];
  objectRef: string;
  description?: string;
  objectOriginalAmount?: string;
  objectAmountToPay?: string;
  amountCurrency?: string;
  amountDecimals?: string;
  objectDate?: string; // ISO string
  paymentStatus: BillPaymentStatus;
  acceptedPaymentModes?: AcceptedPaymentMode[];
  requestedAmount?: string;
}

export interface SearchBillsApiResponse {
  count: number;
  data: BillApiModel[];
}

/**
 * App-level Bill model you use in UI.
 */
export interface Bill {
  id: string;
  billNumber?: string;

  amount: string;
  description?: string;

  status: 'pending' | 'paid';

  // Keep all useful backend fields too
  biller: string;
  billerAuthIds: string[];
  objectRef: string;

  objectOriginalAmount?: string;
  objectAmountToPay?: string;

  amountCurrency?: string;
  amountDecimals?: string;

  objectDate?: string;
  paymentStatus: BillPaymentStatus;

  acceptedPaymentModes?: AcceptedPaymentMode[];

  requestedAmount?: string;
}

/**
 * Params for searching bills (NO side effects).
 */
export interface ToggleFavoriteBillsParams {
  billerId: string;
  searchCriteriaValue: string;
  searchCriteriaLabel: string;
  reloadAmount?: string;
  contractLabel?: string;
  isFavorite: boolean;
}

/**
 * Params for adding favorite (side-effect).
 * Same fields but force isFavorite: true.
 */
export type AddBillsToFavoriteParams = ToggleFavoriteBillsParams
