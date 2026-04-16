type AmountInput = number | string | null | undefined;

function toNumberSafe(value: AmountInput): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = value.replace(/\s+/g, "").replace(",", ".");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : 0;
}

function groupThousands(intPart: string): string {
  const sign = intPart.startsWith("-") ? "-" : "";
  const digits = sign ? intPart.slice(1) : intPart;
  return sign + digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export const amountFormatter = (
  amount: AmountInput,
  currencyAlphaCode?: string | number | null,
): string => {
  const code = String(currencyAlphaCode ?? "").trim().toUpperCase();
  const decimals = code === "TND" ? 3 : 2;

  const n = toNumberSafe(amount);
  const fixed = n.toFixed(decimals);
  const [intPart, decPart = ""] = fixed.split(".");

  return `${groupThousands(intPart)},${decPart}`;
};
