import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Keyboard } from "react-native";
import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";
import i18next from "@/features/i18next";
import { BankingColors } from "@/constants/banking-colors";
import TransactionSkeleton from "@/components/TransactionSkeleton";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { Transaction } from "@/types/banking";
import { height } from "@/utils/scale";
import { useCards, useCardTransactions } from "@/hooks/use-card";
import { CardTransaction, CardTransactionFilters } from "@/types/card.type";
import CardTransactionsHeader from "@/components/cartes/CardTransactionsHeader";
import CardTransactionRow from "@/components/cartes/CardTransactionRow";
import CardPickerModal from "@/components/cartes/CardPickerModal";
import CardTransactionsFilterModal from "@/components/cartes/CardTransactionsFilterModal";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

export default function CardTransactionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { cardIndex } = useLocalSearchParams<{ cardIndex?: string }>();

  const filterSheetRef = useRef<BottomSheetModal>(null);

  const {
    data: cards,
    isLoading: isLoadingCards,
    isFetching: isUpdatingCard } = useCards();

  const [selectedCardId, setSelectedCardId] = useState<string>("");

  useEffect(() => {
    if (cards?.data?.length) {
      const safeIndex = cardIndex ? Number(cardIndex) : 0;
      const index = isNaN(safeIndex) ? 0 : safeIndex;
      const card = cards.data[index];
      if (card) setSelectedCardId(card.id);
    }
  }, [cards, cardIndex]);

  const [searchQuery, setSearchQuery] = useState("");
  const [showCardPicker, setShowCardPicker] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");

  const [draftMonth, setDraftMonth] = useState<string>("all");
  const [draftMinAmount, setDraftMinAmount] = useState("");
  const [draftMaxAmount, setDraftMaxAmount] = useState("");

  const currentCard = cards?.data?.find((c) => c.id === selectedCardId);

const apiFilters: CardTransactionFilters = useMemo(() => {
  let startDate: string | undefined = undefined;
  let endDate: string | undefined = undefined;

  if (selectedMonth !== "all") {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1; // 1-based
    const selectedMonthNum = Number(selectedMonth);

    // If selected month is after current month, assume previous year
    const year =
      selectedMonthNum > currentMonth ? currentYear - 1 : currentYear;

    // Start of selected month
    startDate = `${year}-${selectedMonth}-01`;

    // End of selected month (start of next month)
    const nextMonth = selectedMonthNum === 12 ? 1 : selectedMonthNum + 1;
    const nextYear = selectedMonthNum === 12 ? year + 1 : year;
    const nextMonthStr = String(nextMonth).padStart(2, "0");
    endDate = `${nextYear}-${nextMonthStr}-01`;
  }

  return {
    startDate: startDate ?? "2020-01-01",
    endDate,
    minAmount: minAmount ? Number(minAmount) : undefined,
    maxAmount: maxAmount ? Number(maxAmount) : undefined,
    status: undefined,
    beneficiaryId: undefined,
    debtorAccount: undefined,
    creditorAccount: undefined,
    sort: "createdAt",
    order: "desc",
    page: 1,
    size: 9 };
}, [selectedMonth, minAmount, maxAmount]);

  const { data: cardTxData, isLoading: isLoadingTransactions } =
    useCardTransactions(selectedCardId, apiFilters);

  const cardTransactionsRaw: CardTransaction[] = cardTxData?.data ?? [];

  const transactions: Transaction[] = cardTransactionsRaw.map(
    (ct: CardTransaction) => ({
      id: ct.transactionRef,
      accountId: currentCard?.accounts?.[0]?.accountNumber || "",
      type: "debit",
      amount: ct.amount * -1,
      currency: ct.currency.alphaCode,
      description: ct.label,
      category: ' ',
      date: ct.datetime,
      ledgerDate: ct.datetime,
      valueDate: ct.datetime,
      status:
        ct.status.code === "1"
          ? "completed"
          : ct.status.code === "0"
          ? "completed"
          : "failed",
      recipient: ct.label,
      reference: ct.transactionRef })
  );

  const months = [
    { key: "all", labelKey: "common.allMonths" },
    { key: "01", labelKey: "common.january" },
    { key: "02", labelKey: "common.february" },
    { key: "03", labelKey: "common.march" },
    { key: "04", labelKey: "common.april" },
    { key: "05", labelKey: "common.may" },
    { key: "06", labelKey: "common.june" },
    { key: "07", labelKey: "common.july" },
    { key: "08", labelKey: "common.august" },
    { key: "09", labelKey: "common.september" },
    { key: "10", labelKey: "common.october" },
    { key: "11", labelKey: "common.november" },
    { key: "12", labelKey: "common.december" },
  ];

  const filteredTransactions = transactions.filter((transaction) => {
    return (
      transaction.description
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      transaction.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const handleSelectCard = useCallback((cardId: string) => {
    setSelectedCardId(cardId);
    setShowCardPicker(false);
  }, []);

  const handleCloseCardPicker = useCallback(() => {
    setShowCardPicker(false);
  }, []);

  const openFilters = useCallback(() => {
    setDraftMonth(selectedMonth);
    setDraftMinAmount(minAmount);
    setDraftMaxAmount(maxAmount);
    Keyboard.dismiss();
    filterSheetRef.current?.present();
  }, [selectedMonth, minAmount, maxAmount]);

  const handleApplyFilters = useCallback(() => {
    setSelectedMonth(draftMonth);
    setMinAmount(draftMinAmount);
    setMaxAmount(draftMaxAmount);
  }, [draftMonth, draftMinAmount, draftMaxAmount]);

  const handleClearFilters = useCallback(() => {
    setDraftMonth("all");
    setDraftMinAmount("");
    setDraftMaxAmount("");
    setSelectedMonth("all");
    setMinAmount("");
    setMaxAmount("");
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (selectedMonth && selectedMonth !== "all") || minAmount || maxAmount,
    );
  }, [selectedMonth, minAmount, maxAmount]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (selectedMonth && selectedMonth !== "all") {
      const monthObj = months.find((m) => m.key === selectedMonth);
      const monthLabel = monthObj ? t(monthObj.labelKey) : selectedMonth;
      chips.push({
        key: "month",
        label: `${t("common.month")}: ${monthLabel}` });
    }
    if (minAmount) {
      chips.push({
        key: "min",
        label: `${t("common.minimum")}: ${minAmount}` });
    }
    if (maxAmount) {
      chips.push({
        key: "max",
        label: `${t("common.maximum")}: ${maxAmount}` });
    }
    return chips;
  }, [selectedMonth, minAmount, maxAmount, months, t]);

  const removeFilter = useCallback((key: string) => {
    if (key === "month") {
      setSelectedMonth("all");
      setDraftMonth("all");
    }
    if (key === "min") {
      setMinAmount("");
      setDraftMinAmount("");
    }
    if (key === "max") {
      setMaxAmount("");
      setDraftMaxAmount("");
    }
  }, []);

  const renderHeader = () => (
    <CardTransactionsHeader
      topInset={insets.top}
      cardName={currentCard?.product.description}
      pcipan={currentCard?.pcipan}
      onBack={() => router.back()}
      onSelectCard={() => setShowCardPicker(true)}
      styles={styles}
    />
  );

  const renderSearchBar = () => (
    <View style={styles.searchSection}>
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <Search size={18} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={i18next.t("cards.searchTransactions")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {searchQuery.trim().length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={BankingColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={openFilters}
          activeOpacity={0.85}
          style={[
            styles.filterIconBtn,
            hasActiveFilters && styles.filterIconBtnActive,
          ]}
        >
          <SlidersHorizontal
            size={20}
            color={
              hasActiveFilters ? BankingColors.white : BankingColors.primary
            }
          />
        </TouchableOpacity>
      </View>

      {activeFilterChips.length > 0 && (
        <View style={styles.appliedFiltersRow}>
          <View style={styles.appliedFiltersHeader}>
            <TText style={styles.appliedFiltersLabel}>
              {t("common.filter") || "Filtres"}
            </TText>
            <TText style={styles.appliedFiltersCount}>
              {activeFilterChips.length} {t("common.active") || "actif(s)"}
            </TText>
          </View>
          <View style={styles.chipsList}>
            {activeFilterChips.map((chip) => (
              <View key={chip.key} style={styles.activeChip}>
                <TText style={styles.activeChipText}>{chip.label}</TText>
                <TouchableOpacity
                  onPress={() => removeFilter(chip.key)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={BankingColors.textSecondary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>
      )}
    </View>
  );

  if (isLoadingCards || isLoadingTransactions) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: renderHeader }}
        />
        {renderSearchBar()}
        <TransactionSkeleton count={8} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: renderHeader }}
      />

      <CardTransactionsFilterModal
        sheetRef={filterSheetRef}
        months={months}
        selectedMonth={draftMonth}
        minAmount={draftMinAmount}
        maxAmount={draftMaxAmount}
        onSelectMonth={setDraftMonth}
        onMinChange={setDraftMinAmount}
        onMaxChange={setDraftMaxAmount}
        onClear={handleClearFilters}
        onApply={handleApplyFilters}
      />

      {renderSearchBar()}

      <FlatList
        data={filteredTransactions}
        renderItem={({ item }) => <CardTransactionRow item={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <ScreenState
            variant="empty"
            titleKey="transaction.noFound"
            descriptionKey={searchQuery ? "transaction.adjustSearch" : "transaction.willAppear"}
          />
        }
      />

      <CardPickerModal
        visible={showCardPicker}
        cards={cards?.data ?? []}
        selectedCardId={selectedCardId}
        onClose={handleCloseCardPicker}
        onSelect={handleSelectCard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },
  customHeader: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: Spacing.md },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const },
  headerCardCard: {
    backgroundColor: BankingColors.whiteTransparent15,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    borderWidth: 1,
    borderColor: BankingColors.whiteTransparent20 },
  headerCardContent: {
    flex: 1,
    height: height / 13 },
  headerCardLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    marginBottom: Spacing.xs },
  headerCardNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent80 },

  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    height: 48 },
  searchInput: {
    flex: 1,
    color: BankingColors.text,
    fontSize: FontSize.base },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary },
  filterIconBtnActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary },
  appliedFiltersRow: {
    marginBottom: Spacing.md },
  appliedFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm },
  appliedFiltersLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  appliedFiltersCount: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  chipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: BankingColors.border },
  activeChipText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    fontFamily: FontFamily.medium },
  listContainer: {
    paddingBottom: Spacing.xl,
    paddingHorizontal: 0 },
  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.huge },
  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },
  emptySubtext: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20 } });
