import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { ChevronDown } from "lucide-react-native";
import TText from "@/components/TText";
import { SelectableAccount } from "@/types/selectable-account";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { formatBalance } from "@/utils/account-formatters";

interface AccountSelectorProps {
  label?: string;
  selectedAccount?: SelectableAccount;
  onPress: () => void;
  placeholder?: string;
}

export default function AccountSelector({
  label,
  selectedAccount,
  onPress,
  placeholder = "Sélectionner un compte" }: AccountSelectorProps) {
  return (
    <View style={styles.section}>
      {label && <TText tKey={label} style={styles.label} />}
      <TouchableOpacity
        style={styles.selector}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.accountInfo}>
          {selectedAccount ? (
            <>
              <View style={styles.accountIcon}>
                <Text style={styles.accountIconText}>
                  {selectedAccount.accountTitle.charAt(0)}
                </Text>
              </View>
              <View style={styles.accountDetails}>
                <Text style={styles.accountName}>
                  {selectedAccount.accountTitle}
                </Text>
                <Text style={styles.accountNumber}>
                  {selectedAccount.accountNumber}
                </Text>
                <Text style={styles.accountBalance}>
                  Solde: {formatBalance(selectedAccount.availableBalance ?? "0", selectedAccount.currencyAlphaCode ?? "TND")}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.placeholderText}>{placeholder}</Text>
          )}
        </View>
        <ChevronDown size={20} color={BankingColors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: Spacing.sm },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textGray },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border },
  accountInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md },
  accountIcon: {
    width: IconSize.xxl,
    height: IconSize.xxl,
    borderRadius: IconSize.lg,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  accountIconText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  accountDetails: {
    flex: 1 },
  accountName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.xs },
  accountBalance: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.xs },
  placeholderText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary } });
