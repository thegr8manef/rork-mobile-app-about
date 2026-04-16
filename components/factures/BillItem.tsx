import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Calendar, CheckSquare, Square } from "lucide-react-native";
import TText from "@/components/TText";
import { Bill } from "@/types/billers";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { BillApiModel } from "@/types/bills.types";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface BillItemProps {
  bill: BillApiModel;
  isSelected: boolean;
  onPress: () => void;
}

export default function BillItem({ bill, isSelected, onPress }: BillItemProps) {
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.cardSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <View style={styles.checkboxContainer}>
          {isSelected ? (
            <CheckSquare size={24} color={BankingColors.primary} />
          ) : (
            <Square size={24} color={BankingColors.textLight} />
          )}
        </View>

        <View style={styles.iconContainer}>
          <View style={[styles.icon]}>
            <Text style={styles.iconText}>📄</Text>
          </View>
        </View>

        <View style={styles.info}>
          {bill.objectRef && (
            <Text style={styles.billNumber}>
              <TText tKey="bills.reference" /> {bill.objectRef}
            </Text>
          )}
          {bill.objectDate && (
            <View style={styles.meta}>
              <Calendar size={12} color={BankingColors.textSecondary} />
              <TText style={styles.date}> {formatDate(bill.objectDate)}</TText>
            </View>
          )}
        </View>

        <View style={styles.amountContainer}>
          <Text style={styles.amount}>
            {formatBalance(bill.objectAmountToPay, "TND")}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    borderLeftWidth: Spacing.xs,
    borderLeftColor: BankingColors.primary,
    ...Shadow.card,
  },
  cardSelected: {
    borderColor: BankingColors.primary,
    backgroundColor: BankingColors.primary + "08",
  },
  cardOverdue: {
    borderLeftColor: BankingColors.error,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  checkboxContainer: {
    width: IconSize.lg,
    height: IconSize.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  iconContainer: {
    width: IconSize.huge,
    height: IconSize.huge,
  },
  icon: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.lg,
    backgroundColor: BankingColors.warningLighter,
    justifyContent: "center",
    alignItems: "center",
  },
  iconOverdue: {
    backgroundColor: BankingColors.errorLight,
  },
  iconText: {
    fontSize: IconSize.lg,
  },
  info: {
    flex: 1,
  },
  billNumber: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  description: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    marginBottom: Spacing.xs,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  date: {
    fontSize: FontSize.xs,
    color: BankingColors.textMuted,
  },
  amountContainer: {
    alignItems: "flex-end",
    gap: Spacing.xs,
  },
  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
  },
  overdueTag: {
    backgroundColor: BankingColors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
  },
  overdueText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
  statusTag: {
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.success,
  },
  statusTagText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.success,
  },
});
