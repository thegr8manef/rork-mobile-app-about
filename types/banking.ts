import { ImageSourcePropType } from "react-native";

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit";
  balance: number;
  currency: string;
  accountNumber: string;
  isDefault: boolean;
  branch?: string;
  accountType?: string;
  accountableAmount?: number;
  rib?: string;
  iban?: string;
  fullAccountNumber?: string;
}
export type Movement = {
  movementNumber: number;
  movementSide: "D" | "C";
  amount: string;
  currency?: { alphaCode?: string };
  eventOperation: string;
  operationNature: string;
  ledgerDate: string;
  valueDate: string;
  additionalDescription?: string | null;
  additionalInformations?: string | null;
};
export interface Transaction {
  id: string;
  accountId: string;
  type: "debit" | "credit";
  amount: number;
  currency: string;
  description: string;
  category: string;
  ledgerDate: string;
  valueDate: string;
  status: "completed" | "pending" | "failed";
  recipient?: string;
  reference?: string;
  date: string;
}

export interface CardProduct {
  code: string;
  description: string;
}

export interface CardStatus {
  activation: string;
  opposition: string;
  perso: string;
}

export interface CardAccount {
  accountNumber: string;
  available: string;
  typeAvailable: string;
  currency: Currency;
  accountType: string;
  accountStatus: string;
  accountCheck: string;
}

export interface CardLimit {
  typetrx: number;
  periodicity: number;
  currency: Currency;
  currentLimit: number;
  maxLimit: number;
  remaing: number;
}

export interface Card {
  id: string;
  cardCode: string;
  pcipan: string;
  namePrinted: string;
  product: CardProduct;
  numTel: string;
  expiryDate: string;
  cardStatus: CardStatus;
  accounts: CardAccount[];
  limits: CardLimit[];
  globalLimit: number;
  globalRemaining: number;
  international: boolean;
}

export interface CardTransactionStatus {
  code: string;
  description: string;
}

export interface CardTransaction {
  amount: number;
  currency: Currency;
  datetime: string;
  shortLabel: string;
  transactionRef: string;
  authCode: number;
  status: CardTransactionStatus;
  convertedAmount: number;
  accountCurrency: Currency;
  label: string;
  action: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  accountNumber: string;
  bankName: string;
  routingNumber?: string;
  isFrequent: boolean;
  addedDate: string;
}

export interface TransferRequest {
  fromAccountId: string;
  toAccountId?: string;
  beneficiaryId?: string;
  amount: number;
  description: string;
  reference?: string;
}

export interface Loan {
  id: string;
  type: "personal" | "home" | "auto" | "business";
  name: string;
  originalAmount: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  termMonths: number;
  remainingMonths: number;
  currency: string;
  status: "active" | "paid" | "overdue";
  accountNumber: string;
  startDate: string;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  paymentDate: string;
  status: "completed" | "pending" | "failed";
  currency: string;
}

export interface SchoolingFolder {
  id: string;
  schoolName: string;
  studentName: string;
  studentId: string;
  remainingAmount: number;
  totalAmount: number;
  currency: string;
  academicYear: string;
  grade: string;
  transferTypes: SchoolingTransferType[];
  lastPaymentDate?: string;
  status: "active" | "inactive" | "completed";
}

export interface SchoolingTransferType {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SchoolingTransferRequest {
  folderId: string;
  fromAccountId: string;
  amount: number;
  transferType: "reload_card" | "transfer";
  description?: string;
  reference?: string;
}

export interface SchoolingTransfer {
  id: string;
  folderId: string;
  accountId: string;
  amount: number;
  transferType: "reload_card" | "transfer";
  description: string;
  reference?: string;
  date: string;
  status: "completed" | "pending" | "failed";
  currency: string;
}

export interface Claim {
  id: string;
  type: ClaimType;
  title: string;
  description: string;
  status: "pending" | "in_review" | "resolved" | "rejected";
  createdDate: string;
  updatedDate: string;
  documents: ClaimDocument[];
  response?: string;
  responseDate?: string;
  accountId?: string;
  transactionId?: string;
  priority: "low" | "medium" | "high";
}

export interface ClaimDocument {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
  uploadedDate: string;
}

export interface ClaimType {
  id: string;
  name: string;
  description: string;
  icon: string;
  requiresDocument: boolean;
}

export interface CreateClaimRequest {
  type: string;
  title: string;
  description: string;
  documents: ClaimDocument[];
  accountId?: string;
  transactionId?: string;
  priority: "low" | "medium" | "high";
}

export interface Cheque {
  id: string;
  accountId: string;
  chequeNumber: string;
  amount: number;
  currency: string;
  beneficiary: string;
  date: string;
  status: "pending" | "cleared" | "cancelled";
  imageUri?: string;
}

export interface Bill {
  id: string;
  accountId: string;
  billNumber: string;
  provider: string;
  amount: number;
  currency: string;
  dueDate: string;
  status: "paid" | "unpaid" | "overdue";
  category: string;
  imageUri?: string;
  paidDate?: string;
}

export interface EDocument {
  id: string;
  accountId: string;
  type: "account_statement" | "debit_notice" | "credit_notice";
  period: string;
  generatedDate: string;
  fileUri?: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  imageUri: ImageSourcePropType | string;
  backgroundColor: string;
  category:
    | "loan"
    | "savings"
    | "insurance"
    | "card"
    | "investment"
    | "promotion";
  actionLabel: string;
  expiryDate?: string;
  isNew?: boolean;
  videoUri?: string;
}

export interface OfferPromotion {
  id: string;
  title: string;
  description: string;
  // Story media (one of them)
  imageUri?: any; // require(...) local image OR { uri: "https://..." }
  videoUri?: string; // direct mp4/m3u8 URL

  // Optional thumbnail for video cards (recommended)
  thumbnailUri?: any; // require(...) local image OR { uri: "https://..." }
  youtubeId?: string;
  backgroundColor: string;
  category:
    | "loan"
    | "savings"
    | "insurance"
    | "card"
    | "investment"
    | "promotion";
  actionLabel: string;
  webUrl?: string;
  webTitle?: string;
  expiryDate?: string;
  isNew?: boolean;
}

export interface Currency {
  alphaCode: string;
  numericCode: number;
  designation: string;
}

export interface TermDeposit {
  id: string;
  accountNumber: string;
  productName: string;
  amount: number;
  currency: Currency;
  branchCode: string;
  tdNumber: string;
  rate: number;
  maturityDate: string;
  valueDate: string;
  executionDate: string;
  isCollateralized: boolean;
  isPrepayable: boolean;
  prepaymentAmount: number;
}

export interface PlacementType {
  id: string;
  name: string;
  description: string;
  imageUri: string;
  category:
    | "bon_caisse"
    | "compte_epargne"
    | "assurance_vie"
    | "investissement";
}

export interface ExchangeRate {
  initialCurrency: Currency;
  targetCurrency: Currency;
  searchNature: "F" | "A" | "V" | "M";
  rate: string;
}

export interface ExchangeRatesResponse {
  calculationMethod: string;
  applicationDate: string;
  exRate: ExchangeRate[];
}

export interface CardReloadHistoryItem {
  id: string;
  amount: number;
  debtor: {
    rib: string;
  };
  transactionEve: string;
  executionDate: string;
  status: "NOT_EXECUTED" | "EXECUTING" | "EXECUTED" | "REJECTED";
}

export interface CardInstallment {
  id: string;
  cardId: string;
  transactionId: string;
  merchantName: string;
  transactionDate: string;
  principalAmount: number;
  remainingAmount: number;
  numberOfMonths: number;
  currentMonth: number;
  monthlyAmount: number;
  firstPaymentDate: string;
  lastPaymentDate: string;
  nextPaymentDate?: string;
  status: "to_split" | "in_progress" | "completed";
  currency: string;
}

export interface CreateInstallmentRequest {
  transactionId: string;
  cardId: string;
  numberOfMonths: number;
  firstPaymentDate: string;
}
