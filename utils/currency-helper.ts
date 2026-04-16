export type CurrencyInfo = {
  alphaCode: string;
  numericCode: string;
  designation: string;
};

export const CURRENCIES_WHERE_TARGET_IS_TND: Record<string, CurrencyInfo> = {
  // ✅ Target currency (always in your response)
  "788": {
    alphaCode: "TND",
    numericCode: "788",
    designation: "DINAR TUNISIEN",
  },

  // ✅ Initial currencies found in your exchangeRates response
  "978": { alphaCode: "EUR", numericCode: "978", designation: "E U R O" },
  "840": {
    alphaCode: "USD",
    numericCode: "840",
    designation: "DOLLAR DES USA",
  },
  "826": {
    alphaCode: "GBP",
    numericCode: "826",
    designation: "LIVRE STERLING",
  },
  "208": {
    alphaCode: "DKK",
    numericCode: "208",
    designation: "COURONNE DANOISE",
  },
  "392": { alphaCode: "JPY", numericCode: "392", designation: "YEN JAPONAIS" },
  "578": {
    alphaCode: "NOK",
    numericCode: "578",
    designation: "COURONNE NORVEGIENNE",
  },
  "682": {
    alphaCode: "SAR",
    numericCode: "682",
    designation: "RIYAL SAOUDIEN",
  },
  "048": { alphaCode: "BHD", numericCode: "48", designation: "DINAR BAHREINI" }, // note: API sends "48"
  "784": {
    alphaCode: "AED",
    numericCode: "784",
    designation: "DIRHAM DES E.A.U",
  },
  "752": {
    alphaCode: "SEK",
    numericCode: "752",
    designation: "COURONNE SUEDOISE",
  },
  "756": { alphaCode: "CHF", numericCode: "756", designation: "FRANC SUISSE" },
  "634": { alphaCode: "QAR", numericCode: "634", designation: "RIYAL QATARI" },
  "156": { alphaCode: "CNY", numericCode: "156", designation: "YUAN" },
  "124": {
    alphaCode: "CAD",
    numericCode: "124",
    designation: "DOLLAR CANADIEN",
  },
  "414": {
    alphaCode: "KWD",
    numericCode: "414",
    designation: "DINAR KOWEITIEN",
  },
};

// Helper (978 -> EUR, EURO etc.)
export function getCurrencyByNumeric(code: string | number) {
  const key = String(code).trim();
  // handle cases like "48" vs "048"
  const padded = key.padStart(3, "0");
  return (
    CURRENCIES_WHERE_TARGET_IS_TND[key] ??
    CURRENCIES_WHERE_TARGET_IS_TND[padded] ??
    null
  );
}

/**
 * Minor units / decimals by alphaCode (what your UI passes: "TND", "EUR", ...)
 * Defaults to 2 if unknown.
 */
export function getCurrencyDecimals(alphaCode: string): number {
  const c = (alphaCode || "").toUpperCase().trim();

  // Common cases (adjust/add if needed)
  if (c === "TND") return 3;
  if (c === "KWD") return 3;
  if (c === "BHD") return 3;

  if (c === "JPY") return 0;

  // Most currencies (EUR, USD, GBP, CHF, CAD, SAR, AED, QAR, CNY, SEK, NOK, DKK...)
  return 2;
}
