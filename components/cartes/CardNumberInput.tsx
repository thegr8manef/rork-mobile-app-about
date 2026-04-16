import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { CreditCard, CheckCircle } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";

interface CardNumberInputProps {
  value: string;
  onChangeText: (text: string) => void;
  isLoading?: boolean;
  cardHolderName?: string;
  error?: string;
    editable?: boolean;

}

export default function CardNumberInput({
  value,
  onChangeText,
  isLoading,
  cardHolderName,
  error,
    editable = true }: CardNumberInputProps) {
  return (
    <View style={styles.section}>
      <TText style={styles.label} tKey="reloadCard.cardNumber" />
      <View style={styles.cardNumberContainer}>
        <CreditCard size={IconSize.md} color={BankingColors.primary} />
        <TextInput
          contextMenuHidden={true}
          style={styles.cardNumberInput}
          placeholder="XXXX XXXX XXXX XXXX"
          placeholderTextColor={BankingColors.textSecondary}
          value={value}
          onChangeText={(text) => {
            const cleaned = text.replace(/\D/g, "");
            if (cleaned.length <= 16) {
              onChangeText(cleaned);
            }
          }}
          keyboardType="number-pad"
          maxLength={16}
           editable={editable}                 // ✅ NEW
          selectTextOnFocus={editable}        // ✅ nice UX

        />
      </View>

      {error && <TText style={styles.errorText} tKey={error} />}

      {isLoading && (
        <TText style={styles.infoText} tKey="reloadCard.cardInfoLoading" />
      )}

      {cardHolderName && (
        <View style={styles.cardInfoContainer}>
          <CheckCircle size={IconSize.md} color={BankingColors.success} />
          <TText style={styles.cardInfoText} tKey="card.prepayedVerified"/>
          {/*<TText style={styles.cardInfoText}>{cardHolderName}</TText>*/}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxl },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },
  cardNumberContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.md },
  cardNumberInput: {
    flex: 1,
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    paddingVertical: Spacing.md },
  errorText: {
    fontSize: FontSize.sm,
    color: BankingColors.error,
    marginTop: Spacing.xs },
  infoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.xs },
  cardInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: BankingColors.success + "15",
    borderRadius: BorderRadius.md,
    gap: Spacing.sm },
  cardInfoText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.success } });
