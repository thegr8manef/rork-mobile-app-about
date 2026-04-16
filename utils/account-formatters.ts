// src/utils/account-formatters.ts

import { getCurrencyDecimals } from "./currency-helper";

export const maskAccountNumber = (number: string) => {
  if (!number) return "";
  const length = number.length;
  if (length <= 4) return number;

  const firstFour = number.substring(0, 4);
  const lastFour = number.substring(length - 4);
  const masked = "*".repeat(Math.min(length - 8, 16));
  return `${firstFour}${masked}${lastFour}`;
};

export const splitRIB = (rib: string) => {
  if (!rib) {
    return { bank: "044", agency: "044", account: "0000000000000", key: "44" };
  }
  const cleaned = rib.replace(/\s/g, "");
  return {
    bank: cleaned.substring(0, 3) || "044",
    agency: cleaned.substring(3, 6) || "044",
    account: cleaned.substring(6, 19) || "0000000000000",
    key: cleaned.substring(19, 21) || "44" };
};

export const formatBalance = (
  balance: string | number | null | undefined,
  currency: string,
) => {
  const decimals = getCurrencyDecimals(currency); // TND => 3, else 2 (keep your existing logic)

  // normalize input: remove spaces + convert comma to dot
  const raw = String(balance ?? "0").replace(/\s+/g, "").replace(",", ".");
  const n = Number(raw);

  if (!Number.isFinite(n)) {
    const zeroDec = "0".padEnd(decimals, "0");
    return `0,${zeroDec} ${currency}`;
  }

  const isNeg = n < 0;
  const fixed = Math.abs(n).toFixed(decimals); // dot decimal
  const [intPart, decPart = ""] = fixed.split(".");

  // add spaces every 3 digits
  const intGrouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, " ");

  // use comma as decimal separator
  return `${isNeg ? "−" : ""}${intGrouped},${decPart} ${currency}`;
};


export const generateRIBText = (params: {
  ribFormatAccount: string;
  ibanFormatAccount: string;
  currencyAlphaCode: string;
  accountTitle: string;
  branchDesignation?: string;
  bic?: string;
}) => {
  const rib = splitRIB(params.ribFormatAccount);
  const bic = params.bic ?? "BSTUTNTUIINT";

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
RELEVÉ D'IDENTITÉ BANCAIRE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 RIB
Banque: ${rib.bank}
Agence: ${rib.agency}
Compte: ${rib.account}
Clé: ${rib.key}

🌍 IBAN
${params.ibanFormatAccount}

🏦 BIC
${bic}

💳 Devise
${params.currencyAlphaCode}

👤 Titulaire
${params.accountTitle}

📍 Agence
${params.branchDesignation || "Agence principale"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Généré le ${new Date().toLocaleDateString("fr-FR")} à ${new Date().toLocaleTimeString(
    "fr-FR",
    { hour: "2-digit", minute: "2-digit" },
  )}
  `.trim();
};
const pad2 = (n: number) => String(n).padStart(2, "0");

export const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

export const formatDateFR = (d?: Date) =>
  d ? `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()}` : "";

export const formatDateToYYYYMMDD = (d: Date) =>
  `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
