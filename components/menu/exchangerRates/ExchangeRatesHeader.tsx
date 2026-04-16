import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { formatLocalizedDate } from "@/utils/date-locale";

type Props = {
  applicationDate?: string | number | Date;
  activeTab: "" | "BBE";
  onChangeTab: (tab: "" | "BBE") => void;
};

export default function ExchangeRatesHeader({
  applicationDate,
  activeTab,
  onChangeTab }: Props) {
  return (
    <View style={styles.header}>
{applicationDate ? (
  <TText style={styles.dateText}>
    <TText tKey="exchangeRates.rateDate" />{" "}
    {formatLocalizedDate(applicationDate, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })}
  </TText>
) : null}

      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "BBE" && styles.activeTab]}
          onPress={() => onChangeTab("BBE")}
          activeOpacity={0.7}
        >
          <TText
            style={[
              styles.tabText,
              activeTab === "BBE" && styles.activeTabText,
            ]}
            tKey="exchangeRates.cashRate"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "" && styles.activeTab]}
          onPress={() => onChangeTab("")}
          activeOpacity={0.7}
        >
          <TText
            style={[styles.tabText, activeTab === "" && styles.activeTabText]}
            tKey="exchangeRates.accountRate"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: BankingColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    ...Shadow.card },
  dateText: {
    textAlign: "center",
    color: BankingColors.textSecondary,
    marginBottom: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs / 2 },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: "center" },
  activeTab: { backgroundColor: BankingColors.primary },
  tabText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary },
  activeTabText: { color: BankingColors.surface, fontFamily: FontFamily.bold } });
