//***********************************************//***********************//
//               Account Type Definition

//***********************************************//***********************//
export interface AccountResponse {
  count: number;
  data: Account[];
}

export interface Account {
  id: string;
  createdAt: string;
  updatedAt: string;
  externalId: string;
  displayIndex: number;
  accountLabel: string;
  chapter: string;
  accountRib: string;
  availableBalance: string;
  accountingBalance: string;
  indicativeBalance: string;
  ribFormatAccount: string;
  ibanFormatAccount: string;
  accountTitle: string;
  accountStatus: string;
  accountNumber: string;
  customerCode: string;
  fundReservation: string;
  accountType: AccountType;
  currencyAccount: CurrencyAccount;
  branch: Branch;
  overDraftAuthorization: OverDraftAuthorization;
  authorizedOperations: AuthorizedOperations;
  lastMovementDate?: string;
  lastCreditDate?: string;
  lastDebitDate?: string;
  accountClass: AccountClass;
  customer: Customer;
  stoppage?: Stoppage[];
}

export interface AccountType {
  code: string;
  designation: string;
}

export interface CurrencyAccount {
  alphaCode: string;
  numericCode: string;
  designation: string;
}

export interface Branch {
  code: string;
  designation: string;
}

export interface OverDraftAuthorization {
  overDraftLimitValue: string | null;
  expiryDate: string | null;
}

export interface AuthorizedOperations {
  code: string;
  designation: string;
}

export interface AccountClass {
  code: number;
  designation: string;
}

export interface Customer {
  customerNumber: string;
  displayName: string;
}

export interface Stoppage {
  stoppageReason: string;
  stoppageEndReason: string;
  stoppageStartDate: string | null;
  stoppageStatus: string;
  stoppageLabel: string | null;
  stoppageEndDate: string;
  stoppageCode: string | null;
}

//***********************************************//***********************//
//               Account Detail Type Definition
//***********************************************//***********************//

export interface AccountDetail {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayIndex: number;
  accountLabel: string;
  chapter: string;
  accountRib: string;
  availableBalance: string;
  accountingBalance: string;
  indicativeBalance: string;
  ribFormatAccount: string;
  ibanFormatAccount: string;
  accountTitle: string;
  accountStatus: string;
  accountNumber: string;
  customerCode: string;
  fundReservation: string;

  accountType: {
    code: string;
    designation: string;
  };

  currencyAccount: {
    alphaCode: string;
    numericCode: string;
    designation: string;
  };

  branch: {
    code: string;
    designation: string;
  };

  overDraftAuthorization: {
    overDraftLimitValue: string | null;
    expiryDate: string | null;
  };

  authorizedOperations: {
    code: string;
    designation: string;
  };

  lastMovementDate: string;
  lastCreditDate: string;
  lastDebitDate: string;

  accountClass: {
    code: number;
    designation: string;
  };

  customer: {
    customerNumber: string;
    displayName: string;
  };
}

//***********************************************//***********************//
//               Account Mouvment
//***********************************************//***********************//
export type Currency = {
  alphaCode: string;
  numericCode: number;
  designation: string;
};

export type AccountMovement = {
  movementNumber: number;
  ledgerDate: string; // YYYY-MM-DD
  valueDate: string; // YYYY-MM-DD
  amount: string; // keep as string for money precision
  currency: Currency;
  movementSide: "C" | "D"; // C = Credit, D = Debit
  eventOperation: string;
  operationNature: string;
  additionalDescription: string | null;
  additionalInformations: string | null;
};

export type AccountMovementsResponse = {
  count: number;
  data: AccountMovement[];
};

//***********************************************//
//               Transfer Types
//***********************************************//

// If your API sends/accepts amount as string, keep it string.
// If sometimes you use number in UI, allow both.
export type MoneyAmount = number | string;

export type TransferFrequency = "MONTHLY" | "ANNUAL" | "once";

export type TransferInitBase = {
  frequency?: TransferFrequency;
  executionDate: string;
  endExecutionDate?: string;
  motif: string;
  amount: number | string;
  debtorAccountId: string;
};

export type TransferInitWithBeneficiary = TransferInitBase & {
  beneficiaryId: string;
  creditorAccountId?: never; // ✅ cannot exist together
};

export type TransferInitWithAccount = TransferInitBase & {
  creditorAccountId: string; // ✅ account-to-account uses ID
  beneficiaryId?: never; // ✅ cannot exist together
};

export type TransferInitRequest =
  | TransferInitWithBeneficiary
  | TransferInitWithAccount;

export type TransferInitResponse = {
  id: string; // ✅ this is the requestId
  amount: number;
  beneficiaryId?: string;
  creditorAccountRib?: string; // if you use rib flow
  debtorAccountId: string;

  frequency: TransferFrequency;
  motif: string;

  requestExecutionDate: string;
  transferType: "UNIT" | string;

  status: "INIT" | "PENDING" | "VALIDATED" | "REJECTED" | string; // ✅ INIT exists
  createdAt: string;
};

export type TransferConfirmRequest = {
  requestId: string;
  confirmationMethod: "TOTP";
  confirmationValue: string;
};

export type TransferConfirmResponse = {
  requestId: string;
  amount: number;
  requestExecutionDate: string;
  motif: string;
  status: "EXECUTED" | "INIT" | string;
  debtorAccountId: string;
  creditorAccountRib: string;
};
export type TransferHistoriqueType = "UNIT" | "DEFERRED";

export type TransferHistoryItem = {
  requestId: string;
  amount: number;
  requestExecutionDate: string;
  transferType: TransferHistoriqueType;
  status: string;
  debtorAccountRib: string;
  creditorAccountRib: string;
};

export type TransferHistoryResponse = {
  count: number;
  data: TransferHistoryItem[];
};

export type TransferHistoryFilters = {
  page?: number;
  size?: number;

  minAmount?: number;
  maxAmount?: number;

  beneficiaryId?: string;

  status?: "INIT" | "EXECUTED" | "CONFIRMED" | string;

  sort?: "createdAt" | "amount" | string;
  order?: "asc" | "desc";

  debtorAccount?: string;
  creditorAccount?: string;
};
export type SortField = "createdAt" | "requestExecutionDate" | string;
export type SortOrder = "asc" | "desc";

export type GetTransferRequestsParams = {
  page?: number;
  size?: number;
  minAmount?: number;
  maxAmount?: number;
  beneficiaryId?: string;
  status?: string;
  sort?: SortField;
  order?: SortOrder;
  debtorAccount?: string;
  creditorAccount?: string;
  type?: "DEFERRED" | "PERMANENT" | "UNIT";
  

  // ✅ add these
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
};

export type TransferErrorResponse = {
  httpStatusCode: string;
  errorCode: string;
  message: string;
  args: any;
};
//**********************************************************************//
//               Add  Beneficiary
//**********************************************************************//
export type BeneficiaryStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "INIT";

export type AddBeneficiaryInitBody = {
  fullName: string;
  rib: string;
};

export type AddBeneficiaryInitResponse = {
  id: string;
  fullName: string;
  rib: string;
  status: BeneficiaryStatus;
  createdAt: string;
};

export interface InvalidInitRibErrorResponse {
  httpStatusCode: "BAD_REQUEST";
  errorCode: "INVALID_RIB";
  message: "rib invalid";
  args: any | null;
}

//**********************************************************************//
//               Add  Beneficiary Confirm
//**********************************************************************//

export type AddBeneficiaryConfirmBody = {
  requestId: string;
  confirmationMethod: "TOTP" | string;
  confirmationValue: string;
};

export type AddBeneficiaryConfirmResponse = {
  id: string;
};

//**********************************************************************//
//               Add  Beneficiary Confirm
//**********************************************************************//
export interface BeneficiaryDeleteInitRequest {
  beneficiaryId: string;
}

export interface BeneficiaryDeleteInitResponse {
  requestId: string;
  beneficiaryId: string;
  status: "INIT";
  createdAt: string;
}

export interface BeneficiaryDeleteConfirmRequest {
  requestId: string;
  confirmationMethod: "TOTP" | string;
  confirmationValue: string;
}

//**********************************************************************//
//               GET   Beneficiary Response
//**********************************************************************//

export interface Beneficiary {
  id: string;
  fullName: string;
  rib: string;
  status: BeneficiaryStatus;
  bankName: string;
}

export interface GetBeneficiariesResponse {
  count: number;
  data: Beneficiary[];
}

/* ============================================================
   TRANSFER REQUESTS — MODELS
   ============================================================ */

/* -------------------- ENUMS & TYPES -------------------- */

export type TransferFrequencyResponse = "once" | "MONTHLY";

export type TransferStatus = "INIT" | "EXECUTED";

export type ConfirmationMethod = "OTP";

/* -------------------- INIT REQUEST -------------------- */
/* POST /api/payment-means/transfer-requests/init */

export interface TransferRequestInitBody {
  frequency: TransferFrequencyResponse;
  executionDate: string; // YYYY-MM-DD
  endDate?: string; // required if MONTHLY
  motif: string;
  amount: string; // sent as string
  creditorAccountId?: string;
  debtorAccountId: string; // UUID
}

/* -------------------- INIT RESPONSE (ONCE) -------------------- */

export interface TransferRequestInitOnceResponse {
  requestId: string;
  amount: number;
  requestExecutionDate: string; // YYYY-MM-DD
  frequency: "once"; // ⚠️ backend behavior
  motif: string;
  status: "EXECUTED";
  debtorAccountId: string;
  beneficiaryId: string;
  createdAt: string; // ISO
}

/* -------------------- INIT RESPONSE (MONTHLY) -------------------- */

export interface TransferRequestInitMonthlyResponse {
  requestId: string;
  amount: number;
  frequency: "MONTHLY";
  requestExecutionDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  motif: string;
  status: "INIT";
  debtorAccountId: string;
  beneficiaryId: string;
  createdAt: string; // ISO
}

/* -------------------- INIT RESPONSE UNION -------------------- */

export type TransferRequestInitResponse =
  | TransferRequestInitOnceResponse
  | TransferRequestInitMonthlyResponse;

/* -------------------- CONFIRM REQUEST -------------------- */
/* POST /api/payment-means/transfer-requests/confirm */

export interface TransferRequestConfirmBody {
  requestId: string;
  confirmationMethod: ConfirmationMethod;
  confirmationValue: string; // OTP
}

/* -------------------- CONFIRM RESPONSE -------------------- */

export interface TransferRequestConfirmResponse {
  requestId: string;
  amount: number;
  requestExecutionDate: string; // YYYY-MM-DD
  motif: string;
  status: "EXECUTED";
  debtorAccountId: string;
  creditorAccountRib: string;
}

/* -------------------- GENERIC API ERROR -------------------- */

export interface ApiErrorResponse {
  httpStatusCode: string; // e.g. "FORBIDDEN"
  errorCode: string;
  message: string;
  args: any | null;
}

/* -------------------- SPECIFIC ERROR -------------------- */

export type UnauthorizedCreditorAccountTransferError = ApiErrorResponse & {
  errorCode: "UNAUTHORIZED_CREDITOR_ACCOUNT_TRANSFER";
};

/* -------------------- CONFIRM RESULT UNION -------------------- */

export type TransferConfirmResult =
  | TransferRequestConfirmResponse
  | ApiErrorResponse;

/* ============================================================
   PRODUCT SUBSCRIPTIONS (EQUIPEMENTS)
   ============================================================ */

export interface ProductSubscription {
  id: string;
  reference: string;
  startDate: string;
  endDate: string | null;
  pack: string | null;
  fileType: string;
  fileNumber: string;
  agreementContract: string | null;
  specifications: string;
  invoiceAccount: string;
}

export interface ProductEquipment {
  id: string;
  code: string;
  designation: string;
  productAttribute: string;
  isPack: boolean;
  subscriptions: ProductSubscription[];
}

export interface ProductSubscriptionsResponse {
  count: number;
  data: ProductEquipment[];
}

export interface SendMoneyBaseAccount {
  id: string;
  createdAt: string;
  updatedAt: string;
  displayIndex: number;
  accountLabel: string;
  chapter: string;
  accountRib: string;
  availableBalance: string;
  accountingBalance: string;
  indicativeBalance: string;
  ribFormatAccount: string;
  ibanFormatAccount: string;
  accountTitle: string;
  accountStatus: string;
  accountNumber: string;
  customerCode: string;
  fundReservation: string;
  accountType: AccountType;
  currencyAccount: CurrencyAccount;
  branch: Branch;
  overDraftAuthorization: OverDraftAuthorization;
  authorizedOperations: AuthorizedOperations;
  accountClass: AccountClass;
  customer: Customer;
}
export interface SendMoneyAccount extends SendMoneyBaseAccount {
  externalId: string;
  lastMovementDate?: string;
  lastCreditDate?: string;
  lastDebitDate?: string;
  stoppage?: Stoppage[];
}
export interface SendMoneyAccountDetail extends SendMoneyBaseAccount {
  lastMovementDate: string;
  lastCreditDate: string;
  lastDebitDate: string;
  designationProduct: string;
  billingAccount: string;
  billingAmount: string;
  accountManager: string;
}

export interface ExchangeRateCurrency {
  alphaCode: string;
  numericCode: string;
  designation: string;
}

export interface ExchangeRateData {
  initialCurrency: ExchangeRateCurrency;
  targetCurrency: ExchangeRateCurrency;
  searchNature: "A" | "V" | "F" | "M";
  rate: number;
}

export interface ExchangeRatesResponse {
  calculationMethod: string;
  applicationDate: string;
  count: number;
  data: ExchangeRateData[];
}
// types/transfer.ts

export type TransferRequestStatus =
  | "PENDING"
  | "EXECUTED"
  | "CONFIRMED"
  | "REJECTED"
  | "CANCELLED"
  | "FAILED"
  | string; // keep string if backend can add new statuses

export type TransferCancelVariables = {
  requestId: string;
  params?: GetTransferRequestsParams; // optional
};

export type TransferCancelRequest = {
  requestId: string;
  params?: GetTransferRequestsParams; // optional (same filters/pagination as list)
};
// account.type.ts

/* ------------------------------------------------------------------ */
/* Transfer Challenge (Passkey/Biometric)                              */
/* ------------------------------------------------------------------ */

export type TransferConfirmMethod = "CHALLENGE" | "TOTP" | "PINCODE";
export type TransferTxChallengeType = "CHALLENGE";

export type TransferInitChallengeBody = {
  deviceId: string;
  requestId: string;
  challengeType: TransferTxChallengeType; // always "CHALLENGE"
};

// Response from: POST /api/v1/auth/init-transaction-challenge
export type TransferInitCHALLENGEesponse = {
  transactionId: string;
  challengeId: string;
  challenge: string; // nonce/base64 for signChallenge()
};

export type TransferChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};

// Use this only when confirming a transfer using challenge / pin / otp
export type TransferConfirmWithCHALLENGEequest = {
  requestId: string;
  confirmationMethod: TransferTxChallengeType;
  challengeConfirmationValue: TransferChallengeConfirmationValue;
};
// ✅ Request body (what API takes)
export interface InitTransactionChallengeBody {
  deviceId: string;
  requestId: string;
  challengeType: "CHALLENGE";
}

// ✅ Response (what API returns)
export interface InitTransactionCHALLENGEesponse {
  requestId: string;
  challenge: string;
  challengeId: string;
  expiresAt: string; // keep string
}

export type ChallengeConfirmationValueDTO = {
  deviceId: string;
  challengeId: string;
  proof: string;
};

export type TransferConfirmChallengeDTO = {
  requestId: string;
  confirmationMethod: "CHALLENGE";
  challengeConfirmationValue: ChallengeConfirmationValueDTO;
};


export type ChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};

export type ConfirmWithChallengeRequest = {
  requestId: string;
  confirmationMethod: "CHALLENGE";
  challengeConfirmationValue: ChallengeConfirmationValue;
};

export type BeneficiaryChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};

export type BeneficiaryConfirmWithChallengeRequest = {
  requestId: string;
  confirmationMethod: "CHALLENGE";
  challengeConfirmationValue: BeneficiaryChallengeConfirmationValue;
};
export type BeneficiaryConfirmStatus =
  | "SUCCESS"
  | "FAILED"
  | "PENDING"
  | string;

export type BeneficiaryConfirmResponse = {
  id: string;
  fullName: string;
  rib: string;
  status: BeneficiaryConfirmStatus;
};

export type DeleteBeneficiaryBody = {
  beneficiaryId: string;
};

export type Profile = {
  id: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lasEventType: string | null;
  lastEventAt: string | null;
  contractId: string | null;
  cli: string | null;
  users: User[];
};

export type User = {
  userId: string | null;
  defaultUser: string | null;
  subscription: string | null;
  updatedAt: string | null;
  lastDateConnexion: string | null;
  contact: Contact;
  cin: string | null;
  login: string | null;
  mdp: string | null;
  firstName: string | null;
  lastName: string | null;
  deviceId: string | null;
};

export type Contact = {
  mail: string | null;
  telNumber: string | null;
};


export interface TransferPdfParams {
  transferId: string;
  reportType?: "PDF";
}
export type UpdateAccountPayloadItem = {
  accountId: string;
  displayIndex: number;
  accountLabel: string;
};

export type UpdateAccountsBody = UpdateAccountPayloadItem[];


export type UpdateAccountsCtx = {
  prev?: AccountResponse;
};