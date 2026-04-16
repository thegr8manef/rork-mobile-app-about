import React, { useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/hooks/auth-store";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize, FontFamily } from "@/constants";
import { ChevronDown, Info } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import { eTransferInitApi, ApiError } from "@/services/mock-api";
import LoadingScreen from "@/components/LoadingScreen";
import AccountSelectorModal from "@/components/AccountSelectorModal";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TText from "@/components/TText";
import { toSelectableAccount } from "@/types/selectable-account";
import type { SelectableAccount } from "@/types/selectable-account";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useTranslation } from "react-i18next";
import { getCurrencyByNumeric } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";

type FeeInfo = { amount: number; currency: "TND" | "EUR" | "USD" } | null;

function getFeeForCurrency(
  alpha?: string | null,
  numeric?: string | number | null,
): FeeInfo {
  const a = (alpha || "").trim().toUpperCase();
  const n = numeric != null ? String(numeric).trim().padStart(3, "0") : "";

  const key = n || "";

  if (key === "788" || a === "TND") return { amount: 10, currency: "TND" };
  if (key === "978" || a === "EUR") return { amount: 5, currency: "EUR" };
  if (key === "840" || a === "USD") return { amount: 8, currency: "USD" };

  return null;
}

export default function ETransferScreen() {
  const { authState } = useAuth();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const { data: accountsResponse, isLoading } = useCustomerAccounts();
  const accounts = useMemo(
    () => accountsResponse?.data || [],
    [accountsResponse?.data],
  );

  const selectableAccounts: SelectableAccount[] = useMemo(
    () => accounts.map(toSelectableAccount),
    [accounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [amount, setAmount] = useState("");
  const [showAccountSelector, setShowAccountSelector] = useState(false);

  const [errorModal, setErrorModal] = useState<{
    visible: boolean;
    titleKey: string;
    descriptionKey: string;
  }>({ visible: false, titleKey: "", descriptionKey: "" });

  const selectedAccount = useMemo(
    () =>
      selectableAccounts.find((acc) => acc.id === selectedAccountId) || null,
    [selectableAccounts, selectedAccountId],
  );

  const accountCurrencyAlpha = selectedAccount?.currencyAlphaCode || "TND";

  const accountCurrencyNumeric = (selectedAccount as any)
    ?.currencyNumericCode as string | number | undefined;

  const currencyInfo = useMemo(() => {
    if (accountCurrencyNumeric != null) {
      return getCurrencyByNumeric(accountCurrencyNumeric);
    }
    return null;
  }, [accountCurrencyNumeric]);

  const feeInfo = useMemo(
    () => getFeeForCurrency(accountCurrencyAlpha, accountCurrencyNumeric),
    [accountCurrencyAlpha, accountCurrencyNumeric],
  );

  const infoText = useMemo(() => {
    const numeric =
      accountCurrencyNumeric != null
        ? String(accountCurrencyNumeric).padStart(3, "0")
        : null;
    const alpha = accountCurrencyAlpha;

    const currencyLabel =
      (currencyInfo?.designation ? `${currencyInfo.designation}` : alpha) +
      (numeric ? ` (${numeric})` : "");

    if (!selectedAccount) {
      return t("etransfer.infoSelectAccount");
    }

    if (feeInfo) {
      const feeKey =
        feeInfo.currency === "TND"
          ? "etransfer.infoFeesTND"
          : feeInfo.currency === "EUR"
            ? "etransfer.infoFeesEUR"
            : "etransfer.infoFeesUSD";

      const feeLine = t(feeKey, {
        amount: feeInfo.amount,
        currency: feeInfo.currency });
      const verifyLine = t("etransfer.infoVerifyCurrency", { currencyLabel });

      return `${verifyLine} ${feeLine}`;
    }

    const verifyLine = t("etransfer.infoVerifyCurrency", { currencyLabel });
    const genericFees = t("etransfer.infoFeesGeneric");
    return `${verifyLine} ${genericFees}`;
  }, [
    selectedAccount,
    accountCurrencyAlpha,
    accountCurrencyNumeric,
    currencyInfo,
    feeInfo,
    t,
  ]);

  const eTransferMutation = useMutation({
    mutationFn: (data: {
      amount: string;
      creditorAccountId: string;
      deeplink: string;
    }) => eTransferInitApi(authState.accessToken || "", data),

    onSuccess: (response) => {
      router.navigate({
        pathname: "/e-transfer-payment",
        params: {
          orderId: response.orderId,
          clickToPayUrl: response.clickToPayUrl,
          amount: response.amount,
          currency: accountCurrencyAlpha } });
    },

    onError: (error) => {
      let errorMessage = "etransfer.failed";

      if (error instanceof ApiError && (error as any).details) {
        const errorCode = (error as any)?.details?.error?.code;
        if (errorCode) errorMessage = errorCode;
      }

      setErrorModal({
        visible: true,
        titleKey: "common.error",
        descriptionKey: errorMessage });
    } });

  const handleInitiateTransfer = () => {
    if (!selectedAccount) {
      setErrorModal({
        visible: true,
        titleKey: "common.error",
        descriptionKey: t("etransfer.selectAccountError") });
      return;
    }

    const n = Number(String(amount).replace(",", "."));
    if (!amount || Number.isNaN(n) || n <= 0) {
      setErrorModal({
        visible: true,
        titleKey: "common.error",
        descriptionKey: "etransfer.invalidAmount" });
      return;
    }

    const deeplink = "attijariup://transfer-history";

    eTransferMutation.mutate({
      amount: String(n),
      creditorAccountId: selectedAccount.id,
      deeplink });
  };

  const displayBalance = useMemo(() => {
    return formatBalance(selectedAccount?.availableBalance ?? "0", accountCurrencyAlpha);
  }, [selectedAccount?.availableBalance, accountCurrencyAlpha]);

  const footerHeight = insets.bottom + Spacing.xl + 56; // 56 ≈ button height zone

  return (
    <View style={styles.container}>
      {/* ✅ SCROLL CONTENT */}
      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Spacing.xxxl}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: footerHeight },
        ]}
      >
        <View style={styles.accountSection}>
          <TText tKey="etransfer.accountToCredit" style={styles.sectionTitle} />

          <TouchableOpacity
            style={styles.accountPicker}
            onPress={() => setShowAccountSelector(true)}
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
                    {selectedAccount.accountNumber}
                  </TText>
                  <TText style={styles.accountBalance}>
                    <TText tKey="etransfer.balance" />: {displayBalance}
                  </TText>
                </View>
              </View>
            ) : (
              <TText
                tKey="etransfer.selectAccount"
                style={styles.placeholder}
              />
            )}

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TText tKey="etransfer.amount" style={styles.fieldLabel} />
          <View style={styles.amountInputContainer}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.000"
              placeholderTextColor={BankingColors.textLight}
              keyboardType="decimal-pad"
              maxLength={10}
            />
            <View style={styles.currencyBadge}>
              <TText style={styles.currencyText}>{accountCurrencyAlpha}</TText>
            </View>
          </View>
        </View>

        <View style={styles.infoBox}>
          <Info
            size={20}
            color={BankingColors.warning}
            style={styles.infoIcon}
          />
          <TText style={styles.infoText}>{infoText}</TText>
        </View>
      </KeyboardAwareScrollView>

      {/* ✅ FIXED FOOTER OUTSIDE SCROLL */}
      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <TText tKey="common.cancel" style={styles.cancelButtonText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.validateButton,
            (!amount || !selectedAccount || eTransferMutation.isPending) &&
              styles.validateButtonDisabled,
          ]}
          onPress={handleInitiateTransfer}
          disabled={!amount || !selectedAccount || eTransferMutation.isPending}
        >
          <TText
            tKey={
              eTransferMutation.isPending
                ? "etransfer.processing"
                : "common.validate"
            }
            style={styles.validateButtonText}
          />
        </TouchableOpacity>
      </View>

      <LoadingScreen
        visible={eTransferMutation.isPending || isLoading}
        message={t("etransfer.initiating")}
      />

      <AccountSelectorModal
        visible={showAccountSelector}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccountId || undefined}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setShowAccountSelector(false);
        }}
        onClose={() => setShowAccountSelector(false)}
        title={t("etransfer.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isLoading}
      />

      <ConfirmModal
        visible={errorModal.visible}
        titleKey={errorModal.titleKey}
        descriptionKey={errorModal.descriptionKey}
        primaryButtonKey="modal.ok"
        onPrimaryPress={() =>
          setErrorModal({ visible: false, titleKey: "", descriptionKey: "" })
        }
        onClose={() =>
          setErrorModal({ visible: false, titleKey: "", descriptionKey: "" })
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  scrollView: { flex: 1 },

  scrollContent: {
    flexGrow: 1 },

  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.lg },

  fieldLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md },

  accountSection: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md },

  accountPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.md },

  accountInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    minWidth: 0 },

  accountIconSmall: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },

  accountIconTextSmall: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },

  accountDetails: { flex: 1, minWidth: 0 },

  accountName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },

  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },

  accountBalance: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },

  placeholder: {
    flex: 1,
    minWidth: 0,
    fontSize: FontSize.md,
    color: BankingColors.textLight },

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

  infoBox: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    backgroundColor: BankingColors.warning + "10",
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.warning,
    gap: Spacing.sm },

  infoIcon: { marginTop: 2 },

  infoText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.text,
    lineHeight: 20 },

  // ✅ footer pinned with flex (NOT absolute)
  footer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: BankingColors.surface,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    gap: Spacing.md },

  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center" },

  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },

  validateButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center" },

  validateButtonDisabled: {
    backgroundColor: BankingColors.textLight,
    opacity: 0.5 },

  validateButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white } });
