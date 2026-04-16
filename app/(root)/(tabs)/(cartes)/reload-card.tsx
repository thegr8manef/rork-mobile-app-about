// app/(root)/(tabs)/(menu)/reload-card.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { ChevronDown, History, RefreshCw } from "lucide-react-native";

import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import ConfirmModal from "@/components/ui/ConfirmModal";
import CardNumberInput from "@/components/cartes/CardNumberInput";
import LoadingScreen from "@/components/LoadingScreen";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import { validateRechargeCarteChapter } from "@/components/home/SendMoneyRefactor/chapter-validation";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import {
  useSearchCardByNumber,
  useReloadCardInit,
  useCardDetails } from "@/hooks/use-card";
import useShowMessage from "@/hooks/useShowMessage";
import { SelectableAccount } from "@/types/selectable-account";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";
import CustomHeader from "@/components/home/Notification/CustomHeader";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createReloadCardSchema,
  ReloadCardFormValues } from "@/validation/reload-card.schema";
import { formatBalance } from "@/utils/account-formatters";

export default function ReloadCardScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { cardId } = useLocalSearchParams<{ cardId?: string }>();
  const { showMessageError } = useShowMessage();

  // ✅ Manual mode only when no cardId
  const isManualMode = !cardId;

  const [cardNumber, setCardNumber] = useState("");
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [chapterError, setChapterError] = useState(false);

  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ------------------ Accounts ------------------
  const { data: accountsData, isLoading: isAccountsLoading } =
    useCustomerAccounts();
  const accounts = accountsData?.data || [];

  // ------------------ Card from cardId (ONLY when provided) ------------------
  const {
    data: cardDetails,
    isLoading: isLoadingDetails,
    error,
    isError } = useCardDetails(cardId ?? "");

  // ------------------ Card by number (ONLY when manual mode) ------------------
  const { data: cardSearchData, isLoading: isLoadingCard } =
    useSearchCardByNumber(isManualMode ? cardNumber : "");

  const cardFromNumber = cardSearchData?.count ? cardSearchData.data[0] : null;

  // ✅ one card object for the whole screen
  const cardInfo =
    (cardDetails as any)?.data ?? (cardDetails as any) ?? cardFromNumber;

  const reloadCardInitMutation = useReloadCardInit();

  const selectedAccount = useMemo(
    () => accounts.find((acc: any) => acc.id === selectedAccountId),
    [accounts, selectedAccountId],
  );

  // ✅ Fix TS: SelectableAccount requires indicativeBalance
  const selectableAccounts: SelectableAccount[] = useMemo(
    () =>
      accounts.map((acc: any) => ({
        id: acc.id,
        displayIndex: acc.displayIndex,
        accountNumber: acc.accountNumber || "",
        accountTitle: acc.accountTitle || "",
        indicativeBalance: String(
          acc.indicativeBalance ??
            acc.availableBalance ??
            acc.accountingBalance ??
            "0",
        ),
        ribFormatAccount: acc.ribFormatAccount || "",
        ibanFormatAccount: acc.ibanFormatAccount || "",
        accountingBalance: String(acc.accountingBalance ?? "0"),
        availableBalance: String(acc.availableBalance ?? "0"),
        currencyAlphaCode: acc.currencyAccount?.alphaCode || "TND",
        branchDesignation: acc.branch?.designation || "" })),
    [accounts],
  );

  const disableHistory = isAccountsLoading;

  // ------------------ Default account ------------------
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  // ------------------ Manual: card not found ------------------
  useEffect(() => {
    if (!isManualMode) return;

    if (cardNumber.length === 16 && cardSearchData?.count === 0) {
      setErrorMessage("reloadCard.cardNotFound");
      setShowErrorModal(true);
    }
  }, [isManualMode, cardNumber, cardSearchData]);

  const showError = useCallback((key: string) => {
    setErrorMessage(key);
    setShowErrorModal(true);
  }, []);

  // ------------------ Loading (only when cardId exists) ------------------
  const isScreenLoading = (!!cardId && isLoadingDetails) || isAccountsLoading;

  // ------------------ CardNumberInput value (same UI in both modes) ------------------
  const cardInputValue = isManualMode ? cardNumber : (cardInfo?.pcipan ?? "");

  // ------------------ Form (Zod + RHF) ------------------
  const reloadSchema = useMemo(
    () =>
      createReloadCardSchema({
        decimals: 2,
        minAmount: 30,
        maxAmount: 1000 }),
    [],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty, touchedFields } } = useForm<ReloadCardFormValues>({
    resolver: zodResolver(reloadSchema),
    defaultValues: { amount: "", motif: "" },
    mode: "onChange",
    reValidateMode: "onChange" });

  const canSubmit = isValid && isDirty;

  // show errors ONLY after blur
  const showAmountError = !!touchedFields.amount && !!errors.amount;
  const showMotifError = !!touchedFields.motif && !!errors.motif;

  // ------------------ Main action ------------------
  const onSubmitReload = useCallback(
    async (data: ReloadCardFormValues) => {
      // ✅ validate card number only in manual mode
      if (isManualMode) {
        if (!cardNumber || cardNumber.length < 16) {
          showError("reloadCard.cardMust16Digits");
          return;
        }
      }

      if (!selectedAccount) {
        showError("reloadCard.selectAccountRequired");
        return;
      }
      const rawAccount = accounts.find((a) => a.id === selectedAccountId);
      const chapterResult = validateRechargeCarteChapter(rawAccount ?? null);
      if (!chapterResult.valid) {
        setChapterError(true);
        showMessageError(
          chapterResult.errorKey!,
          `${chapterResult.errorKey!}.desc`,
        );
        return;
      }
      if (!cardInfo?.id) {
        showError("reloadCard.cardInfoNotFound");
        return;
      }

      const reloadAmount = Number(data.amount); // ✅ normalized by schema
      const accountBalance = parseFloat(
        String(selectedAccount.availableBalance ?? "0"),
      );

      if (reloadAmount > accountBalance) {
        showError("reloadCard.insufficientFunds");
        return;
      }

      const finalMotif = data.motif?.trim() ? data.motif : "Recharge carte";

      try {
        const response = await reloadCardInitMutation.mutateAsync({
          cardId: cardInfo.id,
          body: {
            amount: reloadAmount,
            debtorAccountId: selectedAccount.id,
            motif: finalMotif } });

        const reloadData = {
          reloadId: response.data.id,
          cardId: cardInfo.id,
          cardNumber: isManualMode ? cardNumber : (cardInfo.pcipan ?? ""),
          cardHolder: cardInfo.namePrinted,
          accountId: selectedAccount.id,
          accountLabel: selectedAccount.accountTitle,
          accountNumber: selectedAccount.accountNumber,
          rib: selectedAccount.ribFormatAccount,
          amount: reloadAmount,
          currency: selectedAccount.currencyAccount?.alphaCode || "TND",
          motif: finalMotif };

        router.push({
          pathname: "/(root)/transaction-summary",
          params: {
            transactionType: "reload",
            data: JSON.stringify(reloadData) } });
      } catch (error: any) {
        let errMsg = "reloadCard.reloadFailed";

        if (error?.response?.data?.error?.code) {
          const errorCode = error.response.data.error.code;
          errMsg = `reloadCard.errors.${errorCode}`;
        }

        showError(errMsg);
      }
    },
    [
      cardInfo,
      cardNumber,
      isManualMode,
      reloadCardInitMutation,
      selectedAccount,
      showError,
    ],
  );

  // ------------------ Disable button ------------------
  const disableReload =
    (isManualMode ? !cardNumber || cardNumber.length < 16 : !cardInfo?.id) ||
    !selectedAccount ||
    !canSubmit ||
    reloadCardInitMutation.isPending;

  if (isScreenLoading) {
    return (
      <View style={styles.container}>
        {/* <Stack.Screen options={{ headerShown: false }} /> */}
        <LoadingScreen visible message="common.loading" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ✅ HEADER WITH HISTORY */}
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.reloadCard"
              rightIcon={
                <History
                  size={22}
                  color={
                    disableHistory
                      ? BankingColors.textLight
                      : BankingColors.white
                  }
                  style={{ opacity: disableHistory ? 0.5 : 1 }}
                />
              }
              onRightPress={() => {
                if (disableHistory) return;
                router.navigate("/reload-card-history");
              }}
            />
          ) }}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Spacing.xxxl}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        {/* ACCOUNT */}
        <View style={styles.section}>
          <TText style={styles.label} tKey="reloadCard.selectAccount" />
          <TouchableOpacity
            style={[
              styles.accountPicker,
              chapterError && styles.accountPickerError,
            ]}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.7}
          >
            {selectedAccount ? (
              <View style={styles.accountInfo}>
                <View style={styles.accountIconSmall}>
                  <TText style={styles.accountIconTextSmall}>
                    {selectedAccount.accountTitle?.charAt(0) || "A"}
                  </TText>
                </View>

                <View style={styles.accountDetails}>
                  <TText style={styles.accountName}>
                    {selectedAccount.accountTitle}
                  </TText>
                  <TText style={styles.accountNumber}>
                    {selectedAccount.ribFormatAccount}
                  </TText>
                  <TText style={styles.accountBalance}>
                    {formatBalance(
                      selectedAccount.availableBalance,
                      selectedAccount.currencyAccount?.alphaCode || "TND",
                    )}
                  </TText>
                </View>
              </View>
            ) : (
              <TText
                style={styles.placeholder}
                tKey="reloadCard.selectAccount"
              />
            )}

            <ChevronDown
              size={IconSize.md}
              color={BankingColors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {/* ✅ CARD NUMBER: SAME UI ALWAYS */}
        <CardNumberInput
          value={cardInputValue}
          onChangeText={(v) => {
            if (isManualMode) setCardNumber(v);
          }}
          // isLoading={isManualMode ? isLoadingCard : isLoadingDetails}
          // cardHolderName={cardInfo?.namePrinted}
          error={
            isManualMode && cardNumber.length > 0 && cardNumber.length < 16
              ? "reloadCard.cardMustBe16"
              : undefined
          }
          editable={isManualMode}
        />

        {/* AMOUNT */}
        <View style={styles.section}>
          <TText style={styles.label} tKey="reloadCard.amount" />

          <View style={styles.amountInputContainer}>
            <Controller
              control={control}
              name="amount"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.amountInput}
                  placeholder={t("reloadCard.amountPlaceholder")}
                  placeholderTextColor={BankingColors.textLight}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur} // ✅ marks touched -> show error after blur
                  keyboardType="decimal-pad"
                  maxLength={10}
                />
              )}
            />
            <View style={styles.currencyBadge}>
              <TText style={styles.currencyText} tKey="common.currency" />
            </View>
          </View>

          {showAmountError && (
            <TText
              style={{ marginTop: Spacing.sm, color: BankingColors.error }}
            >
              {t(errors.amount?.message as string)}
            </TText>
          )}
        </View>

        {/* MOTIF */}
        <View style={styles.section}>
          <TText style={styles.label} tKey="reloadCard.motif" />

          <Controller
            control={control}
            name="motif"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.motifInput}
                placeholder={t("reloadCard.motifPlaceholder")}
                placeholderTextColor={BankingColors.textLight}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur} // ✅ marks touched -> show error after blur
                maxLength={100}
              />
            )}
          />

          {showMotifError && (
            <TText
              style={{ marginTop: Spacing.sm, color: BankingColors.error }}
            >
              {t(errors.motif?.message as string)}
            </TText>
          )}
        </View>

        {/* ✅ SUBMIT BUTTON IN SAME UI (NO FOOTER) */}
        <TouchableOpacity
          style={[
            styles.reloadButton,
            disableReload && styles.reloadButtonDisabled,
            { marginBottom: insets.bottom + Spacing.xl },
          ]}
          onPress={handleSubmit(onSubmitReload)}
          disabled={disableReload}
          activeOpacity={0.8}
        >
          <TText style={styles.reloadButtonText} tKey="reloadCard.reload" />
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      {/* ACCOUNT PICKER */}
      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccountId}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setChapterError(false);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={t("reloadCard.selectAccountTitle")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      {/* LOADING */}
      <LoadingScreen
        visible={reloadCardInitMutation.isPending}
        message="reloadCard.initiatingReload"
      />

      {/* ERROR */}
      <ConfirmModal
        visible={showErrorModal}
        titleKey="common.error"
        descriptionKey={errorMessage}
        primaryButtonKey="modal.ok"
        onPrimaryPress={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
    </View>
  );
}

// ✅ YOUR STYLES (footer removed, button reused)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  /* header (simple) */
  customHeader: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between" },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center" },
  headerTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },
  historyBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center" },

  content: { flex: 1, padding: Spacing.lg },

  section: { marginBottom: Spacing.xxl },

  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },
  placeholder: { fontSize: FontSize.md, color: BankingColors.textLight },

  accountPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.md },
  accountPickerError: {
    borderColor: BankingColors.primaryDark,
    borderWidth: 1.5 },
  accountInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },
  accountIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  accountIconTextSmall: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  accountDetails: { flex: 1 },
  accountName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2 },
  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: 2 },
  accountBalance: { fontSize: FontSize.sm, color: BankingColors.textSecondary },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    overflow: "hidden" },
  amountInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg },
  currencyBadge: {
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg },
  currencyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },

  motifInput: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg },

  reloadButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    alignItems: "center" },
  reloadButtonDisabled: { backgroundColor: BankingColors.textLight },
  reloadButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white } });
