import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard } from "react-native";
import { X, ArrowLeftRight } from "lucide-react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { formatBalance } from "@/utils/account-formatters";

type Rate = {
  currency: string;
  flag: string;
  name: string;
  buyRate: string;
  sellRate: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  fromDinar: boolean;
  setFromDinar: (v: boolean) => void;
  amount: string;
  setAmount: (v: string) => void;
  selectedCurrency: string;
  processedRates: Rate[];
  calculateConversion: () => string;
  onOpenCurrencyPicker: () => void;
  currencyFlags: Record<string, string>;
};

export default function ExchangeRatesCalculatorModal({
  visible,
  onClose,
  fromDinar,
  setFromDinar,
  amount,
  setAmount,
  selectedCurrency,
  processedRates,
  calculateConversion,
  onOpenCurrencyPicker,
  currencyFlags }: Props) {
  const selectedRate =
    processedRates.find((r) => r.currency === selectedCurrency) ?? null;

  const selectedName = selectedRate?.name ?? "";
  const selectedBuy = selectedRate?.buyRate ?? "";
  const selectedSell = selectedRate?.sellRate ?? "";

  const inputCurrency = fromDinar ? "TND" : selectedCurrency;
  const resultCurrency = fromDinar ? selectedCurrency : "TND";
  const rateCurrency = fromDinar ? "TND" : selectedCurrency;

  const stripCurrency = (formattedValue: string, currency: string) =>
    formattedValue.replace(new RegExp(`\\s${currency}$`), "");

  const inputPlaceholder = stripCurrency(
    formatBalance(0, inputCurrency),
    inputCurrency,
  );

  const formattedResult = stripCurrency(
    formatBalance(calculateConversion(), resultCurrency),
    resultCurrency,
  );

  const formattedRate = formatBalance(
    fromDinar ? selectedSell : selectedBuy,
    rateCurrency,
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <TText
                    style={styles.modalTitle}
                    tKey="exchangeRates.calculator"
                  />
                  <TouchableOpacity
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                    }}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X size={24} color={BankingColors.text} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={styles.modalScrollContent}
                >
                  <View style={styles.conversionTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        fromDinar && styles.typeButtonActive,
                      ]}
                      onPress={() => setFromDinar(true)}
                      activeOpacity={0.7}
                    >
                      <TText
                        style={[
                          styles.typeButtonText,
                          fromDinar && styles.typeButtonTextActive,
                        ]}
                        tKey="exchangeRates.tndToCurrency"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeButton,
                        !fromDinar && styles.typeButtonActive,
                      ]}
                      onPress={() => setFromDinar(false)}
                      activeOpacity={0.7}
                    >
                      <TText
                        style={[
                          styles.typeButtonText,
                          !fromDinar && styles.typeButtonTextActive,
                        ]}
                        tKey="exchangeRates.currencyToTnd"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.inputSection}>
                    <TText style={styles.inputLabel}>
                      {fromDinar ? (
                        <TText tKey="exchangeRates.amountInTnd" />
                      ) : (
                        <>
                          <TText tKey="exchangeRates.amountIn" />{" "}
                          {selectedCurrency}
                        </>
                      )}
                    </TText>

                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={amount}
                        onChangeText={setAmount}
                        placeholder={inputPlaceholder}
                        keyboardType="decimal-pad"
                        placeholderTextColor={BankingColors.textLight}
                      />
                      <TText style={styles.inputCurrency}>
                        {inputCurrency}
                      </TText>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.currencySelector}
                    onPress={() => {
                      Keyboard.dismiss();
                      onClose();
                      setTimeout(() => onOpenCurrencyPicker(), 250);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.currencySelectorLeft}>
                      <TText style={styles.currencyFlag}>
                        {currencyFlags[selectedCurrency] || "🏳️"}
                      </TText>
                      <View>
                        <TText style={styles.currencySelectorCode}>
                          {selectedCurrency}
                        </TText>
                        <TText style={styles.currencySelectorName}>
                          {selectedName}
                        </TText>
                      </View>
                    </View>
                    <ArrowLeftRight
                      size={20}
                      color={BankingColors.textSecondary}
                    />
                  </TouchableOpacity>

                  <View style={styles.resultContainer}>
                    <TText
                      style={styles.resultLabel}
                      tKey="exchangeRates.result"
                    />
                    <View style={styles.resultBox}>
                      <TText style={styles.resultAmount}>
                        {formattedResult}
                      </TText>
                      <TText style={styles.resultCurrency}>
                        {resultCurrency}
                      </TText>
                    </View>
                  </View>

                  <View style={styles.rateInfoBox}>
                    <TText style={styles.rateInfoText}>
                      <TText
                        tKey={
                          fromDinar
                            ? "exchangeRates.sellRate"
                            : "exchangeRates.buyRate"
                        }
                      />
                      :{" "}
                      <TText style={styles.rateInfoValue}>
                        {formattedRate}
                      </TText>
                    </TText>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: BankingColors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    maxHeight: "90%" },
  modalScrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
    marginBottom: Spacing.lg },
  modalTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  conversionTypeContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs / 2,
    marginBottom: Spacing.xl },
  typeButton: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center" },
  typeButtonActive: {
    backgroundColor: BankingColors.primary },
  typeButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  typeButtonTextActive: {
    color: BankingColors.surface },
  inputSection: {
    marginBottom: Spacing.lg },
  inputLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: BankingColors.border,
    paddingHorizontal: Spacing.md },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  inputCurrency: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    marginLeft: Spacing.sm },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.md,
    marginBottom: Spacing.xl },
  currencySelectorLeft: {
    flexDirection: "row",
    alignItems: "center" },
  currencyFlag: {
    fontSize: 28,
    marginRight: Spacing.md },
  currencySelectorCode: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs / 2 },
  currencySelectorName: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary },
  resultContainer: {
    marginBottom: Spacing.lg },
  resultLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },
  resultBox: {
    backgroundColor: BankingColors.primaryLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  resultAmount: {
    fontSize: 32,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface },
  resultCurrency: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface },
  rateInfoBox: {
    backgroundColor: BankingColors.backgroundLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: BankingColors.primary },
  rateInfoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  rateInfoValue: {
    fontFamily: FontFamily.bold,
    color: BankingColors.primary } });
