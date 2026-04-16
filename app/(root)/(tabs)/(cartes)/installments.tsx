import React, { useState, useMemo, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
  ScrollView,
  LayoutAnimation,
  UIManager } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import {
  ShoppingCart,
  Calendar,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Clock,
  CheckCircle,
  Banknote,
  Hash,
  CalendarClock,
  CalendarCheck,
  Info } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import ConfirmModal from "@/components/ui/ConfirmModal";
import {
  useFlexTransactions,
  useUpdateInstallmentInit } from "@/hooks/use-card";
import { FlexTransaction } from "@/types/card.type";
import { router } from "expo-router";
import { formatBalance } from "@/utils/account-formatters";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_W } = Dimensions.get("window");

type TabType = "completed" | "to_split" | "in_progress";

/* ──────────────────────────── helpers ──────────────────────────── */

const getInstallmentNumber = (item: FlexTransaction): number => {
  if (item.clientInstallmentNumber && item.clientInstallmentNumber > 0) {
    return item.clientInstallmentNumber;
  }
  if (item.requestedInstallmentNumber && item.requestedInstallmentNumber > 0) {
    return item.requestedInstallmentNumber;
  }
  return item.defaultInstallmentNumber || 0;
};

const getInstallmentDay = (item: FlexTransaction): number => {
  if (item.clientInstallmentDay && item.clientInstallmentDay > 0) {
    return item.clientInstallmentDay;
  }
  if (item.requestedInstallmentDay && item.requestedInstallmentDay > 0) {
    return item.requestedInstallmentDay;
  }
  return 1;
};

const parseTransactionDate = (dateStr: string): Date => {
  if (!dateStr) return new Date();
  const parts = dateStr.split(" ");
  if (parts.length > 0) {
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      return new Date(
        parseInt(dateParts[2]),
        parseInt(dateParts[1]) - 1,
        parseInt(dateParts[0]),
      );
    }
  }
  return new Date(dateStr);
};

const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const isCompleted = (item: FlexTransaction): boolean => {
  if (item.status !== "MATCHED") return false;
  const installmentNumber = getInstallmentNumber(item);
  const lastInstallment = parseInt(item.lastInstallment) || 0;
  return lastInstallment === installmentNumber && installmentNumber > 0;
};

const isToSplit = (item: FlexTransaction): boolean => {
  if (item.status !== "IN_PROGRESS") return false;
  const transactionDate = parseTransactionDate(item.transactionDate);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return transactionDate >= yesterday;
};

const mapApiStatusToTab = (item: FlexTransaction): TabType => {
  if (isCompleted(item)) return "completed";
  if (isToSplit(item)) return "to_split";
  return "in_progress";
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "";
  const parts = dateStr.split(" ");
  if (parts.length > 0) {
    const dateParts = parts[0].split("/");
    if (dateParts.length === 3) {
      return `${dateParts[0]}/${dateParts[1]}/${dateParts[2]}`;
    }
  }
  return dateStr;
};

const formatDateFromObj = (date: Date): string => {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const calculateFirstPaymentDate = (item: FlexTransaction): string => {
  const installmentNumber = getInstallmentNumber(item);
  if (installmentNumber <= 0) return "--/--/----";
  const txDate = parseTransactionDate(item.transactionDate);
  const day = getInstallmentDay(item);
  const firstPayment = addMonths(txDate, 1);
  firstPayment.setDate(day);
  return formatDateFromObj(firstPayment);
};

const calculateLastPaymentDate = (item: FlexTransaction): string => {
  const installmentNumber = getInstallmentNumber(item);
  if (installmentNumber <= 0) return "--/--/----";
  const txDate = parseTransactionDate(item.transactionDate);
  const day = getInstallmentDay(item);
  const lastPayment = addMonths(txDate, installmentNumber);
  lastPayment.setDate(day);
  return formatDateFromObj(lastPayment);
};

const calculateRemainingInstallments = (item: FlexTransaction): number => {
  const installmentNumber = getInstallmentNumber(item);
  const lastInstallment = parseInt(item.lastInstallment) || 0;
  return Math.max(0, installmentNumber - lastInstallment);
};

const calculateRemainingAmount = (item: FlexTransaction): number => {
  const installmentNumber = getInstallmentNumber(item);
  const lastInstallment = parseInt(item.lastInstallment) || 0;
  const remaining = installmentNumber - lastInstallment;
  if (remaining <= 0 || installmentNumber === 0) return 0;
  return (item.transactionAmount / installmentNumber) * remaining;
};

const cleanMerchantName = (name: string): string => {
  if (!name) return "";
  return name.replace(/>/g, " ").replace(/\s+/g, " ").trim();
};

/* ──────────────────────────── Smooth animation config ──────────────────────────── */

const EXPAND_ANIMATION = {
  duration: 300,
  create: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity },
  update: {
    type: LayoutAnimation.Types.easeInEaseOut },
  delete: {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity } };

/* ──────────────────────────── tab config ──────────────────────────── */

const TAB_CONFIG: Record<
  TabType,
  {
    bg: string;
    color: string;
    statusKey: string;
    icon: typeof CheckCircle;
  }
> = {
  completed: {
    bg: "#E8F5E9",
    color: "#4CAF50",
    statusKey: "installments.completedStatus",
    icon: CheckCircle },
  to_split: {
    bg: "#E3F2FD",
    color: "#2196F3",
    statusKey: "installments.toSplitStatus",
    icon: ShoppingCart },
  in_progress: {
    bg: "#FFF3E0",
    color: "#F57C00",
    statusKey: "installments.inProgressStatus",
    icon: Clock } };

/* ──────────────────────────── detail row config ──────────────────────────── */

interface DetailRowConfig {
  labelKey: string;
  value: string;
  iconBg: string;
  iconColor: string;
  icon: typeof Clock;
}

const getDetailRows = (
  item: FlexTransaction,
  t: (key: string) => string,
): DetailRowConfig[] => {
  const installmentNumber = getInstallmentNumber(item);
  const rows: DetailRowConfig[] = [];

  rows.push({
    labelKey: "installments.splitOn",
    value:
      installmentNumber > 0
        ? `${installmentNumber} ${t("installments.months")}`
        : "--",
    iconBg: "#E3F2FD",
    iconColor: "#2196F3",
    icon: Clock });

  rows.push({
    labelKey: "installments.principalAmount",
    value: formatBalance(item.transactionAmount ?? 0, "TND"),
    iconBg: "#E8F5E9",
    iconColor: "#4CAF50",
    icon: Banknote });

  rows.push({
    labelKey: "installments.remainingAmount",
    value: formatBalance(calculateRemainingAmount(item) ?? 0, "TND"),
    iconBg: "#FFF3E0",
    iconColor: "#F57C00",
    icon: CreditCard });

  rows.push({
    labelKey: "installments.remainingMonths",
    value: String(calculateRemainingInstallments(item)),
    iconBg: "#F3E5F5",
    iconColor: "#9C27B0",
    icon: Hash });

  if (installmentNumber > 0) {
    rows.push({
      labelKey: "installments.firstPaymentDate",
      value: calculateFirstPaymentDate(item),
      iconBg: "#E0F7FA",
      iconColor: "#00ACC1",
      icon: CalendarClock });

    rows.push({
      labelKey: "installments.lastPaymentDate",
      value: calculateLastPaymentDate(item),
      iconBg: "#FCE4EC",
      iconColor: "#E91E63",
      icon: CalendarCheck });
  }

  return rows;
};

/* ──────────────────────────── ExpandableCard ──────────────────────────── */

interface ExpandableCardProps {
  item: FlexTransaction;
  isExpanded: boolean;
  onToggle: () => void;
  onPress: () => void;
  tabType: TabType;
  t: (key: string) => string;
}

const ExpandableCard: React.FC<ExpandableCardProps> = ({
  item,
  isExpanded,
  onToggle,
  onPress,
  tabType,
  t }) => {
  //  console.log("===============================================");
   
  // console.log("🚀 ~ ExpandableCard ~ item:",JSON.stringify(item, null, 2) )
  //    console.log("===============================================");

  const config = TAB_CONFIG[tabType];
  const isExpandable = tabType === "completed" || tabType === "in_progress";
  const merchantDisplay = cleanMerchantName(item.merchantName);
  const detailRows = useMemo(() => getDetailRows(item, t), [item, t]);

  return (
    <View style={cardStyles.card}>
      {/* ── Header ── */}
      <TouchableOpacity
        style={cardStyles.header}
        onPress={isExpandable ? onToggle : onPress}
        activeOpacity={0.7}
      >
        <View style={[cardStyles.iconCircle, { backgroundColor: config.bg }]}>
          <ShoppingCart size={18} color={config.color} />
        </View>

        <View style={cardStyles.headerCenter}>
          <TText style={cardStyles.merchantName} numberOfLines={2}>
            {merchantDisplay}
          </TText>
          <TText style={cardStyles.txDate}>
            {formatDate(item.transactionDate)}
          </TText>
        </View>

        <View style={cardStyles.headerRight}>
          <TText style={cardStyles.amount}>
            {formatBalance(item.transactionAmount ?? 0, "TND")}
          </TText>
          <View style={[cardStyles.badge, { backgroundColor: config.bg }]}>
            <TText
              tKey={config.statusKey}
              style={[cardStyles.badgeText, { color: config.color }]}
            />
          </View>
        </View>
      </TouchableOpacity>

      {/* ── Expand toggle ── */}
      {isExpandable && (
        <TouchableOpacity
          style={cardStyles.expandToggle}
          onPress={onToggle}
          activeOpacity={0.6}
          hitSlop={{ top: 8, bottom: 8, left: 20, right: 20 }}
        >
          {isExpanded ? (
            <ChevronUp size={18} color={BankingColors.textSecondary} />
          ) : (
            <ChevronDown size={18} color={BankingColors.textSecondary} />
          )}
        </TouchableOpacity>
      )}

      {/* ── Expanded details ── */}
      {isExpanded && isExpandable && (
        <View style={cardStyles.expandedSection}>
          <View style={cardStyles.divider} />

          {detailRows.map((row, idx) => {
            const Icon = row.icon;
            const isLast = idx === detailRows.length - 1;
            return (
              <View
                key={idx}
                style={[
                  cardStyles.detailRow,
                  !isLast && cardStyles.detailRowBorder,
                ]}
              >
                <View
                  style={[
                    cardStyles.detailIconCircle,
                    { backgroundColor: row.iconBg },
                  ]}
                >
                  <Icon size={14} color={row.iconColor} />
                </View>
                <TText tKey={row.labelKey} style={cardStyles.detailLabel} />
                <TText style={cardStyles.detailValue}>{row.value}</TText>
              </View>
            );
          })}

          {/* Info note */}
          <View style={cardStyles.infoBox}>
            <Info size={14} color="#5B7FFF" style={{ marginTop: 1 }} />
            <TText
              tKey="installments.principalAmountAlert"
              style={cardStyles.infoText}
            />
          </View>
        </View>
      )}

      {/* ── Split CTA ── */}
      {tabType === "to_split" && (
        <TouchableOpacity
          style={cardStyles.splitBtn}
          onPress={onPress}
          activeOpacity={0.7}
        >
          <TText
            tKey="installments.splitNow"
            style={cardStyles.splitBtnText}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

/* ──────────────────────────── Main Screen ──────────────────────────── */

export default function InstallmentsScreen() {
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const cardId = params.cardId as string;

  const [activeTab, setActiveTab] = useState<TabType>("to_split");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    useState<FlexTransaction | null>(null);
  const [numberOfMonths, setNumberOfMonths] = useState<number>(2);
  const [paymentDay, setPaymentDay] = useState<number>(1);
  const [showDayPicker, setShowDayPicker] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const {
    data: flexData,
    isLoading,
    refetch,
    isRefetching } = useFlexTransactions(cardId);

  const updateInstallmentInitMutation = useUpdateInstallmentInit(cardId);

  const filteredTransactions = useMemo(() => {
    if (!flexData?.data) return [];
    return flexData.data.filter(
      (item) => mapApiStatusToTab(item) === activeTab,
    );
  }, [flexData, activeTab]);

  const handleTransactionPress = useCallback((item: FlexTransaction) => {
    if (mapApiStatusToTab(item) === "to_split") {
      setSelectedTransaction(item);
      setNumberOfMonths(2);
      setPaymentDay(new Date().getDate());
      setShowCreateModal(true);
    }
  }, []);

  const handleToggleExpand = useCallback(
    (itemId: string) => {
      LayoutAnimation.configureNext(EXPAND_ANIMATION);
      setExpandedCardId((prev) => (prev === itemId ? null : itemId));
    },
    [],
  );

  const handleConfirmInstallment = async () => {
    if (!selectedTransaction || numberOfMonths === 0) {
      setErrorMessage("installments.fillAllFields");
      setShowErrorModal(true);
      return;
    }

    try {
      const res = await updateInstallmentInitMutation.mutateAsync({
        authCode: selectedTransaction.authCode,
        body: {
          installmentNumber: numberOfMonths,
          installmentDay: paymentDay } });

      const requestId = res.data?.requestId;
      if (!requestId) {
        throw new Error("Missing requestId from installment init");
      }

      setShowCreateModal(false);
      setSelectedTransaction(null);

      router.navigate({
        pathname: "/(root)/transaction-summary" as any,
        params: {
          transactionType: "installment",
          data: JSON.stringify({
            requestId,
            cardId,
            merchantName: selectedTransaction.merchantName,
            transactionAmount: selectedTransaction.transactionAmount,
            installmentNumber: numberOfMonths,
            installmentDay: paymentDay }) } });
    } catch (error) {
      console.error("Installment init error:", error);
      setErrorMessage("installments.errors.INTERNAL_SERVER_ERROR");
      setShowErrorModal(true);
    }
  };

  const calculateMonthlyPayment = () => {
    if (selectedTransaction && numberOfMonths > 0) {
      return formatBalance(
        selectedTransaction.transactionAmount / numberOfMonths,
        "TND",
      );
    }
    return formatBalance(0, "TND");
  };

  const renderInstallmentCard = ({ item }: { item: FlexTransaction }) => {
    const tabType = mapApiStatusToTab(item);
    return (
      <ExpandableCard
        item={item}
        isExpanded={expandedCardId === item.id}
        onToggle={() => handleToggleExpand(item.id)}
        onPress={() => handleTransactionPress(item)}
        tabType={tabType}
        t={t}
      />
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BankingColors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Tabs ── */}
      <View style={styles.tabsContainer}>
        {(["to_split", "in_progress", "completed"] as TabType[]).map((tab) => {
          const cfg = TAB_CONFIG[tab];
          const Icon = cfg.icon;
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.7}
            >
              <Icon
                size={15}
                color={
                  active ? BankingColors.primary : BankingColors.textSecondary
                }
              />
              <TText
                tKey={`installments.${tab === "to_split" ? "toSplit" : tab === "in_progress" ? "inProgress" : "completed"}`}
                style={[styles.tabText, active && styles.tabTextActive]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Count ── */}
      <View style={styles.countContainer}>
        <TText style={styles.countText}>
          {filteredTransactions.length}{" "}
          <TText tKey="installments.transactions" />
        </TText>
      </View>

      {/* ── List or Empty ── */}
      {filteredTransactions.length === 0 ? (
        <View style={styles.emptyState}>
          {(() => {
            const cfg = TAB_CONFIG[activeTab];
            const Icon = cfg.icon;
            return <Icon size={56} color={BankingColors.disabled} />;
          })()}
          <TText
            tKey={
              activeTab === "completed"
                ? "installments.noCompleted"
                : activeTab === "to_split"
                  ? "installments.noTransactions"
                  : "installments.noInProgress"
            }
            style={styles.emptyText}
          />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          renderItem={renderInstallmentCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[BankingColors.primary]}
              tintColor={BankingColors.primary}
            />
          }
        />
      )}

      {/* ══════════════ Create Modal ══════════════ */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowCreateModal(false)}
        statusBarTranslucent
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.sheet}>
            <View style={modalStyles.handleBar} />

            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={modalStyles.sheetContent}
            >
              {/* Header */}
              <View style={modalStyles.header}>
                <TText
                  tKey="installments.createTitle"
                  style={modalStyles.title}
                />
                <TouchableOpacity
                  onPress={() => setShowCreateModal(false)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <X size={22} color={BankingColors.text} />
                </TouchableOpacity>
              </View>

              {/* Transaction summary */}
              {selectedTransaction && (
                <View style={modalStyles.txSummary}>
                  <View style={modalStyles.txSummaryIcon}>
                    <ShoppingCart size={20} color={BankingColors.primary} />
                  </View>
                  <TText style={modalStyles.txMerchant}>
                    {cleanMerchantName(selectedTransaction.merchantName)}
                  </TText>
                  <TText style={modalStyles.txAmount}>
                    {formatBalance(
                      selectedTransaction.transactionAmount ?? 0,
                      "TND",
                    )}
                  </TText>
                </View>
              )}

              {/* Months selector */}
              <View style={modalStyles.section}>
                <TText
                  tKey="installments.selectMonths"
                  style={modalStyles.sectionLabel}
                />
                <TText style={modalStyles.sectionHint}>
                  {t("installments.selectMonthsHint")}
                </TText>
                <View style={modalStyles.monthsGrid}>
                  {[2, 3, 4, 5, 6, 7, 8, 9].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[
                        modalStyles.monthChip,
                        numberOfMonths === m && modalStyles.monthChipActive,
                      ]}
                      onPress={() => setNumberOfMonths(m)}
                      activeOpacity={0.7}
                    >
                      <TText
                        style={[
                          modalStyles.monthChipText,
                          numberOfMonths === m &&
                            modalStyles.monthChipTextActive,
                        ]}
                      >
                        {m}
                      </TText>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Day picker */}
              <View style={modalStyles.section}>
                <TText
                  tKey="installments.selectPaymentDay"
                  style={modalStyles.sectionLabel}
                />
                <TText style={modalStyles.sectionHint}>
                  {t("installments.selectPaymentDayHint")}
                </TText>
                <TouchableOpacity
                  style={modalStyles.dayBtn}
                  onPress={() => setShowDayPicker(!showDayPicker)}
                  activeOpacity={0.7}
                >
                  <View style={modalStyles.dayBtnLeft}>
                    <Calendar size={18} color={BankingColors.primary} />
                    <TText style={modalStyles.dayBtnText}>{paymentDay}</TText>
                  </View>
                  <ChevronDown
                    size={18}
                    color={BankingColors.textSecondary}
                  />
                </TouchableOpacity>

                {showDayPicker && (
                  <View style={modalStyles.dayGrid}>
                    {Array.from({ length: 30 }, (_, i) => i + 1).map((d) => (
                      <TouchableOpacity
                        key={d}
                        style={[
                          modalStyles.dayCell,
                          paymentDay === d && modalStyles.dayCellActive,
                        ]}
                        onPress={() => {
                          setPaymentDay(d);
                          setShowDayPicker(false);
                        }}
                      >
                        <TText
                          style={[
                            modalStyles.dayCellText,
                            paymentDay === d && modalStyles.dayCellTextActive,
                          ]}
                        >
                          {d}
                        </TText>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Summary */}
              <View style={modalStyles.summaryBox}>
                <View style={modalStyles.summaryRow}>
                  <TText
                    tKey="installments.monthlyPayment"
                    style={modalStyles.summaryLabel}
                  />
                  <TText style={modalStyles.summaryValue}>
                    {calculateMonthlyPayment()}
                  </TText>
                </View>
                {/* Info note in modal */}
                <View style={modalStyles.summaryInfoRow}>
                  <Info size={13} color="#5B7FFF" style={{ marginTop: 1 }} />
                  <TText
                    tKey="installments.principalAmountAlert"
                    style={modalStyles.summaryInfoText}
                  />
                </View>
              </View>

              {/* Confirm */}
              <TouchableOpacity
                style={[
                  modalStyles.confirmBtn,
                  (numberOfMonths === 0 ||
                    updateInstallmentInitMutation.isPending) &&
                    modalStyles.confirmBtnDisabled,
                ]}
                onPress={handleConfirmInstallment}
                disabled={
                  numberOfMonths === 0 ||
                  updateInstallmentInitMutation.isPending
                }
                activeOpacity={0.7}
              >
                {updateInstallmentInitMutation.isPending ? (
                  <ActivityIndicator color={BankingColors.white} />
                ) : (
                  <TText
                    tKey="installments.confirm"
                    style={modalStyles.confirmBtnText}
                  />
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Error / Success modals */}
      <ConfirmModal
        visible={showErrorModal}
        titleKey="common.error"
        descriptionKey={errorMessage}
        primaryButtonKey="modal.ok"
        onPrimaryPress={() => setShowErrorModal(false)}
        onClose={() => setShowErrorModal(false)}
      />
      <ConfirmModal
        visible={showSuccessModal}
        titleKey="common.success"
        descriptionKey="installments.success"
        primaryButtonKey="modal.ok"
        onPrimaryPress={() => {
          setShowSuccessModal(false);
          refetch();
        }}
        onClose={() => {
          setShowSuccessModal(false);
          refetch();
        }}
      />
    </View>
  );
}

/* ══════════════════════════ STYLES ══════════════════════════ */

const IS_SMALL = SCREEN_W < 380;

/* ── Main screen ── */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
    paddingHorizontal: Spacing.xs },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6 },
  tabActive: {
    borderBottomColor: BankingColors.primary },
  tabText: {
    fontSize: IS_SMALL ? 11 : FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  tabTextActive: {
    color: BankingColors.primary },

  countContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm },
  countText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium },

  listContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xxl },

  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl },
  emptyText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginTop: Spacing.lg,
    lineHeight: 20 } });

/* ── Card styles ── */
const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: 16,
    marginBottom: Spacing.md,
    overflow: "hidden",
    ...Shadow.card },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.sm },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0 },
  headerCenter: {
    flex: 1,
    marginRight: Spacing.sm },
  merchantName: {
    fontSize: IS_SMALL ? 13 : 14,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2 },
  txDate: {
    fontSize: 12,
    color: BankingColors.textSecondary },
  headerRight: {
    alignItems: "flex-end",
    flexShrink: 0 },
  amount: {
    fontSize: IS_SMALL ? 14 : 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 4 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6 },
  badgeText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold },

  expandToggle: {
    alignItems: "center",
    paddingBottom: Spacing.sm },

  expandedSection: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md },
  divider: {
    height: 1,
    backgroundColor: BankingColors.borderPale ?? "#F0F0F0",
    marginBottom: Spacing.md },

  /* ── Detail rows with bottom border ── */
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: Spacing.sm },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale ?? "#F0F0F0" },
  detailIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0 },
  detailLabel: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    flex: 1 },
  /* ── Black value text ── */
  detailValue: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: "#1A1A1A",
    flexShrink: 0 },

  /* ── Info note box (blue tint) ── */
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 12,
    backgroundColor: "#EEF2FF",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#D6DEFF" },
  infoText: {
    fontSize: 11,
    color: "#4A5578",
    lineHeight: 16,
    flex: 1 },

  splitBtn: {
    backgroundColor: BankingColors.primary,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center" },
  splitBtnText: {
    color: BankingColors.white,
    fontSize: 14,
    fontFamily: FontFamily.semibold } });

/* ── Modal styles ── */
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end" },
  sheet: {
    backgroundColor: BankingColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "92%",
    overflow: "hidden" },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BankingColors.borderGray ?? "#E0E0E0",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 6 },
  sheetContent: {
    paddingHorizontal: IS_SMALL ? 16 : 20,
    paddingBottom: 34 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },

  txSummary: {
    backgroundColor: BankingColors.surface ?? "#F8F9FA",
    borderRadius: 14,
    padding: Spacing.md,
    alignItems: "center",
    marginBottom: Spacing.lg,
    gap: 6 },
  txSummaryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,120,90,0.08)",
    justifyContent: "center",
    alignItems: "center" },
  txMerchant: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "center" },
  txAmount: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },

  section: {
    marginBottom: Spacing.lg },
  sectionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 4 },
  sectionHint: {
    fontSize: 12,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.sm },

  monthsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8 },
  monthChip: {
    minWidth: IS_SMALL ? 44 : 52,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: BankingColors.border ?? "#D1D5DB",
    alignItems: "center",
    backgroundColor: BankingColors.white },
  monthChipActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  monthChipText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  monthChipTextActive: {
    color: BankingColors.white },

  dayBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderColor: BankingColors.border ?? "#D1D5DB",
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    backgroundColor: BankingColors.white },
  dayBtnLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm },
  dayBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  dayGrid: {
    marginTop: Spacing.sm,
    backgroundColor: BankingColors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BankingColors.border ?? "#D1D5DB",
    padding: 8,
    flexDirection: "row",
    flexWrap: "wrap" },
  dayCell: {
    width: "16.66%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8 },
  dayCellActive: {
    backgroundColor: BankingColors.primary },
  dayCellText: {
    fontSize: 13,
    color: BankingColors.text },
  dayCellTextActive: {
    color: BankingColors.white,
    fontFamily: FontFamily.bold },

  summaryBox: {
    backgroundColor: BankingColors.surface ?? "#F8F9FA",
    borderRadius: 12,
    padding: Spacing.md,
    marginBottom: Spacing.lg },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  summaryLabel: {
    fontSize: 14,
    color: BankingColors.text },
  summaryValue: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  /* Info note in modal summary */
  summaryInfoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    marginTop: 10,
    backgroundColor: "#EEF2FF",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#D6DEFF" },
  summaryInfoText: {
    fontSize: 11,
    color: "#4A5578",
    lineHeight: 16,
    flex: 1 },

  confirmBtn: {
    backgroundColor: BankingColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50 },
  confirmBtnDisabled: {
    opacity: 0.45 },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.white } });