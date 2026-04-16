import { Currency } from "./account.type";


export interface Deposit {
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
  transmitter: string;
  transmitterCustomerCode: string;
  subscriber: string;
}

export interface DepositResponse {
  count: number;
  data: Deposit[];
}