import React from "react";
import { View, StyleSheet } from "react-native";
import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import TText from "@/components/TText";

type Item = {
  currency: string;
  flag: string;
  name: string;
  unity: number;
  buyRate: string;
  sellRate: string;
};

export default function ExchangeRatesTable({ rates }: { rates: Item[] }) {
  return (
    <>
      <View style={styles.tableHeader}>
        <View style={styles.currencyColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.currency" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.unit" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.buy" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.sell" />
        </View>
      </View>

      <View style={styles.ratesContainer}>
        {rates.map((rate, index) => (
          <View
            key={rate.currency}
            style={[styles.rateRow, index === rates.length - 1 && styles.lastRateRow]}
          >
            <View style={styles.currencyColumn}>
              <TText style={styles.flagText}>{rate.flag}</TText>
              <View style={styles.currencyInfo}>
                <TText style={styles.currencyCode}>{rate.currency}</TText>
                <TText style={styles.currencyName} numberOfLines={1}>
                  {rate.name}
                </TText>
              </View>
            </View>
            <View style={styles.rateColumn}>
              <TText style={styles.rateValue}>{rate.unity}</TText>
            </View>
            <View style={styles.rateColumn}>
              <TText style={styles.rateValue}>{(parseFloat(rate.buyRate) * rate.unity).toFixed(3)}</TText>
            </View>
            <View style={styles.rateColumn}>
              <TText style={styles.rateValue}>{(parseFloat(rate.sellRate) * rate.unity).toFixed(3)}</TText>
            </View>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: "row",
    backgroundColor: BankingColors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 2,
    borderBottomColor: BankingColors.primary,
    marginTop: Spacing.md },
  tableHeaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center" },
  ratesContainer: {
    backgroundColor: BankingColors.surface,
    marginBottom: Spacing.lg },
  rateRow: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
    alignItems: "center" },
  lastRateRow: { borderBottomWidth: 0 },
  currencyColumn: { flex: 2, flexDirection: "row", alignItems: "center" },
  flagText: { fontSize: 32, marginRight: Spacing.md },
  currencyInfo: { flex: 1 },
  currencyCode: { fontSize: FontSize.md, fontFamily: FontFamily.bold, color: BankingColors.text },
  currencyName: { fontSize: FontSize.xs, color: BankingColors.textSecondary },
  rateColumn: { flex: 1, alignItems: "center" },
  rateValue: { fontSize: FontSize.md, fontFamily: FontFamily.semibold, color: BankingColors.primary } });
