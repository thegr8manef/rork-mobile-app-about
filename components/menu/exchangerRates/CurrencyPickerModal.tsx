import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal, TouchableWithoutFeedback } from "react-native";
import { X } from "lucide-react-native";
import { BankingColors, Spacing, FontSize, BorderRadius, FontFamily } from "@/constants";
import TText from "@/components/TText";

type Rate = {
  currency: string;
  flag: string;
  name: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;

  processedRates: Rate[];

  selectedCurrency: string;
  onSelectCurrency: (currency: string) => void;

  // after selecting a currency, you want to open calculator
  onAfterSelect?: () => void;
};

export default function CurrencyPickerModal({
  visible,
  onClose,
  processedRates,
  selectedCurrency,
  onSelectCurrency,
  onAfterSelect }: Props) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.content}>
          <View style={styles.header}>
            <TText style={styles.title} tKey="exchangeRates.selectCurrency" />
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <X size={24} color={BankingColors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {processedRates.map((rate) => (
              <TouchableOpacity
                key={rate.currency}
                style={[styles.item, selectedCurrency === rate.currency && styles.itemSelected]}
                onPress={() => {
                  onSelectCurrency(rate.currency);
                  onClose();
                  if (onAfterSelect) setTimeout(onAfterSelect, 250);
                }}
                activeOpacity={0.7}
              >
                <TText style={styles.flag}>{rate.flag}</TText>

                <View style={styles.info}>
                  <TText style={styles.code}>{rate.currency}</TText>
                  <TText style={styles.name} numberOfLines={1}>
                    {rate.name}
                  </TText>
                </View>

                {selectedCurrency === rate.currency && <View style={styles.check} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "flex-end" },
  backdrop: { flex: 1 },
  content: {
    backgroundColor: BankingColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  scroll: { maxHeight: "100%" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  itemSelected: { backgroundColor: BankingColors.backgroundLight },
  flag: { fontSize: 28, marginRight: Spacing.md },
  info: { flex: 1 },
  code: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs / 2 },
  name: { fontSize: FontSize.xs, color: BankingColors.textSecondary },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.primary } });
