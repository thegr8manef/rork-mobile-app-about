import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  ActivityIndicator,
  LayoutAnimation,
  UIManager,
  Keyboard,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useAuth } from "@/hooks/auth-store";
import { useHaptic } from "@/utils/useHaptic";
import { toSelectableAccount } from "@/types/selectable-account";
import TText from "@/components/TText";
import AccountSelectorModal from "@/components/AccountSelectorModal";
import AccountSelector from "@/components/factures/AccountSelector";
import BillItem from "@/components/factures/BillItem";
import EmptyState from "@/components/factures/EmptyState";
import SkeletonBillItem from "@/components/factures/SkeletonBillItem";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import { BorderRadius } from "@/constants/sizes";
import {
  useFetchAllBillers,
  useGetAllContracts,
  useSearchBillsMutation,
  useInitBillPayment,
} from "@/hooks/use-billers";
import { BillApiModel } from "@/types/bills.types";
import { InitBillPaymentRequest } from "@/types/billers.type";
import { useTranslation } from "react-i18next";
import { BlockingPopup } from "@/components/BlockingPopup";
import { formatBalance } from "@/utils/account-formatters";
import { validateFactureChapter } from "@/components/home/SendMoneyRefactor/chapter-validation";
import useShowMessage from "@/hooks/useShowMessage";
import { ChevronDown, ChevronUp } from "lucide-react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SKELETON_COUNT = 3;

export default function ContractBillsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { authState } = useAuth();
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const { showMessageError } = useShowMessage();

  const initBillPaymentMutation = useInitBillPayment();
  const { data: billersResponse } = useFetchAllBillers();
  const { data: contracts, isLoading: isContractsLoading } =
    useGetAllContracts();

  const billersMemo = useMemo(() => billersResponse || [], [billersResponse]);

  const getBillerById = useMemo(
    () => (billerId: string) => billersMemo.find((b) => b.id === billerId),
    [billersMemo],
  );

  const accountsQuery = useCustomerAccounts();
  const accounts = accountsQuery.data?.data || [];

  const { triggerLightHaptic, triggerSuccessHaptic, triggerErrorHaptic } =
    useHaptic();

  const selectableAccounts = useMemo(
    () => accounts.map(toSelectableAccount),
    [accounts],
  );

  const contract = contracts?.find((c) => c.id === contractId);
  const biller = contract ? getBillerById(contract.billerId) : null;

  const [bills, setBills] = useState<BillApiModel[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [reloadAmount, setReloadAmount] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  const isRechargeType = biller?.billerType === "recharges";

  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    selectableAccounts[0]?.id || "",
  );
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);
  const [chapterError, setChapterError] = useState(false);

  // ── Collapsible account section ─────────────────────────────
  const [accountSectionExpanded, setAccountSectionExpanded] =
    useState<boolean>(true);
  const [reloadSectionExpanded, setReloadSectionExpanded] =
    useState<boolean>(true);
  const selectedAccount = selectableAccounts.find(
    (a) => a.id === selectedAccountId,
  );

  // ✅ popup state for insufficient funds
  const [insufficientOpen, setInsufficientOpen] = useState(false);
  const [insufficientMsg, setInsufficientMsg] = useState<string>("");

  // ✅ helper: parse amounts safely ("1 234,56" or "1234.56")
  const toNumber = (v?: string) => {
    if (!v) return 0;
    const cleaned = String(v).replace(/\s/g, "").replace(",", ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  };

  // ---------- Search params (memo) ----------
  const searchCriteria = contract?.searchCriterias?.[0];
  const searchParams = useMemo(() => {
    if (!contract || !searchCriteria) return null;

    return {
      billerId: contract.billerId,
      searchCriteriaValue: searchCriteria.searchCriteriaValue,
      searchCriteriaLabel: searchCriteria.searchCriteria,
      reloadAmount: isRechargeType ? reloadAmount : undefined,
      contractLabel: contract.label || "",
    };
  }, [contract, searchCriteria, isRechargeType, reloadAmount]);

  const searchBillsMutation = useSearchBillsMutation();

  // ---------- Search action (manual trigger) ----------
  const searchBills = async () => {
    if (!contract || !authState.accessToken || !searchParams) return;
    if (isRechargeType && !reloadAmount.trim()) return;
    Keyboard.dismiss();
    setIsSearching(true);
    setHasSearched(false);

    try {
      const data = await searchBillsMutation.mutateAsync(searchParams);
      setBills(data ?? []);
    } catch (error) {
      console.log("[contract-bill.tsx]❌ Error searching bills:", error);
      setBills([]);
    } finally {
      setHasSearched(true);
      setIsSearching(false);
    }
  };

  // ---------- Initial load for non-recharge ----------
  useEffect(() => {
    if (!isRechargeType && contract && authState.accessToken) {
      void searchBills();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract?.id, isRechargeType, authState.accessToken]);

  const selectedBill = useMemo(() => {
    return bills.find((bill) => bill.id === selectedBillId) || null;
  }, [selectedBillId, bills]);

  const toggleBillSelection = (billId: string) => {
    triggerLightHaptic();

    const newId = selectedBillId === billId ? null : billId;

    // Animate the collapse/expand of account section
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSelectedBillId(newId);
    setAccountSectionExpanded(newId === null); // collapse when a bill is selected
    setReloadSectionExpanded(newId === null);
  };

  const [isInitiating, setIsInitiating] = useState<boolean>(false);

  const handlePayment = async () => {
    if (
      !selectedBillId ||
      !selectedAccount ||
      !selectedBill ||
      !authState.accessToken
    )
      return;

    // ── Chapter validation ──────────────────────────────────────
    const rawAccount = accounts.find((a) => a.id === selectedAccountId);
    const chapterResult = validateFactureChapter(rawAccount ?? null);
    if (!chapterResult.valid) {
      setChapterError(true);
      showMessageError(
        chapterResult.errorKey!,
        `${chapterResult.errorKey!}.desc`,
      );
      return;
    }
    // ────────────────────────────────────────────────────────────

    // ✅ INSUFFICIENT FUNDS CHECK
    const balance = toNumber(
      selectedAccount.availableBalance || selectedAccount.accountingBalance,
    );
    const amountToPay = toNumber(String(selectedBill.objectAmountToPay));

    if (amountToPay === 0.0) {
      setInsufficientMsg(t("bills.zerobills"));
      setInsufficientOpen(true);
      return;
    }

    if (amountToPay > 0 && balance < amountToPay) {
      const currency = selectedAccount.currencyAlphaCode || "TND";
      setInsufficientMsg(
        t("bills.insufficientFunds") +
          `\n\n${t("contract.total")}: ${formatBalance(selectedBill.objectAmountToPay, currency)}` +
          `\n${t("bills.availableBalance") ?? t("common.balance")}: ${formatBalance(
            selectedAccount.availableBalance ??
              selectedAccount.accountingBalance ??
              "0",
            currency,
          )}`,
      );
      setInsufficientOpen(true);
      return;
    }

    setIsInitiating(true);

    try {
      const billerId = contract?.billerId;
      const paymentAmount = selectedBill.objectAmountToPay;
      const requestedAmount = selectedBill.requestedAmount;

      if (!billerId) throw new Error("Missing billerId");
      if (!paymentAmount) throw new Error("Missing paymentAmount");
      if (!requestedAmount) throw new Error("Missing requestedAmount");

      const initPayload: InitBillPaymentRequest = {
        billerId,
        paymentMean: "TRANSFER",
        sourceAccountId: selectedAccountId,
        invoiceId: selectedBillId,
        paymentAmount,
        requestedAmount,
      };

      const initResponse =
        await initBillPaymentMutation.mutateAsync(initPayload);

      triggerSuccessHaptic();
      router.push({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: isRechargeType ? "bill-recharge" : "bill",
          data: JSON.stringify({
            requestId: initResponse?.id,
            billerId: initResponse?.billerId,
            billerName: biller?.billerLabel ?? "",
            contractRef: contract.label,
            accountId: selectedAccountId,
            accountLabel: selectedAccount?.accountTitle,
            accountNumber: selectedAccount?.ribFormatAccount,
            amount: initResponse?.paymentAmount,
            currency: selectedAccount?.currencyAlphaCode || "TND",
            invoiceId: initResponse?.invoiceId,
            transactionId: initResponse?.transactionId,
          }),
        },
      });
    } catch (error) {
      console.log(
        "[contract-bill.tsx] ❌ Error initiating bill payment:",
        error,
      );
      triggerErrorHaptic();
    } finally {
      setIsInitiating(false);
    }
  };

  // no contract / biller found
  if (!contract || !biller) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: t("bills.myBillsToPay"),
            headerStyle: { backgroundColor: BankingColors.primary },
            headerTintColor: "#FFFFFF",
          }}
        />
        <EmptyState titleKey="bills.contractNotFound" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("bills.myBillsToPay"),
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
        }}
      />

      <View style={styles.header}>
        <View style={styles.contractHeader}>
          <TText style={styles.billerName}>{biller.billerLabel}</TText>
          <TText style={styles.contractInfo}>
            {t("bills.contract")} {contract.label}
          </TText>
        </View>

        {isRechargeType && (
          <>
            {/* ── Collapsible reload section ── */}
            <TouchableOpacity
              style={styles.accountLabelRow}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setReloadSectionExpanded((prev) => !prev);
              }}
              activeOpacity={0.7}
            >
              <TText tKey="bills.reloadAmount" style={styles.accountLabel} />
              {reloadSectionExpanded ? (
                <ChevronUp size={18} color={BankingColors.textGray} />
              ) : (
                <ChevronDown size={18} color={BankingColors.textGray} />
              )}
            </TouchableOpacity>

            {/* Expanded */}
            {reloadSectionExpanded && (
              <View style={styles.reloadSection}>
                <View style={styles.reloadInputContainer}>
                  <TextInput
                    style={styles.reloadInput}
                    value={reloadAmount}
                    onChangeText={setReloadAmount}
                    placeholder="0.000"
                    keyboardType="decimal-pad"
                    placeholderTextColor={BankingColors.textMuted}
                  />
                  <TText style={styles.currencyLabel} tKey="common.currency" />
                </View>

                <TouchableOpacity
                  style={[
                    styles.searchButton,
                    (!reloadAmount.trim() || isSearching) &&
                      styles.searchButtonDisabled,
                  ]}
                  onPress={() => void searchBills()}
                  disabled={!reloadAmount.trim() || isSearching}
                >
                  {isSearching ? (
                    <ActivityIndicator
                      color={BankingColors.white}
                      size="small"
                    />
                  ) : (
                    <TText
                      tKey="bills.searchBills"
                      style={styles.searchButtonText}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Collapsed strip */}
            {!reloadSectionExpanded && (
              <TouchableOpacity
                style={styles.accountCollapsedStrip}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setReloadSectionExpanded(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.accountCollapsedAvatar}>
                  <TText style={styles.accountCollapsedAvatarText}>
                    {reloadAmount ? reloadAmount[0] : "0"}
                  </TText>
                </View>

                <View style={{ flex: 1 }}>
                  <TText style={styles.accountCollapsedTitle}>
                    {reloadAmount || "0.000"}
                  </TText>
                  <TText style={styles.accountCollapsedNumber}>
                    {t("common.currency")}
                  </TText>
                </View>

                <ChevronDown size={16} color={BankingColors.textGray} />
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Collapsible account section ── */}
        <TouchableOpacity
          style={styles.accountLabelRow}
          onPress={() => {
            LayoutAnimation.configureNext(
              LayoutAnimation.Presets.easeInEaseOut,
            );
            setAccountSectionExpanded((prev) => !prev);
          }}
          activeOpacity={0.7}
        >
          <TText tKey="bills.accountToDebit" style={styles.accountLabel} />
          {accountSectionExpanded ? (
            <ChevronUp size={18} color={BankingColors.textGray} />
          ) : (
            <ChevronDown size={18} color={BankingColors.textGray} />
          )}
        </TouchableOpacity>

        {accountSectionExpanded && (
          <AccountSelector
            selectedAccount={selectedAccount}
            onPress={() => setShowAccountModal(true)}
            placeholder={t("bills.selectAccount")}
          />
        )}

        {/* Collapsed summary strip */}
        {!accountSectionExpanded && selectedAccount && (
          <TouchableOpacity
            style={styles.accountCollapsedStrip}
            onPress={() => {
              LayoutAnimation.configureNext(
                LayoutAnimation.Presets.easeInEaseOut,
              );
              setAccountSectionExpanded(true);
            }}
            activeOpacity={0.7}
          >
            <View style={styles.accountCollapsedAvatar}>
              <TText style={styles.accountCollapsedAvatarText}>
                {selectedAccount.accountTitle?.[0]?.toUpperCase() ?? "A"}
              </TText>
            </View>
            <View style={{ flex: 1 }}>
              <TText style={styles.accountCollapsedTitle}>
                {selectedAccount.accountTitle}
              </TText>
              <TText style={styles.accountCollapsedNumber}>
                {selectedAccount.ribFormatAccount}
              </TText>
            </View>
            <ChevronDown size={16} color={BankingColors.textGray} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          selectedBillId && styles.contentContainerWithFooter,
        ]}
      >
        {/* ── Skeleton loader ── */}
        {isSearching && (
          <View style={styles.section}>
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <SkeletonBillItem key={i} />
            ))}
          </View>
        )}

        {/* ── Bills list ── */}
        {!isSearching && hasSearched && bills.length > 0 && (
          <View style={styles.section}>
            <View style={{ flexDirection: "row" }}>
              <TText
                tKey={
                  isRechargeType
                    ? "bills.recharge.myBillsToPay"
                    : "bills.myBillsToPay"
                }
                style={styles.sectionTitle}
              />
              <TText style={styles.sectionTitle}>
                {" "}
                ({String(bills.length)})
              </TText>
            </View>

            <TText
              tKey={
                isRechargeType
                  ? "bills.recharge.clickBillRef"
                  : "bills.clickBillRef"
              }
              style={styles.sectionSubtitle}
            />

            {bills.map((bill) => (
              <BillItem
                key={bill.id}
                bill={bill}
                isSelected={selectedBillId === bill.id}
                onPress={() => toggleBillSelection(bill.id)}
              />
            ))}
          </View>
        )}

        {/* ── Empty states ── */}
        {!isSearching && hasSearched && bills.length === 0 && (
          <EmptyState
            titleKey={
              isRechargeType
                ? "bills.recharge.noBillsAvailable"
                : "bills.noBillsAvailable"
            }
            descriptionKey={
              isRechargeType
                ? "bills.recharge.billsWillAppear"
                : "bills.billsWillAppear"
            }
          />
        )}

        {/* ── Initial state (recharge only) ── */}
        {!isSearching && !hasSearched && isRechargeType && (
          <EmptyState
            titleKey="bills.enterReloadAmount"
            descriptionKey="bills.reloadAmountRequired"
          />
        )}
      </ScrollView>

      {selectedBillId && selectedBill && (
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <View style={styles.totalSection}>
              <TText tKey="contract.total" style={styles.totalLabel} />
              <TText style={styles.totalAmount}>
                +{String(selectedBill.objectAmountToPay)} TND
              </TText>
            </View>

            <TouchableOpacity
              style={[
                styles.confirmButton,
                (!selectedAccount ||
                  !selectedBillId ||
                  isInitiating ||
                  selectedBill.objectAmountToPay === "0,000") &&
                  styles.confirmButtonDisabled,
              ]}
              onPress={handlePayment}
              disabled={
                !selectedAccount ||
                !selectedBillId ||
                isInitiating ||
                selectedBill.objectAmountToPay === "0,000"
              }
            >
              {isInitiating ? (
                <ActivityIndicator color={BankingColors.white} size="small" />
              ) : (
                <TText tKey="common.confirm" style={styles.confirmButtonText} />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                LayoutAnimation.configureNext(
                  LayoutAnimation.Presets.easeInEaseOut,
                );
                setSelectedBillId(null);
                setAccountSectionExpanded(true);
                triggerLightHaptic();
              }}
              disabled={isInitiating}
            >
              <TText tKey="common.cancel" style={styles.cancelButtonText} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <AccountSelectorModal
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccountId}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setChapterError(false);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={t("bills.selectAccount")}
        unavailable={accounts.length === 0 && !accountsQuery.isLoading}
      />

      {/* ✅ Blocking popup for insufficient funds */}
      <BlockingPopup
        visible={insufficientOpen}
        title={t("common.warning")}
        message={insufficientMsg || t("bills.insufficientFunds")}
        onRequestClose={() => setInsufficientOpen(false)}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        theme={{
          surface: BankingColors.white,
          text: BankingColors.textPrimary,
          mutedText: BankingColors.textGray,
          border: BankingColors.border,
          primary: BankingColors.primary,
          radius: 16,
        }}
        actions={[
          {
            label: t("common.ok"),
            variant: "primary",
            onPress: () => setInsufficientOpen(false),
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1 },
  contentContainer: { paddingBottom: Spacing.lg },
  contentContainerWithFooter: { paddingBottom: 280 },
  header: {
    backgroundColor: BankingColors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  contractHeader: { marginBottom: Spacing.md },
  // ── Account label row with chevron ──
  accountLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  accountLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  // ── Collapsed strip ──
  accountCollapsedStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  accountCollapsedAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  accountCollapsedAvatarText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },
  accountCollapsedTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  accountCollapsedNumber: {
    fontSize: FontSize.xs,
    color: BankingColors.textGray,
  },
  billerName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  contractInfo: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    marginBottom: Spacing.xs,
  },
  reloadSection: {
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: BankingColors.border,
  },
  reloadLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.sm,
  },
  reloadInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  reloadInput: {
    flex: 1,
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    paddingVertical: Spacing.md,
  },
  currencyLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textGray,
    marginLeft: Spacing.sm,
  },
  searchButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    alignItems: "center",
    ...Shadow.button,
  },
  searchButtonDisabled: { backgroundColor: BankingColors.disabled },
  searchButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  section: { padding: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sectionSubtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textMuted,
    marginBottom: Spacing.lg,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: BankingColors.white,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    paddingBottom:
      Platform.OS === "ios" ? Spacing.xxxl + Spacing.xs : Spacing.lg,
    ...Shadow.xl,
  },
  footerContent: { padding: Spacing.lg },
  totalSection: {
    backgroundColor: BankingColors.successLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textGray,
  },
  totalAmount: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.success,
  },
  confirmButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    ...Shadow.button,
    marginBottom: 11,
  },
  confirmButtonDisabled: { backgroundColor: BankingColors.disabled },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  cancelButton: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    alignItems: "center" as const,
    marginTop: Spacing.sm,
    borderWidth: 1,
    borderColor: BankingColors.border,
    backgroundColor: BankingColors.white,
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textGray,
  },
});
