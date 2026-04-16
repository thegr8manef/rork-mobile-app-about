import React, { useMemo } from "react";
import { View, Text, TextInput } from "react-native";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { BankingColors } from "@/constants";
import type { FormValues } from "../types";
import TText from "@/components/TText";
import { t } from "i18next";

type Props = {
  control: Control<FormValues>;
  errors: FieldErrors<FormValues>;
  styles: any;
  currencyAlphaCode?: string;
};

const getCurrencyDecimals = (alpha?: string) => {
  const c = String(alpha ?? "")
    .trim()
    .toUpperCase();
  if (!c) return 3; // default TND
  if (c === "JPY") return 0;
  if (c === "TND") return 3;
  return 2;
};

/**
 * Output rules:
 * - Keep only digits and separators
 * - Replace "." with "," (display separator)
 * - Allow only 1 separator
 * - Clamp decimals length (3 for TND, 2 otherwise)
 * - Store with "," as decimal separator (matching formatBalance convention)
 * - Keep trailing "," while typing (e.g. "12,")
 */
const sanitizeAmountInput = (raw: string, decimals: number): string => {
  // normalize: keep only digits + separators, convert . to ,
  let s = raw.replace(/[^\d.,]/g, "").replace(/\./g, ",");

  if (!s) return "";

  // prefix 0 if starts with separator
  if (s.startsWith(",")) s = `0${s}`;

  const firstSepIndex = s.indexOf(",");

  const stripSeps = (x: string) => x.replace(/,/g, "");

  const normalizeInt = (intPart: string) => {
    const trimmed = intPart.replace(/^0+(?=\d)/, "");
    return trimmed === "" ? "0" : trimmed;
  };

  if (firstSepIndex === -1) {
    return normalizeInt(stripSeps(s));
  }

  const beforeRaw = s.slice(0, firstSepIndex);
  const afterRaw = s.slice(firstSepIndex + 1);

  const before = normalizeInt(stripSeps(beforeRaw));
  const afterDigits = stripSeps(afterRaw);

  if (decimals === 0) {
    return before;
  }

  const hasTrailingSeparator = afterDigits.length === 0;
  const after = afterDigits.slice(0, decimals);

  if (hasTrailingSeparator) return `${before},`;
  if (!after) return before;

  return `${before},${after}`;
};

export default function AmountSection({
  control,
  errors,
  styles,
  currencyAlphaCode,
}: Props) {
  const currency = useMemo(
    () => (currencyAlphaCode ? currencyAlphaCode.toUpperCase() : "TND"),
    [currencyAlphaCode],
  );

  const decimals = useMemo(() => getCurrencyDecimals(currency), [currency]);

  const toDisplay = (stored?: string) => stored ?? "";
  const toStored = (typed: string) => sanitizeAmountInput(typed, decimals);

  return (
    <View style={styles.section}>
      <TText tKey="sendMoney.amount.label" style={styles.fieldLabel} />

      <View style={styles.amountInputContainer}>
        <Controller
          control={control}
          name="amount"
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              style={styles.amountInput}
              value={toDisplay(value)}
              onChangeText={(t) => onChange(toStored(t))}
              onBlur={onBlur}
              placeholder={
                t("transactions.placeholder.amount") + " " + currency
              }
              placeholderTextColor={BankingColors.textSecondary}
              keyboardType="decimal-pad"
              inputMode="decimal"
              returnKeyType="done"
              maxLength={16}
              contextMenuHidden
              multiline={false}
              numberOfLines={1}
            />
          )}
        />

        <View style={styles.currencyBadge}>
          <Text style={styles.currencyText}>{currency}</Text>
        </View>
      </View>

      {!!errors.amount?.message && (
        <TText style={styles.errorText} tKey={String(errors.amount.message)} />
      )}
    </View>
  );
}
