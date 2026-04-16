import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Building2,
  ChevronDown,
  BookOpen,
  RefreshCw,
  History } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { BankingColors,
  BorderRadius,
  FontSize,
  Spacing,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useInitChequeBookRequest } from "@/hooks/use-cheques";

import CustomHeader from "@/components/home/Notification/CustomHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import TText from "@/components/TText";
import { validateChequierChapter } from "@/components/home/SendMoneyRefactor/chapter-validation";

import {
  SelectableAccount,
  toSelectableAccount } from "@/types/selectable-account";
import { verticalScale, horizontalScale } from "@/utils/scale";
import useShowMessage from "@/hooks/useShowMessage";
import { getErrorMapping } from "@/utils/api-error-mapper";
import { getCurrencyDecimals } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";
import { BlockingPopup } from "@/components/BlockingPopup";

export default function CreateChequebookScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();

  // ✅ popup state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  const [showAccountModal, setShowAccountModal] = useState(false);

  /**
   * ✅ IMPORTANT TICKET FIX:
   * No account should be preselected on screen open.
   * So we keep it null until user selects one.
   */
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [chapterError, setChapterError] = useState(false);
  const {
    data: accountsResponse,
    isLoading: isAccountsLoading,
    isError: isAccountsError,
    refetch: refetchAccounts } = useCustomerAccounts();

  const selectableAccounts: SelectableAccount[] = useMemo(() => {
    return (accountsResponse?.data ?? []).map(toSelectableAccount);
  }, [accountsResponse?.data]);

  /**
   * ✅ Selected account is derived ONLY from selectedAccountId
   * (no fallback to first account).
   */
  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return selectableAccounts.find((a) => a.id === selectedAccountId) || null;
  }, [selectableAccounts, selectedAccountId]);

  const initChequeBookMutation = useInitChequeBookRequest();
  // Clear chapter error when account changes
  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setChapterError(false);
    setShowAccountModal(false);
  }, []);

  // ✅ open popup
  const handleCreateChequebook = useCallback(() => {
    if (!selectedAccount) {
      showMessageError(t("common.error"), t("cheques.selectAccountFirst"));
      return;
    }

    // ── Chapter validation ──────────────────────────────────────
    const raw = accountsResponse?.data?.find(
      (a) => a.id === selectedAccount.id,
    );
    const result = validateChequierChapter(raw ?? null);
    if (!result.valid) {
      setChapterError(true);
      showMessageError(result.errorKey!, `${result.errorKey!}.desc`);
      return;
    }
    // ────────────────────────────────────────────────────────────

    setConfirmOpen(true);
  }, [selectedAccount, accountsResponse, t, showMessageError]);

  // ✅ confirm action
  const handleConfirmChequebook = useCallback(async () => {
    if (!selectedAccount) return;

    try {
      setConfirmOpen(false); // close modal immediately
      setConfirmLoading(true);

      const res = await initChequeBookMutation.mutateAsync({
        accountId: selectedAccount.id,
        chequeBookType: "01",
        chequeBookNumber: 1 });

      router.navigate({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: "confirm-chequebook",
          data: JSON.stringify({
            requestId: res.id,
            accountId: selectedAccount.id,
            accountLabel: selectedAccount.accountTitle,
            accountNumber: selectedAccount.accountNumber,
            rib: selectedAccount.ribFormatAccount }) } });
    } catch (err: any) {
      // Delay 350ms so BlockingPopup finishes its closing animation
      // before the error toast renders — prevents the "behind popup" display bug.
      setTimeout(() => {
        const errorCode = err?.response?.data?.errorCode;
        const { titleKey, descKey } = getErrorMapping(errorCode);
        showMessageError(t(titleKey), t(descKey));
      }, 350);
    } finally {
      setConfirmLoading(false);
    }
  }, [selectedAccount, initChequeBookMutation, t, showMessageError]);

  /** ✅ history btn logic same as reload-card */
  const disableHistory = isAccountsLoading || isAccountsError;
  const canOpenHistory = !disableHistory;

  /**
   * ✅ Validate disabled until user selects an account.
   * (Also disabled while mutation pending)
   */
  const isDisabled = !selectedAccount || initChequeBookMutation.isPending;

  return (
    <View style={styles.container}>
      {/* ✅ HEADER WITH HISTORY BTN (like reload card) */}
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cheques.create.title"
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
                if (!canOpenHistory) return;
                router.navigate("/chequebook-requests-history");
              }}
            />
          ) }}
      />

      <View
        style={[
          styles.content,
          isLarge && contentMaxWidth
            ? { alignSelf: "center", width: "100%", maxWidth: contentMaxWidth }
            : null,
        ]}
      >
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <BookOpen size={40} color={BankingColors.primary} />
          </View>
        </View>

        <TText tKey="cheques.create.subtitle" style={styles.subtitle} />

        <View style={styles.section}>
          <TText
            tKey="cheques.create.selectAccount"
            style={styles.sectionTitle}
          />

          <TouchableOpacity
            style={[
              styles.accountPicker,
              chapterError && styles.accountPickerError,
            ]}
            onPress={() => {
              // optional: if error, allow retry before opening
              if (isAccountsError) {
                refetchAccounts();
                return;
              }
              setShowAccountModal(true);
            }}
            activeOpacity={0.7}
            disabled={isAccountsLoading}
          >
            {selectedAccount ? (
              <View style={styles.accountInfo}>
                <View style={styles.accountIconSmall}>
                  <Building2 size={20} color={BankingColors.primary} />
                </View>

                <View style={styles.accountDetails}>
                  <Text style={styles.accountName} numberOfLines={1}>
                    {selectedAccount.accountTitle}
                  </Text>

                  <Text style={styles.accountNumber} numberOfLines={1}>
                    {selectedAccount.ribFormatAccount}
                  </Text>

                  <Text style={styles.accountBalance}>
                    {formatBalance(
                      selectedAccount.availableBalance || 0,
                      selectedAccount.currencyAlphaCode,
                    )}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.placeholder}>
                {isAccountsLoading
                  ? t("common.loading")
                  : isAccountsError
                    ? t("common.error")
                    : t("cheques.selectAccount")}
              </Text>
            )}

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <TText tKey="cheques.create.infoTitle" style={styles.infoTitle} />
          <TText
            tKey="cheques.create.infoDescription"
            style={styles.infoDescription}
          />
        </View>
      </View>

      <View
        style={[
          styles.bottomContainer,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
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
            isDisabled && styles.validateButtonDisabled,
          ]}
          onPress={handleCreateChequebook}
          disabled={isDisabled}
        >
          <TText
            tKey={
              initChequeBookMutation.isPending
                ? "common.loading"
                : "common.validate"
            }
            style={styles.validateButtonText}
          />
        </TouchableOpacity>
      </View>

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        /**
         * ✅ Important: if no selection, pass undefined/null so sheet doesn't highlight anything
         */
        selectedAccountId={selectedAccount?.id}
        onSelect={handleSelectAccount}
        onClose={() => setShowAccountModal(false)}
        title={t("cheques.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      {/* ✅ Blocking confirm popup */}
      <BlockingPopup
        visible={confirmOpen}
        title={t("cheques.chequebookRequest")}
        message={t("cheques.confirmRequest")}
        onRequestClose={() => {
          if (!confirmLoading) setConfirmOpen(false);
        }}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        theme={{
          surface: BankingColors.white,
          text: BankingColors.text,
          mutedText: BankingColors.textSecondary,
          border: BankingColors.border,
          primary: BankingColors.primary,
          radius: 16 }}
        actions={[
          {
            label: t("common.validate"),
            variant: "primary",
            loading: confirmLoading,
            onPress: handleConfirmChequebook },
          {
            label: t("common.cancel"),
            variant: "secondary",
            disabled: confirmLoading,
            onPress: () => setConfirmOpen(false) },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  content: {
    flex: 1,
    paddingHorizontal: horizontalScale(Spacing.lg),
    paddingTop: verticalScale(Spacing.xl) },
  iconContainer: {
    alignItems: "center",
    marginBottom: verticalScale(Spacing.xl) },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center" },

  subtitle: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: verticalScale(Spacing.xxl),
    paddingHorizontal: Spacing.lg },

  section: { marginBottom: verticalScale(Spacing.xl) },
  sectionTitle: {
    fontSize: FontSize.base,
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
    gap: Spacing.md,
    minHeight: 80,
    ...Shadow.card },
  accountPickerError: {
    borderColor: BankingColors.primaryDark,
    borderWidth: 1.5 },
  accountInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },
  accountIconSmall: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  accountDetails: { flex: 1, minWidth: 0 },

  accountName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },
  accountBalance: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.primary },

  placeholder: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.textLight },

  infoCard: {
    backgroundColor: BankingColors.primary + "10",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary },
  infoTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: Spacing.sm },
  infoDescription: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  bottomContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    backgroundColor: BankingColors.white,
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
