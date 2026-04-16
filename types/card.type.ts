/**
 * ============================================================
 * CARD TYPE DEFINITIONS
 * ============================================================
 * 
 * This file contains all TypeScript interfaces and types for 
 * card-related operations including:
 * - Card entities and their properties
 * - Transaction history and limits
 * - API request/response structures
 * - Init/Confirm flow types for card operations
 * 
 * ARCHITECTURE NOTE:
 * Most card operations follow a two-step flow:
 * 1. INIT - Initialize the operation (returns requestId)
 * 2. CONFIRM - Confirm with OTP/TOTP (uses requestId)
 * 
 * Exceptions (direct operations without init):
 * - Enable/Disable card (already uses confirm directly)
 * ============================================================
 */

/* -------------------------------------------------------------------------- */
/*                           CORE CURRENCY TYPES                              */
/* -------------------------------------------------------------------------- */

/**
 * Currency information for account balances and transaction limits.
 * 
 * @property alphaCode - 3-letter ISO currency code (e.g., "TND", "USD", "EUR")
 * @property numericCode - Numeric ISO currency code (e.g., 788 for TND)
 * @property designation - Display name for the currency
 */
export interface Currency {
  alphaCode: string;
  numericCode: number;
  designation: string;
}

/* -------------------------------------------------------------------------- */
/*                          CARD PRODUCT & STATUS                             */
/* -------------------------------------------------------------------------- */

/**
 * Card product details representing the card type/plan.
 * 
 * @example
 * {
 *   code: "VISA_GOLD",
 *   description: "Visa Gold Card"
 * }
 */
export interface CardProduct {
  /** Internal product identifier */
  code: string;
  /** Human-readable product name/description */
  description: string;
}

/**
 * Card status flags indicating current state of the card.
 * 
 * Status values are string-encoded numbers:
 * - activation: "1" = active, "0" = inactive
 * - opposition: "1" = card is blocked/opposed, "0" = normal
 * - perso: "2" = fully personalized, other values = in progress
 */
export interface CardStatus {
  /** Activation status: "1" = active, else inactive */
  activation: string;
  /** Opposition/block status: "1" = opposed/blocked */
  opposition: string;
  /** Personalization status: "2" = fully personalized */
  perso: string;
}

/* -------------------------------------------------------------------------- */
/*                         CARD ACCOUNT & LIMITS                              */
/* -------------------------------------------------------------------------- */

/**
 * Bank account linked to a card for debiting transactions.
 * 
 * A card can have multiple linked accounts.
 * The 'available' balance shows real-time funds available.
 */
export interface CardAccount {
  accountNumber: string;
  available: number;
  typeAvailable: string;
  currency: Currency;
  accountType: string | number;
  accountStatus: string;
  accountCheck: string;
  /** Credit limit for FLEX cards (string from API, e.g. "0.0") */
  creditLimit?: string;
}
/**
 * Transaction limit configuration for a specific transaction type and period.
 * 
 * Limits control spending by transaction type (payment, withdrawal, etc.)
 * and time period (daily, weekly, monthly).
 * 
 * @example
 * {
 *   typetrx: 0,        // Local payment
 *   periodicity: 1,    // Daily
 *   currentLimit: 500,
 *   maxLimit: 1000,
 *   remaing: 300       // 200 TND spent today
 * }
 */
export interface CardLimit {
  /** Transaction type: 0 = local payment, 1 = withdrawal, 2 = international, etc. */
  typetrx: number;
  /** Time period: 1 = daily, 2 = weekly, 3 = monthly */
  periodicity: number;
  /** Currency of the limit */
  currency: Currency;
  /** Current active limit for this type/period */
  currentLimit: number;
  /** Maximum limit allowed by card product */
  maxLimit: number;
  /** Remaining available limit (currentLimit - spent) */
  remaing: number;
}

/* -------------------------------------------------------------------------- */
/*                            MAIN CARD ENTITY                                */
/* -------------------------------------------------------------------------- */

/**
 * Complete card object returned by the cards list API.
 * 
 * Contains all card details including:
 * - Identification (id, cardCode, masked PAN)
 * - Status and product information
 * - Linked accounts and balances
 * - Transaction limits (per-type and global)
 * - Metadata (dates, events)
 */
export interface Card {
  /** Unique card identifier (UUID) */
  id: string;
  /** Card creation timestamp (ISO 8601) */
  createdAt: string | null;
  /** Last update timestamp (ISO 8601) */
  updatedAt: string | null;
  /** Last event type that modified this card */
  lasEventType: string | null;
  /** Timestamp of last event (ISO 8601) */
  lastEventAt: string | null;
  /** Card code/identifier (physical or virtual) */
  cardCode: string;
  /** Masked card number for display (e.g., "************2668") */
  pcipan: string;
  /** Cardholder name as printed on card */
  namePrinted: string;
  /** Card product/plan details */
  product: CardProduct;
  /** Linked phone number (E.164 format, nullable) */
  numTel: string | null;
  /** Card expiry date (ISO 8601 format) */
  expiryDate: string;
  /** Current card status flags */
  cardStatus: CardStatus;
  /** List of linked bank accounts */
  accounts: CardAccount[];
  /** Per-transaction-type spending limits */
  limits: CardLimit[];
  /** Global spending limit across all transaction types */
  globalLimit: number;
  /** Remaining global limit available */
  globalRemaining: number;
  /** Maximum global limit allowed by product */
  maxLimitProduct: number;
  /** Whether card is enabled for international use */
  international: boolean;
  /** Linked reload cards (for prepaid/reloadable cards) */
  reloadCards: any[];
}

/**
 * API response wrapper for card list endpoint.
 * GET /api/payment-means/cards
 */
export interface CardListResponse {
  /** Total number of cards returned */
  count: number;
  /** Array of card objects */
  data: Card[];
}

/**
 * API response for card search by number.
 * GET /api/payment-means/cards?cardNumber=...
 */
export interface CardSearchResponse {
  /** Number of matching cards found */
  count: number;
  /** Array of matching cards */
  data: Card[];
}

/* -------------------------------------------------------------------------- */
/*                          CARD DETAIL VIEW                                  */
/* -------------------------------------------------------------------------- */

/**
 * Detailed card information returned by single card endpoint.
 * GET /api/payment-means/cards/{cardId}
 * 
 * Similar to Card interface but with slightly different field naming
 * (e.g., lastUpdate vs updatedAt, isInternational vs international).
 */
export interface CardCustomerDetails {
  /** Unique card identifier (UUID) */
  id: string;
  /** Last modification timestamp (ISO 8601) */
  lastUpdate: string | null;
  /** Last event type */
  lastEventType: string | null;
  /** Card code */
  cardCode: string;
  /** Masked PAN for display */
  pcipan: string;
  /** Name on card */
  namePrinted: string;
  /** Product information */
  product: {
    code: string;
    designation: string | null;
  };
  /** Linked phone number */
  numTel: string | null;
  /** Expiry date (ISO 8601) */
  expiryDate: string;
  /** Status flags */
  cardStatus: CardStatus;
  /** Linked accounts */
  accounts: CardAccount[];
  /** Transaction limits */
  limits: CardLimit[];
  /** Global limit across all transactions */
  globalLimit: number;
  /** Remaining global limit */
  globalRemaining: number;
  /** Max limit for this product */
  maxLimitProduct: number;
  /** International usage flag */
  isInternational: boolean;
}

/* -------------------------------------------------------------------------- */
/*                         CARD TRANSACTIONS                                  */
/* -------------------------------------------------------------------------- */

/**
 * Transaction processing status.
 * 
 * @property code - Status code from payment processor
 * @property description - Human-readable status (e.g., "ACCEPTÉE", "REFUSÉE")
 */
export interface CardTransactionStatus {
  /** Status code: "0" = accepted, others = various decline reasons */
  code: string;
  /** Localized status description to show user */
  description: string;
}

/**
 * Single card transaction record (purchase, withdrawal, refund, etc.).
 * 
 * Includes original transaction details and conversion to account currency
 * if the transaction was in a foreign currency.
 */
export interface CardTransaction {
  /** Transaction amount in original currency */
  amount: number;
  /** Original transaction currency */
  currency: Currency;
  /** Transaction date (ISO 8601 date string) */
  datetime: string;
  /** Short transaction type label (e.g., "Goods/Service Purchase") */
  shortLabel: string;
  /** Unique transaction reference code */
  transactionRef: string;
  /** Authorization code from payment processor */
  authCode: string;
  /** Processing status and result */
  status: CardTransactionStatus;
  /** Amount converted to account currency (for foreign transactions) */
  convertedAmount: number;
  /** Account currency used for payment */
  accountCurrency: Currency;
  /** Full transaction description (merchant name + location) */
  label: string;
  /** Action type indicator (0 = normal, bank-specific meanings) */
  action: number;
}

/**
 * API response for card transaction history.
 * GET /api/payment-means/cards/{cardId}/transactions
 */
export interface CardTransactionListResponse {
  /** Total number of transactions */
  count: number;
  /** Array of transaction records */
  data: CardTransaction[];
}

/**
 * Filter parameters for transaction history queries.
 * 
 * All parameters are optional. Use to narrow down transaction results
 * by date range, amount, status, accounts, etc.
 */
export type CardTransactionFilters = {
  /** Start date for transaction range (ISO date string) */
  startDate?: string;
  /** End date for transaction range (ISO date string) */
  endDate?: string;
  /** Minimum transaction amount filter */
  minAmount?: number;
  /** Maximum transaction amount filter */
  maxAmount?: number;
  /** Filter by beneficiary/merchant ID */
  beneficiaryId?: string;
  /** Filter by transaction status */
  status?: string;
  /** Sort field (e.g., "createdAt", "amount") */
  sort?: string;
  /** Sort order */
  order?: "asc" | "desc";
  /** Filter by debtor account number */
  debtorAccount?: string;
  /** Filter by creditor account number */
  creditorAccount?: string;
  /** Page number for pagination (1-indexed) */
  page?: number;
  /** Page size (number of results per page) */
  size?: number;
};

/* -------------------------------------------------------------------------- */
/*                      CARD OPERATIONS (INIT/CONFIRM)                        */
/* -------------------------------------------------------------------------- */

/**
 * Standard response for INIT operations.
 * 
 * When you initiate most card operations (except enable/disable),
 * the API returns a requestId that you must use in the confirm step.
 * 
 * @example
 * POST /api/payment-means/cards/{cardId}/limit/init
 * Response: { "requestId": "d9dd1636-7d8f-4468-b928-db155d2928e5" }
 */
export interface CardActionInitResponse {
  /** Unique request identifier for the confirm step */
  requestId: string;
}

/**
 * Standard response for direct card actions (enable/disable).
 * 
 * Enable and disable operations return an action ID directly
 * without going through init/confirm flow.
 */
export interface CardActionResponse {
  /** Action identifier (may be called transactionId in some responses) */
  id: string;
}

/**
 * Confirmation request body for card operations.
 * 
 * Used to confirm operations initiated via /init endpoints.
 * Supports both TOTP (time-based one-time password) and
 * CHALLENGE (biometric/device-based) confirmation methods.
 * 
 * PATCH /api/payment-means/cards/{cardId}/confirm
 */
export interface CardActionConfirmationRequest {
  /** Request ID from the init operation */
  requestId: string;
  /** Confirmation method: "TOTP", "SMS", "EMAIL", or "CHALLENGE" */
  confirmationMethod: string;
  /** OTP code for TOTP/SMS/EMAIL methods */
  confirmationValue?: string;
  /** Biometric/device proof for CHALLENGE method */
  challengeConfirmationValue?: CardChallengeConfirmationValue;
}

/**
 * Challenge confirmation value for biometric/device authentication.
 * 
 * Used when confirmationMethod is "CHALLENGE".
 */
export type CardChallengeConfirmationValue = {
  /** Device identifier */
  deviceId: string;
  /** Challenge session ID */
  challengeId: string;
  /** Cryptographic proof from device */
  proof: string;
};

/* -------------------------------------------------------------------------- */
/*                    SPECIFIC OPERATION REQUEST TYPES                        */
/* -------------------------------------------------------------------------- */

/**
 * Request body for updating card spending limit.
 * 
 * PATCH /api/payment-means/cards/{cardId}/limit/init
 * 
 * @example
 * { "newLimit": 590 }
 */
export interface UpdateCardLimitRequest {
  /** New spending limit in account currency */
  newLimit: number;
}

/**
 * Request body for disabling 3D Secure (secured mode).
 * 
 * PATCH /api/payment-means/cards/{cardId}/disable-secured/init
 * 
 * @property endDate - When to re-enable 3DS (format: "YYYY-MM-DD")
 */
export interface DisableSecuredCardRequest {
  /** Date when secured mode should be re-enabled (ISO date) */
  endDate: string;
}

/* -------------------------------------------------------------------------- */
/*                         CARD RELOAD (PREPAID)                              */
/* -------------------------------------------------------------------------- */

/**
 * Request body for initiating card reload/top-up.
 * 
 * POST /api/payment-means/cards/reload-card/{cardId}/init
 * 
 * Used for prepaid or reloadable card products.
 */
export interface ReloadCardInitRequest {
  /** Amount to add to card balance */
  amount: number;
  /** Source account ID to debit from */
  debtorAccountId: string;
  /** Optional description/reason for reload */
  motif?: string;
}

/**
 * Response from reload init operation.
 * 
 * Contains request details and a requestId for confirmation.
 */
export interface ReloadCardInitResponse {
  /** Request identifier for confirm step */
  id: string;
  /** Reload amount */
  amount: number;
  /** Scheduled execution date (ISO 8601) */
  requestExecutionDate: string;
  /** Description/reason */
  motif: string;
  /** Request status */
  status: string;
  /** Source account that will be debited */
  debtorAccountId: string;
}

/**
 * Request body for confirming card reload.
 * 
 * POST /api/payment-means/cards/reload-card/confirm
 */
export interface ReloadCardConfirmRequest {
  /** Request ID from reload init */
  requestId: string;
  /** Confirmation method */
  confirmationMethod: string;
  /** OTP code (for TOTP method) */
  confirmationValue?: string;
  /** Challenge proof (for CHALLENGE method) */
  challengeConfirmationValue?: CardChallengeConfirmationValue;
}

/* -------------------------------------------------------------------------- */
/*                      FLEX / INSTALLMENT PAYMENTS                           */
/* -------------------------------------------------------------------------- */

/**
 * Flex transaction eligible for installment payment.
 * 
 * Represents a purchase that can be split into monthly payments.
 * Returned by GET /api/payment-means/cards/{cardId}/flex
 */
export interface FlexTransaction {
  /** Transaction identifier */
  id: string;
  /** Authorization code */
  authCode: string;
  /** Transaction date (ISO 8601) */
  transactionDate: string;
  /** Masked card number */
  cardNumber: string;
  /** Transaction amount */
  transactionAmount: number;
  /** Authorization number */
  authorizationNumber: string;
  /** Response code from processor */
  responseCode: string;
  /** Merchant name */
  merchantName: string;
  /** Installment status: MATCHED, IN_PROGRESS, COMPLETED */
  status: "MATCHED" | "IN_PROGRESS" | "COMPLETED";
  /** Minimum allowed installments */
  minInstallmentNumber: number;
  /** Maximum allowed installments */
  maxInstallmentNumber: number;
  /** Default/suggested installments */
  defaultInstallmentNumber: number;
  /** Installment plan identifier */
  installmentIdentifier: string;
  /** Credit age reference */
  creditAgeReference: string;
  /** Current client installment count */
  clientInstallmentNumber: number;
  /** Current payment day of month */
  clientInstallmentDay: number;
  /** Requested new installment count */
  requestedInstallmentNumber: number;
  /** Requested new payment day */
  requestedInstallmentDay: number;
  /** Last installment date (ISO 8601) */
  lastInstallment: string;
}

/**
 * API response for flex transactions list.
 * GET /api/payment-means/cards/{cardId}/flex
 */
export interface FlexTransactionListResponse {
  /** Number of flex transactions */
  count: number;
  /** Array of flex transactions */
  data: FlexTransaction[];
}

/**
 * Request body for updating installment settings.
 * 
 * PATCH /api/payment-means/cards/flex/{authCode}/installment/init
 */
export interface UpdateInstallmentRequest {
  /** New number of installments */
  installmentNumber: number;
  /** Day of month for payments (1-31) */
  installmentDay: number;
}

/* -------------------------------------------------------------------------- */
/*                         CARD OPERATIONS HISTORY                            */
/* -------------------------------------------------------------------------- */

/**
 * Type of card operation/command executed.
 * 
 * Represents different actions that can be performed on a card.
 */
export type UpdateCardCommandType =
  | "REQUEST_PIN"          // Request PIN delivery
  | "REPLACE_CARD"         // Order replacement card
  | "RESET_PIN"            // Reset forgotten PIN
  | "ENABLE_CARD"          // Activate/unblock card
  | "DISABLE_CARD"         // Block/deactivate card
  | "DISABLE_3D_SECURE"    // Temporarily disable 3DS
  | "EDIT_CARD_LIMIT"      // Update spending limit
  | "UPDATE_FLEX_INSTALLMENT"; // Modify installment plan

/**
 * Single operation record in card history.
 */
export interface CardOperationItem {
  /** Type of operation performed */
  updateCardCommandType: UpdateCardCommandType;
  /** When the operation was executed (ISO 8601) */
  createdAt: string;
}

/**
 * API response for card operations history.
 * GET /api/payment-means/cards/{cardId}/operations
 */
export interface CardOperationsResponse {
  /** Total number of operations */
  count: number;
  /** Array of operation records */
  data: CardOperationItem[];
}