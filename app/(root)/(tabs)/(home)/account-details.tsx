import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ToastAndroid, TouchableOpacity, Platform } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Clipboard from "expo-clipboard";

import {
  useCustomerAccounts,
  useUpdateAccounts } from "@/hooks/use-accounts-api";

import { BankingColors,
  BorderRadius,
  FontSize,
  IconSize,
  Shadow,
  Spacing, FontFamily } from "@/constants";

import {
  toSelectableAccount,
  SelectableAccount } from "@/types/selectable-account";

import {
  CreditCard,
  Globe,
  Building2,
  User,
  MapPin,
  Share2 } from "lucide-react-native";
import AccountDetailsHeader from "@/components/home/AccountDetail/AccountDetailsHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";
import LabelCard from "@/components/home/AccountDetail/LabelCard";
import DetailRow from "@/components/home/AccountDetail/DetailRow";
import BalancesCard from "@/components/home/AccountDetail/BalancesCard";

import { useHaptic } from "@/utils/useHaptic";
import useShowMessage from "@/hooks/useShowMessage";
import TText from "@/components/TText";

export default function AccountDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const { accountId, currentAccountIndex } = useLocalSearchParams<{
    accountId?: string;
    currentAccountIndex?: string;
  }>();

  const { mutate: updateAccounts, isPending: isUpdatingLabel } =
    useUpdateAccounts();

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const { triggerMediumHaptic } = useHaptic();

  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [accountLabel, setAccountLabel] = useState("");
  const [showBalance, setShowBalance] = useState(true);

  const { data: accountsResponse, isLoading } = useCustomerAccounts();

  const selectableAccounts: SelectableAccount[] = useMemo(() => {
    const raw = accountsResponse?.data ?? [];
    return raw.map(toSelectableAccount);
  }, [accountsResponse?.data]);

  const selectedAccount = useMemo(() => {
    return (
      selectableAccounts.find((a) => a.id === selectedAccountId) ||
      selectableAccounts[0]
    );
  }, [selectableAccounts, selectedAccountId]);

  useEffect(() => {
    if (!selectableAccounts.length) return;

    if (accountId) {
      const found = selectableAccounts.find((a) => a.id === accountId);
      if (found) {
        setSelectedAccountId(found.id);
        setAccountLabel(found.accountTitle);
        return;
      }
    }

    if (currentAccountIndex) {
      const index = Number(currentAccountIndex);
      const byIndex = selectableAccounts[index];

      if (byIndex) {
        setSelectedAccountId(byIndex.id);
        setAccountLabel(byIndex.accountTitle);
        return;
      }
    }

    setSelectedAccountId(selectableAccounts[0].id);
    setAccountLabel(selectableAccounts[0].accountTitle);
  }, [selectableAccounts, accountId, currentAccountIndex]);

  useEffect(() => {
    if (selectedAccount) setAccountLabel(selectedAccount.accountTitle);
  }, [selectedAccount?.id]);

const copyToClipboard = useCallback(
  async (text: string, fieldId: string, label?: string) => {
    try {
      await Clipboard.setStringAsync(text);
      triggerMediumHaptic();
      setCopiedField(fieldId);

      if (Platform.OS === "android") {
        const message = label
          ? t("clipboardCopiedWithValue", { value: label })
          : t("clipboardCopied");
        ToastAndroid.show(message, ToastAndroid.SHORT);
      }

      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      showMessageError(t("common.error"), t("accountDetails.copyError"));
    }
  },
  [t],
);

  const shareRIB = useCallback(() => {
    if (!selectedAccount) return;
    router.push({
      pathname: "/(root)/(tabs)/(home)/view-pdf-rib",
      params: { accountId: selectedAccount.id } });
  }, [selectedAccount]);

  const handleSelectAccount = useCallback((id: string) => {
    setSelectedAccountId(id);
    setShowPicker(false);
  }, []);

  const handleSaveLabel = useCallback(() => {
    if (!selectedAccount) return;

    const body = [
      {
        accountId: selectedAccount.id,
        displayIndex: selectedAccount.displayIndex ?? 0,
        accountLabel: accountLabel },
    ];

    console.log("📤 [updateAccounts] body:", JSON.stringify(body));

    updateAccounts(body, {
      onSuccess: () => {
        setIsEditingLabel(false);
        showMessageSuccess(
          t("common.success"),
          t("accountDetails.labelUpdated"),
        );
      },
      onError: () => {
        showMessageError(
          t("common.error"),
          t("accountDetails.labelUpdateError"),
        );
      } });
  }, [selectedAccount, accountLabel, t, updateAccounts]);
  if (isLoading || !selectedAccount) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.customHeader, { paddingTop: insets.top + 10 }]}>
          <View
            style={{
              height: 150,
              justifyContent: "center",
              alignItems: "center" }}
          >
            <TText
              style={{ color: BankingColors.white, fontSize: FontSize.md }}
              tKey="accountDetails.loading"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <AccountDetailsHeader
              insetsTop={insets.top}
              account={selectedAccount}
              onBack={() => router.back()}
              onOpenPicker={() => setShowPicker(true)}
              styles={styles}
              showBalance={showBalance}
              onToggleBalance={() => setShowBalance((v) => !v)}
            />
          ) }}
      />

      <AccountSelectorBottomSheet
        visible={showPicker}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccountId ?? undefined}
        onSelect={handleSelectAccount}
        onClose={() => setShowPicker(false)}
        title={t("accountDetails.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isLoading}
      />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom: insets.bottom + Spacing.xl,
            alignItems: isLarge ? "center" : "stretch" },
        ]}
      >
        <View
          style={[
            styles.pageInner,
            isLarge && contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
          ]}
        >
          {/* ─── 1. Libellé du compte ─── */}
          <LabelCard
            styles={styles}
            isEditing={isEditingLabel}
            isUpdating={isUpdatingLabel}
            value={accountLabel}
            onChange={setAccountLabel}
            onEdit={() => setIsEditingLabel(true)}
            onSave={handleSaveLabel}
          />

          {/* ─── 2. Soldes ─── */}
          <View style={styles.balancesSection}>
            <BalancesCard styles={styles} account={selectedAccount} />
          </View>

          {/* ─── 3. Relevé d'Identité Bancaire ─── */}
          <View style={styles.ribSection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionHeaderLeft}>
                <View style={styles.iconContainer}>
                  <CreditCard size={20} color={BankingColors.primary} />
                </View>
                <TText style={styles.sectionTitle} tKey="accountDetails.rib" />
              </View>

          <TouchableOpacity onPress={shareRIB} style={styles.shareRow}>
  <Share2 size={16} color={BankingColors.primary} />
  <TText style={styles.shareIconText} tKey="accountDetails.share" />
</TouchableOpacity>
            </View>

            {/* RIB */}
            <DetailRow
              styles={styles}
              icon={
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: BankingColors.actionRed },
                  ]}
                >
                  <CreditCard size={18} color={BankingColors.errorDark} />
                </View>
              }
              label={t("accountDetails.ribLabel")}
              value={selectedAccount.ribFormatAccount}
              copied={copiedField === "rib"}
              onCopy={() =>
                copyToClipboard(selectedAccount.ribFormatAccount, "rib", t("accountDetails.ribLabel"))
              }
            />
          </View>

          {/* ─── 4. Détails (IBAN, BIC, Titulaire, Agence) ─── */}
          <View style={styles.detailsSection}>
            {/* IBAN */}
            <DetailRow
              styles={styles}
              icon={
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: BankingColors.actionBlue },
                  ]}
                >
                  <Globe size={18} color="#0066CC" />
                </View>
              }
              label={t("accountDetails.iban")}
              value={selectedAccount.ibanFormatAccount}
              copied={copiedField === "iban"}
              onCopy={() =>
                copyToClipboard(selectedAccount.ibanFormatAccount, "iban", t("accountDetails.iban"))
              }
            />

            {/* BIC — corrected to BSTUTNTTINT */}
            <DetailRow
              styles={styles}
              icon={
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: BankingColors.actionOrange },
                  ]}
                >
                  <Building2 size={18} color="#FF9500" />
                </View>
              }
              label={t("accountDetails.bic")}
              value={"BSTUTNTTINT"}
              copied={copiedField === "bic"}
              onCopy={() => copyToClipboard("BSTUTNTTINT", "bic", t("accountDetails.bic"))}
            />

            {/* Titulaire */}
            <DetailRow
              styles={styles}
              icon={
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: BankingColors.actionGreen },
                  ]}
                >
                  <User size={18} color="#4CAF50" />
                </View>
              }
              label={t("accountDetails.holder")}
              value={selectedAccount.customer?.displayName ?? "-"}
              copied={copiedField === "holder"}
              onCopy={() =>
                copyToClipboard(
                  selectedAccount.customer?.displayName ?? "-",
                  "holder",
                  t("accountDetails.holder"),
                )
              }
              numberOfLines={2}
            />

            {/* Agence */}
            <DetailRow
              styles={styles}
              icon={
                <View
                  style={[
                    styles.detailIconContainer,
                    { backgroundColor: BankingColors.actionPurple },
                  ]}
                >
                  <MapPin size={18} color="#9C27B0" />
                </View>
              }
              label={t("accountDetails.branch")}
              value={
                selectedAccount.branchDesignation ||
                t("accountDetails.mainBranch")
              }
              copied={copiedField === "branch"}
              onCopy={() =>
                copyToClipboard(
                  selectedAccount.branchDesignation ||
                    t("accountDetails.mainBranch"),
                  "branch",
                  t("accountDetails.branch"),
                )
              }
              numberOfLines={2}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA" },

  customHeader: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg },

  headerInner: {
    width: "100%",
    alignSelf: "center" },

  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const },

  backButton: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    justifyContent: "center" as const,
    alignItems: "center" as const },

  headerAccountCard: {
    flex: 1,
    backgroundColor: BankingColors.whiteTransparent15,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderWidth: 1,
    borderColor: BankingColors.whiteTransparent20 },

  headerAccountContent: {
    flex: 1,
    paddingRight: Spacing.sm },

  headerAccountLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    marginBottom: Spacing.xs },

  headerAccountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent80,
    marginBottom: Spacing.xs },

  headerBalance: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },

  scrollView: {
    flex: 1 },

  scrollContent: {
    padding: Spacing.lg },

  pageInner: {
    width: "100%",
    alignSelf: "center" },

  labelSection: {
    marginBottom: Spacing.xl },

  labelCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.sm },

  labelHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.sm,
    marginBottom: Spacing.md },

  labelTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },

  labelDisplayContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    gap: Spacing.md },

  labelValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    flex: 1 },

  labelEditButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: BankingColors.primary + "15" },

  labelEditContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.sm },

  labelInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: BankingColors.primary,
    borderRadius: BorderRadius.md },

  labelSaveButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: BankingColors.success,
    justifyContent: "center" as const,
    alignItems: "center" as const },

  ribSection: {
    marginBottom: Spacing.xl },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm },

  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm },

  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center" },

  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },

  shareIconButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "#F0F7FF",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.primary + "15" },

  shareIconText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },

  detailsSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.xl },

  detailItem: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...Shadow.sm },

  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.md,
    paddingRight: Spacing.sm },

  detailIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center" },

  detailTextContainer: {
    flex: 1 },

  detailLabel: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    marginBottom: 4,
    fontFamily: FontFamily.medium },

  detailValue: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    fontFamily: FontFamily.semibold },

  copyIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F0F7FF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary + "15" },

  copyIconButtonSuccess: {
    backgroundColor: "#E8F5E9",
    borderColor: BankingColors.success + "15" },

  balancesSection: {
    marginBottom: Spacing.xl },

  balanceCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.sm },
shareRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 6 },

  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing.md,
    gap: Spacing.md },

  balanceLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    flex: 1 },

  balanceValue: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    flexShrink: 0 },

  balanceDivider: {
    height: 1,
    backgroundColor: "#F0F3F8" } });
