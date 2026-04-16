import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent } from "react-native";
import { Stack, useRouter } from "expo-router";
import { History, Star } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useHaptic } from "@/utils/useHaptic";

import BillerCard from "@/components/BillerCard";
import ContractCard from "@/components/ContractCard";
import TText from "@/components/TText";
import SearchBar from "@/components/factures/SearchBar";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";

import { Biller } from "@/types/billers";
import { SavedContract } from "@/types/contract.types";

import {
  useDeleteContractBillersPayment,
  useFetchAllBillers,
  useGetAllContracts,
  useSearchBillsMutation,
  useToggleFavoriteBillersPayment } from "@/hooks/use-billers";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const SNAP = CARD_WIDTH; // pagingEnabled => snap is the full card width

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

export default function BillersScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { triggerLightHaptic } = useHaptic();

  const { data: billers } = useFetchAllBillers();
  const { data: contracts } = useGetAllContracts();
  const searchBillsMutation = useSearchBillsMutation();

  const toggleFavoriteMutation = useToggleFavoriteBillersPayment(); // expects contractId string
  const delContract = useDeleteContractBillersPayment(); // expects { contractId }

  const anyPending =
    delContract.isPending ||
    searchBillsMutation.isPending ||
    toggleFavoriteMutation.isPending;

  const [searchQuery, setSearchQuery] = useState<string>("");

  const billersMemo = useMemo(() => billers || [], [billers]);
  const contractsMemo = useMemo(
    () => (contracts || []) as SavedContract[],
    [contracts],
  );

  // ✅ local list so UI updates instantly
  const [localContracts, setLocalContracts] = useState<SavedContract[]>([]);
  useEffect(() => {
    setLocalContracts(contractsMemo);
  }, [contractsMemo]);

  const getBillerById = useMemo(
    () => (billerId: string) => billersMemo.find((b) => b.id === billerId),
    [billersMemo],
  );

  // ✅ favorites derived from localContracts
  const favoriteContractsFromLocal = useMemo(
    () => localContracts.filter((c) => !!c.isFavorite),
    [localContracts],
  );

  // ✅ favorites state for carousel stability + "no empty hole"
  const [favoriteContractsState, setFavoriteContractsState] = useState<
    SavedContract[]
  >([]);
  useEffect(() => {
    setFavoriteContractsState(favoriteContractsFromLocal);
  }, [favoriteContractsFromLocal]);

  const favoriteContracts = favoriteContractsState;

  // ✅ carousel refs/state to avoid "empty hole"
  const favoriteFlatListRef = useRef<FlatList<SavedContract>>(null);
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState(0);

  const fixFavoritesIndex = useCallback(
    (nextLen: number) => {
      requestAnimationFrame(() => {
        if (nextLen <= 0) {
          setCurrentFavoriteIndex(0);
          favoriteFlatListRef.current?.scrollToOffset({
            offset: 0,
            animated: true });
          return;
        }

        const nextIndex = clamp(currentFavoriteIndex, 0, nextLen - 1);
        setCurrentFavoriteIndex(nextIndex);

        favoriteFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0 });
      });
    },
    [currentFavoriteIndex],
  );

  const filteredBillers = useMemo(() => {
    if (!searchQuery) return billersMemo;
    const query = searchQuery.toLowerCase();

    return billersMemo.filter(
      (b) =>
        (b.billerLabel || "").toLowerCase().includes(query) ||
        (b.billerType || "").toLowerCase().includes(query),
    );
  }, [billersMemo, searchQuery]);

  const groupedBillers = useMemo(() => {
    const groups: Record<string, Biller[]> = {};
    const seen = new Set<string>();

    filteredBillers.forEach((biller) => {
      if (seen.has(biller.id)) return;
      seen.add(biller.id);

      const category = biller.billerCategory.categoryLabel;
      if (!groups[category]) groups[category] = [];
      groups[category].push(biller);
    });

    return groups;
  }, [filteredBillers]);

  const getContractCount = useCallback(
    (billerId: string) =>
      localContracts.filter((c) => c.billerId === billerId).length,
    [localContracts],
  );

  const getPendingBillsCount = useCallback((_contractId: string) => 0, []);

  const setFavoriteLocally = useCallback((id: string, value: boolean) => {
    setLocalContracts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFavorite: value } : c)),
    );
  }, []);

  // ✅ Toggle favorite using new API (PUT /favorites/{contractId})
  const toggleFavorite = useCallback(
    (contract: SavedContract) => {
      const contractId = String(contract.id);
      const currentIsFavorite = !!contract.isFavorite;
      const nextValue = !currentIsFavorite;

      setFavoriteLocally(contract.id, nextValue);

      if (!nextValue) {
        setFavoriteContractsState((prev) => {
          const next = prev.filter((c) => String(c.id) !== contractId);
          fixFavoritesIndex(next.length);
          return next;
        });
      } else {
        setFavoriteContractsState((prev) => {
          const exists = prev.some((c) => String(c.id) === contractId);
          if (exists) return prev;
          const next = [{ ...contract, isFavorite: true }, ...prev];
          fixFavoritesIndex(next.length);
          return next;
        });
      }

      toggleFavoriteMutation.mutate(
        {
          contractId,
          isFavorite: nextValue },
        {
          onError: (err) => {
            setFavoriteLocally(contract.id, currentIsFavorite);

            setFavoriteContractsState((prev) => {
              if (nextValue) {
                const next = prev.filter((c) => String(c.id) !== contractId);
                fixFavoritesIndex(next.length);
                return next;
              }

              const already = prev.some((c) => String(c.id) === contractId);
              const next = already
                ? prev
                : [{ ...contract, isFavorite: true }, ...prev];
              fixFavoritesIndex(next.length);
              return next;
            });

            console.error("[BillersScreen] toggle favorite failed:", err);
          } },
      );
    },
    [fixFavoritesIndex, setFavoriteLocally, toggleFavoriteMutation],
  );

  // ✅ Delete contract (uses delete contract API)
  const deleteContract = useCallback(
    (contract: SavedContract) => {
      const contractId = String(contract.id);
      const wasFavorite = !!contract.isFavorite;

      // optimistic remove from all contracts (affects counts + favorites derived)
      setLocalContracts((prev) =>
        prev.filter((c) => String(c.id) !== contractId),
      );

      // also ensure it disappears from favorites carousel immediately
      setFavoriteContractsState((prev) => {
        const next = prev.filter((c) => String(c.id) !== contractId);
        fixFavoritesIndex(next.length);
        return next;
      });

      delContract.mutate(
        { contractId },
        {
          onError: (err) => {
            // rollback: restore contract
            setLocalContracts((prev) => [contract, ...prev]);

            if (wasFavorite) {
              setFavoriteContractsState((prev) => {
                const next = [contract, ...prev];
                fixFavoritesIndex(next.length);
                return next;
              });
              setFavoriteLocally(contract.id, true);
            }

            console.error("[BillersScreen] delete contract failed:", err);
          } },
      );
    },
    [delContract, fixFavoritesIndex, setFavoriteLocally],
  );

  const handleBillerPress = (billerId: string) => {
    triggerLightHaptic();
    router.navigate({ pathname: "/biller-contracts", params: { billerId } });
  };

  const handleContractPress = (contractId: string) => {
    triggerLightHaptic();
    router.navigate({ pathname: "/contract-bills", params: { contractId } });
  };

  const handleHistoryPress = () => {
    triggerLightHaptic();
    router.navigate("/biller-payment-history");
  };

  // ✅ keep active dot correct
  const onFavoritesScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = e.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / SNAP);
      if (index !== currentFavoriteIndex) setCurrentFavoriteIndex(index);
    },
    [currentFavoriteIndex],
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "bills.billPayments",
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerRight: () => (
            <TouchableOpacity
              onPress={handleHistoryPress}
              style={styles.headerButton}
            >
              <History size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("billers.searchBiller")}
        />

        {favoriteContracts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Star
                size={20}
                color={BankingColors.warning}
                fill={BankingColors.warning}
              />
              <TText
                tKey="bills.myFavoriteContracts"
                style={styles.sectionTitleSmall}
              />
            </View>

            <FlatList
              ref={favoriteFlatListRef}
              data={favoriteContracts}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              snapToInterval={SNAP}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              keyExtractor={(item) => item.id}
              onScroll={onFavoritesScroll}
              scrollEventThrottle={16}
              onScrollToIndexFailed={({ index }) => {
                favoriteFlatListRef.current?.scrollToOffset({
                  offset: index * SNAP,
                  animated: true });
              }}
              renderItem={({ item: contract }) => {
                const biller = getBillerById(contract.billerId);
                if (!biller) return null;

                return (
                  <View style={{ width: CARD_WIDTH }}>
                    <ContractCard
                      contract={contract}
                      billerName={biller.billerLabel}
                      pendingBillsCount={getPendingBillsCount(contract.id)}
                      onPress={() => handleContractPress(contract.id)}
                      onToggleFavorite={() => toggleFavorite(contract)}
                      onDelete={() => deleteContract(contract)}
                      disableActions={anyPending}
                    />
                  </View>
                );
              }}
            />

            {favoriteContracts.length > 1 && (
              <View style={styles.pagination}>
                {favoriteContracts.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentFavoriteIndex &&
                        styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <TText tKey="bills.allBillers" style={styles.sectionTitle} />
          {Object.keys(groupedBillers).map((categoryLabel) => (
            <View key={categoryLabel} style={styles.categorySection}>
              <TText style={styles.categoryTitle}>{categoryLabel}</TText>

              {groupedBillers[categoryLabel].map((biller) => (
                <BillerCard
                  key={biller.id}
                  biller={biller}
                  contractCount={getContractCount(biller.id)}
                  onPress={() => handleBillerPress(biller.id)}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1 },
  headerButton: { marginRight: Spacing.lg },

  section: { padding: Spacing.lg },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg },
  sectionTitleSmall: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary },

  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.lg },

  categorySection: { marginBottom: Spacing.xxl },
  categoryTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.md,
    paddingLeft: Spacing.xs },

  carouselContent: { paddingHorizontal: 0 },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm },
  paginationDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: BankingColors.disabled },
  paginationDotActive: {
    backgroundColor: BankingColors.warning,
    width: Spacing.xxl } });
