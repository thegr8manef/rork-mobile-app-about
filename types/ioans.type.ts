export type ISODateString = `${number}-${number}-${number}`;

export interface LoansResponse {
  count: number;
  data: Loan[];
}

export interface Loan {
  id: string; // UUID
  unlockDate: ISODateString; // YYYY-MM-DD
  establishmentDate: ISODateString; // YYYY-MM-DD
  fileNumber: string;

  loanAmount: number;
  amount: number;

  loanType: LoanType;

  duration: number; // in months
  outstandingCapital: number;
  interestRate: number; // percentage
  unpaidAmount: number;

  installmentDetails: InstallmentDetails;
  currency: Currency;
}

export interface InstallmentDetails {
  periodicityUnit: PeriodicityUnit; // "M"
  lastInstallmentDate: ISODateString;
  numberRemainingInstallments: number; // can be negative
}

export type PeriodicityUnit = "M" | "Q" | "Y";

export interface Currency {
  alphaCode: CurrencyAlphaCode; // "TND"
  numericCode: string; // "788"
  designation: string; // "DINAR TUNISIEN"
}

export type CurrencyAlphaCode = "TND";

export interface LoanDetails {
  id: string; // UUID
  unlockDate: ISODateString;
  establishmentDate: ISODateString;
  fileNumber: string;

  loanAmount: number;
  amount: number;

  loanType: LoanType;

  duration: number; // months
  outstandingCapital: number;
  interestRate: number; // %
  unpaidAmount: number;

  installmentDetails: InstallmentDetailsExtended;
  currency: Currency;
}

export interface LoanType {
  code: string;
  label: string;
}

export interface InstallmentDetailsExtended {
  periodicityUnit: PeriodicityUnit;

  firstInstallmentDate: ISODateString;
  lastInstallmentDate: ISODateString;

  /**
   * ⚠️ Your backend currently returns installmentsNumber = totalInstallmentsNumber,
   * which does NOT match the list endpoint.
   * Use lastTriggeredInstallment for paid count (it matches your sample).
   */
  installmentsNumber: number; // backend says "paid installments" but sample looks wrong
  totalInstallmentsNumber: number; // total planned
  lastTriggeredInstallment: number; // ✅ use this as "paid installments" index/count

  constantInstallmentAmount: number; // fixed monthly payment
}
