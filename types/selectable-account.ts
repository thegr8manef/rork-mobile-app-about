import type { Customer } from "./account.type";

export type SelectableAccount = {
  id: string;
  accountNumber: string;
  displayIndex: number; // ← add this
  accountTitle: string;
  indicativeBalance?: string;

  ribFormatAccount: string;
  ibanFormatAccount: string;

  accountingBalance: string;
  availableBalance: string;

  currencyAlphaCode: string;

  branchDesignation?: string;
  fundReservation?: string;
  customer?: Customer;
  overDraftLimitValue?: string;
  overDraftExpiryDate?: string;
};

const toCleanString = (v: any, fallback = ""): string => {
  if (v === null || v === undefined) return fallback;
  if (v === "null") return fallback;
  return String(v);
};

const toCustomer = (raw: any): Customer | undefined => {
  const customerNumber = toCleanString(raw?.customer?.customerNumber, "");
  const displayName = toCleanString(raw?.customer?.displayName, "");

  // if both empty -> no customer
  if (!customerNumber && !displayName) return undefined;

  return {
    customerNumber: customerNumber || "-",
    displayName: displayName || "-",
  };
};

export function toSelectableAccount(raw: any): SelectableAccount {
  const branchDesignation = raw?.branch?.designation ?? raw?.branchDesignation;

  const overDraftLimitValue =
    raw?.overDraftAuthorization?.overDraftLimitValue ?? undefined;

  const overDraftExpiryDate =
    raw?.overDraftAuthorization?.expiryDate ?? undefined;

  const customer = toCustomer(raw);

  return {
    id: toCleanString(raw?.id),
    accountNumber: toCleanString(raw?.accountNumber),
    displayIndex: raw?.displayIndex ?? 0, // ← add this line
    accountTitle: toCleanString(
      raw?.accountLabel ?? raw?.accountTitle ?? raw?.name,
      "-",
    ),

    indicativeBalance: toCleanString(
      raw?.indicativeBalance ?? raw?.balance,
      "0",
    ),

    ribFormatAccount: toCleanString(
      raw?.ribFormatAccount ?? raw?.rib ?? raw?.accountRib,
      "-",
    ),

    ibanFormatAccount: toCleanString(raw?.ibanFormatAccount ?? raw?.iban, "-"),

    accountingBalance: toCleanString(
      raw?.accountingBalance ?? raw?.balance,
      "0",
    ),
    availableBalance: toCleanString(raw?.availableBalance ?? raw?.balance, "0"),

    currencyAlphaCode: toCleanString(
      raw?.currencyAccount?.alphaCode ??
        raw?.currency?.alphaCode ??
        raw?.currency,
      "-",
    ),

    ...(customer ? { customer } : {}),

    fundReservation: toCleanString(raw?.fundReservation, "0.000"),

    ...(branchDesignation
      ? { branchDesignation: toCleanString(branchDesignation) }
      : {}),

    ...(overDraftLimitValue !== undefined
      ? { overDraftLimitValue: toCleanString(overDraftLimitValue) }
      : {}),

    ...(overDraftExpiryDate !== undefined
      ? { overDraftExpiryDate: toCleanString(overDraftExpiryDate) }
      : {}),
  };
}
