/**
 * ============================================================
 * API: Cheque List
 * ============================================================
 * Description:
 * Returns detailed information about cheque transactions
 * linked to one or more bank accounts.
 *
 * Path Parameters:
 * - sens: 'D' | 'C'
 *   - 'D' → Debit (payer)
 *   - 'C' → Credit (encaissement)
 *
 * Query / Path Parameters:
 * - accountUUIDs: string[]
 *   - List of account IDs for which cheques are requested
 *
 * Response:
 * - count: total number of cheque records
 * - data: list of cheque transaction details
 * ============================================================
 */

export interface NatureCheque {
  /** Internal code describing the cheque nature */
  code: string;

  /** Human-readable description of the cheque nature */
  designation: string;
}

export interface CheckRecord {
  /** Internal unique identifier */
  id: string;

  /** External system identifier */
  externalId: string;

  /** Cheque amount */
  amount: string;

  /** Remittance number (nullable if not applicable) */
  remittanceNumber: string | null;

  /** Cheque number printed on the cheque */
  checkNumber: string;

  /** Date when the cheque was remitted */
  remittanceDate: string;

  /** Outcome status of the cheque (paid, rejected, pending, etc.) */
  outcome: string;

  /** Date when the payment was processed */
  paymentDate: string;

  /** Currency code (ISO format) */
  currency: string;

  /** Name of the drawee (payer) */
  draweeName: string;

  /** RIB of the drawee */
  draweeRib: string;

  /** Account number of the drawee */
  draweeAccount: string;

  /** Branch of the drawee */
  draweeBranch: string;

  /** Bank code of the drawee */
  draweeBankCode: string;

  /** Branch of the remitter (nullable) */
  remitterBranch: string | null;

  /** Bank code of the remitter (nullable) */
  remitterBankCode: string | null;

  /** Account number of the remitter */
  remitterAccount: string;

  /** RIB of the remitter */
  remitterRib: string;

  /** Name of the remitter */
  remitterName: string;

  /** Date of the cheque outcome (acceptance or rejection) */
  outcomeDate: string;

  /** Reason for rejection (empty or filled depending on outcome) */
  rejectionReason: string;

  /** Nature/type of the cheque */
  natureCheque: NatureCheque;
}

export interface CheckListResponse {
  /** Total number of cheques */
  count: number;

  /** List of cheque records */
  data: CheckRecord[];

  /** Current page number */
  page?: number;

  /** Items per page */
  limit?: number;

  /** Total pages available */
  totalPages?: number;

  /** Has more pages */
  hasMore?: boolean;
}

/**
 * ============================================================
 * Cheque Filter Parameters
 * ============================================================
 */
export interface ChequeFilterParams {
  accountIds?: string | string[];
  chequeNumber?: string | string[];
  outcome?: string | string[];
  minAmount?: number;
  maxAmount?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  remittanceNumber?: string | string[];
  sens?: "D" | "C";
  startChequeNumber?: string;
  endChequeNumber?: string;
  status?: string;
  derCorresp?: string | string[];
  rib?: string;
  natureCode?: string;
  bankCode?: string;
}

//////////////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================
 * API: Cheque Image
 * ============================================================
 * Description:
 * Returns the raw Base64-encoded image of a cheque.
 *
 * Parameters:
 * - accountUUID: string
 *   - Account ID used to fetch the cheque image
 *
 * Response:
 * - Base64 string representing the cheque image
 * ============================================================
 */

export type CheckImageResponse = string;

//////////////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================
 * API: Checkbook Requests List
 * ============================================================
 * Description:
 * Returns the list of checkbook requests with their
 * current status and associated branch information.
 * ============================================================
 */

export interface Branch {
  /** Branch code */
  code: string;

  /** Branch name/label */
  designation: string | null;
}

export interface CheckbookRequest {
  /** Unique request identifier */
  id: string;

  /** Current request status */
  requestStatus: string;

  /** Date when the request was submitted */
  requestDate: string;

  /** Branch where the checkbook will be delivered */
  branch: Branch;

  /** Currency of the checkbook */
  currency: string;
}

export interface CheckbookResponse {
  /** Total number of requests */
  count: number;

  /** List of checkbook requests */
  data: CheckbookRequest[];
}

//////////////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================
 * API: /chequeBook-request/init
 * ============================================================
 * Description:
 * Request body used to initialize a new checkbook request.
 * ============================================================
 */

export interface InitCheckbookRequest {
  /** Type of cheque book (standard, certified, etc.) */
  chequeBookType: string;

  /** Number of cheque books requested */
  chequeBookNumber: number;

  /** Account ID linked to the cheque book */
  accountId: string;
}
export interface InitCheckbookResponse {
  id: string;
  requestStatus: string;
  accountNumber: string;
  chequeBookType: string;
  userId: string;
}
//////////////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================
 * API: /chequeBook-request/confirm (Request Body)
 * ============================================================
 * Description:
 * Payload used to confirm a checkbook request,
 * typically via OTP or another confirmation method.
 * ============================================================
 */

export interface ConfirmCheckbookRequest {
  /** Checkbook request ID */
  requestId: string;

  /** Confirmation method (OTP, PIN, BIOMETRIC, etc.) */
  confirmationMethod: string;

  /** Confirmation value (OTP code, token, etc.) */
  confirmationValue: string;
}

//////////////////////////////////////////////////////////////////////////////////////////

/**
 * ============================================================
 * API: /chequeBook-request/confirm (Response)
 * ============================================================
 * Description:
 * Returned after a successful confirmation
 * of a checkbook request.
 * ============================================================
 */

export interface ConfirmCheckbookResponse {
  /** Confirmed request ID */
  id: string;

  /** Final status of the request */
  requestStatus: string;

  /** Linked account number */
  accountNumber: string;

  /** Type of cheque book requested */
  chequeBookType: string;

  /** User who initiated the request */
  userId: string;
}

export type CustomerAccount = {
  id: string;
  accountNumber: string;
  accountTitle: string;

  ribFormatAccount: string;
  ibanFormatAccount: string;

  accountingBalance: string;
  availableBalance: string;

  currencyAlphaCode: string;

  branchDesignation?: string;
};