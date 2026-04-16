import React, { useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Image,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { Star, Phone, Droplet, Truck, Receipt } from "lucide-react-native";

import BillerCard from "@/components/BillerCard";
import ContractCard from "@/components/ContractCard";
import TText from "@/components/TText";
import CategoryHeader from "@/components/factures/CategoryHeader";
import SectionHeader from "@/components/factures/SectionHeader";
import PaymentCard from "@/components/factures/PaymentCard";
import FavoriteSkeleton from "@/components/factures/FavoriteSkeleton";
import BillersSkeleton from "@/components/factures/BillersSkeleton";
import RecentPaymentsSkeleton from "@/components/factures/RecentPaymentsSkeleton";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import { BorderRadius, IconSize } from "@/constants/sizes";

import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHaptic } from "@/utils/useHaptic";

import { Biller } from "@/types/billers";
import { useAuth } from "@/hooks/auth-store";
import {
  useDeleteContractBillersPayment,
  useFetchAllBillers,
  useGetAllContracts,
  useGetAllPaymentsInfinite,
  flattenInfinitePayments,
  useToggleFavoriteBillersPayment,
  billerQueryKeys,
} from "@/hooks/use-billers";
import type { BillPayment } from "@/types/billers";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { normalizePaymentsWithDebug } from "@/utils/paymentsDebug";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "../(menu)/language";

const { width } = Dimensions.get("window");
const FAVORITE_CARD_WIDTH = width - Spacing.lg * 3;
const SNAP = FAVORITE_CARD_WIDTH + Spacing.md;

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(n, max));

/* -------------------------------------------------------------------------- */
/* BUG FIX: Deduplicate contracts by business key (billerId + searchCriteria) */
/* The server can return duplicate contract entries after payments/adds.       */
/* biller-contracts.tsx already does this — index.tsx was missing it.         */
/* -------------------------------------------------------------------------- */
const contractBusinessKey = (c: any): string => {
  const values =
    (c?.searchCriterias ?? [])
      .map((x: any) => String(x?.searchCriteriaValue ?? "").trim())
      .filter(Boolean)
      .join("|") ?? "";
  return `${String(c?.billerId)}|${values}`;
};

const dedupeContractsByBusinessKey = (items: any[]): any[] => {
  const map = new Map<string, any>();
  for (const c of items) map.set(contractBusinessKey(c), c);
  return Array.from(map.values());
};

export default function FacturesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { triggerLightHaptic, triggerSelectionHaptic } = useHaptic();

  const {
    authState: { accessToken },
  } = useAuth();

  const billersQuery = useFetchAllBillers();
  const { data: billers, isLoading: isBillersLoading } = billersQuery;

  const contractsQuery = useGetAllContracts();
  const { data: contracts, isLoading: isContractsLoading } = contractsQuery;

  const billersMemo = useMemo(
    () => (Array.isArray(billers) ? billers : []),
    [billers],
  );
  // ✅ FIX: deduplicate contracts by business key (billerId + searchCriteria values)
  // The server can create duplicate entries on payment/add; without deduplication
  // getContractCount() returns 3 instead of 1 (the count grows on every visit).
  const contractsList = useMemo(
    () =>
      dedupeContractsByBusinessKey(Array.isArray(contracts) ? contracts : []),
    [contracts],
  );

  // ✅ Favorites derived from API (base)
  const favoriteContractsFromApi = useMemo(
    () => contractsList.filter((c: any) => !!c?.isFavorite),
    [contractsList],
  );

  // ✅ Local state for UI removal (optimistic)
  const [favoriteContractsState, setFavoriteContractsState] = useState<any[]>(
    [],
  );

  // ✅ keep local state in sync when API changes
  React.useEffect(() => {
    setFavoriteContractsState(favoriteContractsFromApi);
  }, [favoriteContractsFromApi]);

  const favoriteContracts = favoriteContractsState;

  // ✅ hooks
  const toggleFav = useToggleFavoriteBillersPayment();
  const delContract = useDeleteContractBillersPayment();

  // ✅ UI state
  const [currentFavoriteIndex, setCurrentFavoriteIndex] = useState(0);
  const favoriteFlatListRef = useRef<FlatList>(null);
  const [expandedCategories, setExpandedCategories] = useState<
    Record<string, boolean>
  >({});

  const fixFavoritesScrollAfterChange = useCallback(
    (nextLength: number) => {
      requestAnimationFrame(() => {
        if (nextLength <= 0) {
          setCurrentFavoriteIndex(0);
          favoriteFlatListRef.current?.scrollToOffset({
            offset: 0,
            animated: true,
          });
          return;
        }

        const nextIndex = clamp(currentFavoriteIndex, 0, nextLength - 1);
        setCurrentFavoriteIndex(nextIndex);

        favoriteFlatListRef.current?.scrollToIndex({
          index: nextIndex,
          animated: true,
          viewPosition: 0,
        });
      });
    },
    [currentFavoriteIndex],
  );

  // ⭐ toggle favorite
  const toggleFavoriteContract = useCallback(
    async (contract: any) => {
      triggerSelectionHaptic();

      const contractId = String(contract?.id);
      if (!contractId) return;

      const currentIsFavorite = !!contract?.isFavorite;
      const nextIsFavorite = !currentIsFavorite;

      setFavoriteContractsState((prev) => {
        if (!nextIsFavorite) {
          const next = prev.filter((c) => String(c?.id) !== contractId);
          fixFavoritesScrollAfterChange(next.length);
          return next;
        }

        const exists = prev.some((c) => String(c?.id) === contractId);
        const next = exists
          ? prev
          : [{ ...contract, isFavorite: true }, ...prev];
        fixFavoritesScrollAfterChange(next.length);
        return next;
      });

      try {
        await toggleFav.mutateAsync({
          contractId,
          isFavorite: nextIsFavorite,
        });
      } catch (e: any) {
        setFavoriteContractsState((prev) => {
          if (nextIsFavorite) {
            const next = prev.filter((c) => String(c?.id) !== contractId);
            fixFavoritesScrollAfterChange(next.length);
            return next;
          }

          const exists = prev.some((c) => String(c?.id) === contractId);
          const next = exists
            ? prev
            : [{ ...contract, isFavorite: true }, ...prev];
          fixFavoritesScrollAfterChange(next.length);
          return next;
        });

        const msg = String(e?.message ?? "");
        if (msg.includes("NO_BILLS_FOUND")) {
          console.warn(
            "[FacturesScreen] NO_BILLS_FOUND for contract:",
            contractId,
          );
        } else {
          console.error("[FacturesScreen] toggle favorite failed:", e);
        }
      }
    },
    [toggleFav, triggerSelectionHaptic, fixFavoritesScrollAfterChange],
  );

  // 🗑 delete contract
  const removeContract = useCallback(
    (contract: any) => {
      triggerSelectionHaptic();

      const contractId = String(contract?.id);
      if (!contractId) return;

      setFavoriteContractsState((prev) => {
        const next = prev.filter((c) => String(c?.id) !== contractId);
        fixFavoritesScrollAfterChange(next.length);
        return next;
      });

      delContract.mutate(
        { contractId },
        {
          onError: () => {
            setFavoriteContractsState((prev) => {
              const exists = prev.some((c) => String(c?.id) === contractId);
              const next = exists ? prev : [contract, ...prev];
              fixFavoritesScrollAfterChange(next.length);
              return next;
            });
          },
        },
      );
    },
    [delContract, triggerSelectionHaptic, fixFavoritesScrollAfterChange],
  );

  // ✅ RECENT PAYMENTS
  const LIMIT = 10;
  const paymentsQuery = useGetAllPaymentsInfinite({
    limit: LIMIT,
    keyExtra: { scope: "recent" },
  });

  const {
    data: recentPaymentsData,
    isLoading: isRecentPaymentsLoading,
    isError: isRecentPaymentsError,
  } = paymentsQuery;

  useFocusEffect(
    React.useCallback(() => {
      contractsQuery.refetch();
      billersQuery.refetch();
      paymentsQuery.refetch();
    }, [contractsQuery, billersQuery, paymentsQuery]),
  );

  // ✅ debug: pages shape for RECENT
  React.useEffect(() => {
    if (!recentPaymentsData) return;
    const pagesCount = (recentPaymentsData as any)?.pages?.length ?? 0;
    console.log(`[RECENT] pagesCount=${pagesCount}`);
    const pageSizes =
      (recentPaymentsData as any)?.pages?.map((pg: any, idx: number) => ({
        idx,
        size: pg?.data?.length ?? pg?.items?.length ?? pg?.length ?? "unknown",
        keys: Object.keys(pg ?? {}).slice(0, 10),
      })) ?? [];
    console.log("[RECENT] pageSizes/shape:", pageSizes);
  }, [recentPaymentsData]);

  // ✅ FIX: Normalize + sort + dedupe + logs
  const recentPayments: BillPayment[] = useMemo(() => {
    const flat = flattenInfinitePayments(recentPaymentsData as any) as any[];
    return normalizePaymentsWithDebug("RECENT", flat, {
      dedupeKey: "id_or_reference",
    }) as BillPayment[];
  }, [recentPaymentsData]);

  const displayedPayments = useMemo(
    () => recentPayments.slice(0, 3),
    [recentPayments],
  );
  console.log("🚀 ~ FacturesScreen ~ displayedPayments:", displayedPayments);

  // ✅ debug: confirm UI data order
  React.useEffect(() => {
    console.log(
      "[RECENT][UI displayedPayments] =",
      displayedPayments.map((p: any) => ({
        id: p?.id,
        paymentDate: p?.paymentDate,
        status: p?.transactionStatus,
      })),
    );
  }, [displayedPayments]);

  const getBillerById = useMemo(
    () => (billerId: string) =>
      billersMemo.find((b: any) => String(b?.id) === String(billerId)),
    [billersMemo],
  );

  const getContractCount = useCallback(
    (billerId: string) =>
      contractsList.filter((c: any) => String(c?.billerId) === String(billerId))
        .length,
    [contractsList],
  );

  const getPendingBillsCount = useCallback((_contractId: string) => 0, []);

  const groupedBillers = useMemo(() => {
    const groups: Record<string, Biller[]> = {};
    billersMemo.forEach((biller: any) => {
      const category = biller?.billerCategory?.categoryLabel;
      if (!category) return;
      if (!groups[category]) groups[category] = [];
      groups[category].push(biller);
    });

    return Object.entries(groups)
      .filter(([_, items]) => items.length > 0)
      .map(([category, items]) => ({ category, items }));
  }, [billersMemo]);

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      "Energie et Eau": "billers.category.waterElectricity",
      "Internet et Téléphonie": "billers.category.telephonyInternet",
      Transport: "billers.category.transport",
    };
    return labels[category];
  };
  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      "Energie et Eau": Droplet,
      "Internet et Téléphonie": Phone,
      Transport: Truck,
    };
    return iconMap[category];
  };

  const getCategoryIconColor = (category: string): string => {
    const colorMap: Record<string, string> = {
      "Internet et Téléphonie": "#10B981",
      Transport: "#3B82F6",
      "Energie et Eau": "#F59E0B",
    };
    return colorMap[category];
  };

  const toggleCategory = (category: string) => {
    triggerSelectionHaptic();
    setExpandedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handleFavoriteScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SNAP);

    if (
      index !== currentFavoriteIndex &&
      index >= 0 &&
      index < favoriteContracts.length
    ) {
      setCurrentFavoriteIndex(index);
    }
  };

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const handleContractPress = (contractId: string) => {
    triggerLightHaptic();
    router.navigate({
      pathname: "/(root)/(tabs)/(factures)/contract-bills" as any,
      params: { contractId },
    });
  };

  const handleBillerPress = (billerId: string) => {
    triggerLightHaptic();
    router.navigate({
      pathname: "/(root)/(tabs)/(factures)/biller-contracts" as any,
      params: { billerId },
    });
  };

  const handleAddSubscription = () => {
    triggerLightHaptic();
    router.navigate("/(root)/(tabs)/(factures)/add-biller-contract" as any);
  };

  const handleViewPaymentHistory = () => {
    triggerLightHaptic();
    router.navigate("/(root)/(tabs)/(factures)/biller-payment-history" as any);
  };

  const anyPending = toggleFav.isPending || delContract.isPending;

  // ✅ stronger key for payment cards (avoid reuse glitches)
  const recentPaymentKey = useCallback((p: any) => {
    const id = p?.id ?? "";
    const ref = p?.transactionReference ?? "";
    const date = p?.paymentDate ?? "";
    return `${id}-${ref}-${date}`;
  }, []);

  console.log("🚀 ~ FacturesScreen ~ groupedBillers:", groupedBillers);
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* FAVORITES */}
        <View style={styles.section}>
          <SectionHeader icon={Star} titleKey="billers.myFavorites" />

          {isContractsLoading ? (
            <FavoriteSkeleton />
          ) : favoriteContracts.length > 0 ? (
            <>
              <FlatList
                ref={favoriteFlatListRef}
                data={favoriteContracts}
                horizontal
                showsHorizontalScrollIndicator={false}
                onScroll={handleFavoriteScroll}
                scrollEventThrottle={16}
                snapToInterval={SNAP}
                snapToAlignment="start"
                decelerationRate="fast"
                contentContainerStyle={styles.favoritesContent}
                keyExtractor={(item: any) => String(item?.id)}
                ItemSeparatorComponent={() => (
                  <View style={{ width: Spacing.md }} />
                )}
                onScrollToIndexFailed={({ index }) => {
                  favoriteFlatListRef.current?.scrollToOffset({
                    offset: index * SNAP,
                    animated: true,
                  });
                }}
                renderItem={({ item: contract }: any) => {
                  const biller = getBillerById(String(contract?.billerId));

                  const logo =
                    biller?.billerIcon ||
                    (biller as any)?.logo ||
                    (biller as any)?.icon ||
                    undefined;

                  return (
                    <View style={styles.favoriteCardWrapper}>
                      <ContractCard
                        contract={contract}
                        billerName={contract?.label}
                        pendingBillsCount={getPendingBillsCount(contract?.id)}
                        onPress={() => handleContractPress(contract?.id)}
                        onToggleFavorite={() =>
                          toggleFavoriteContract(contract)
                        }
                        onDelete={() => removeContract(contract)}
                        logo={logo}
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
            </>
          ) : (
            <View style={styles.emptyFavoritesContainer}>
              <View style={styles.emptyFavoritesCard}>
                <View style={styles.emptyFavoritesIconContainer}>
                  <Star
                    size={IconSize.xl}
                    color={BankingColors.primary}
                    fill={BankingColors.primary}
                  />
                </View>
                <TText
                  tKey="billers.noFavoritesDescription"
                  style={styles.emptyFavoritesText}
                />
              </View>
            </View>
          )}
        </View>

        {/* ALL BILLERS */}
        <View style={styles.section}>
          <SectionHeader titleKey="billers.allBillers" />

          {isBillersLoading ? (
            <BillersSkeleton />
          ) : (
            <View style={styles.categoriesContainer}>
              {groupedBillers.map(({ category, items }) => {
                console.log("🚀 ~ FacturesScreen ~ items:", items);
                const isExpanded = !!expandedCategories[category];
                const CategoryIcon = getCategoryIcon(category);
                const iconColor = getCategoryIconColor(category);
                const categoryLabelKey = getCategoryLabel(category);
                return (
                  <View key={category} style={styles.categoryCard}>
                    <CategoryHeader
                      icon={CategoryIcon}
                      iconColor={iconColor}
                      titleKey={categoryLabelKey}
                      subtitleKey="billers.selectBillRef"
                      isExpanded={isExpanded}
                      onPress={() => toggleCategory(category)}
                    />

                    {isExpanded && (
                      <View style={styles.categoryContent}>
                        {category === "telecom" && items[0]?.id === "b3" && (
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={handleAddSubscription}
                          >
                            <View
                              style={[
                                styles.addButtonIcon,
                                { backgroundColor: BankingColors.primary },
                              ]}
                            >
                              {!!items[0]?.billerIcon && (
                                <Image
                                  source={{ uri: items[0].billerIcon }}
                                  style={styles.billerLogo}
                                  resizeMode="cover"
                                />
                              )}
                            </View>
                            <TText
                              tKey="billers.addSubscription"
                              style={styles.addButtonText}
                            />
                          </TouchableOpacity>
                        )}

                        <View style={styles.billersGrid}>
                          {items.map((biller: any, index: number) => (
                            <View
                              key={String(biller?.id ?? index)}
                              style={
                                index !== items.length - 1 &&
                                styles.billerCardWrapper
                              }
                            >
                              <BillerCard
                                biller={biller}
                                contractCount={getContractCount(
                                  String(biller?.id),
                                )}
                                onPress={() =>
                                  handleBillerPress(String(biller?.id))
                                }
                              />
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* RECENT PAYMENTS */}
        <View style={styles.section}>
          <SectionHeader
            titleKey="billers.recentPayments"
            showViewAll={recentPayments.length > 0}
            onViewAllPress={handleViewPaymentHistory}
          />

          {isRecentPaymentsLoading ? (
            <RecentPaymentsSkeleton />
          ) : isRecentPaymentsError ? (
            <View style={styles.emptyPaymentsContainer}>
              <View style={styles.emptyPaymentsCard}>
                <View style={styles.emptyPaymentsIconContainer}>
                  <Receipt size={IconSize.xl} color={BankingColors.primary} />
                </View>
                <TText tKey="common.error" style={styles.emptyPaymentsText} />
              </View>
            </View>
          ) : recentPayments.length > 0 ? (
            <View style={styles.paymentsContainer}>
              {displayedPayments.map((payment: any) => {
                const biller = getBillerById(String(payment?.billerId));
                const logo =
                  biller?.billerIcon ||
                  (biller as any)?.logo ||
                  (biller as any)?.icon ||
                  undefined;

                const amount = parseFloat(
                  payment?.paymentAmount || payment?.requestedAmount || "0",
                );

                return (
                  <PaymentCard
                    key={recentPaymentKey(payment)} // ✅ strong key
                    logo={logo}
                    reference={payment?.transactionReference || payment?.id}
                    date={formatDate(payment?.paymentDate)}
                    amount={amount ? String(amount) : "0"}
                    transactionStatus={payment?.transactionStatus}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyPaymentsContainer}>
              <View style={styles.emptyPaymentsCard}>
                <View style={styles.emptyPaymentsIconContainer}>
                  <Receipt size={IconSize.xl} color={BankingColors.primary} />
                </View>
                <TText
                  tKey="billers.noRecentPaymentsDescription"
                  style={styles.emptyPaymentsText}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1 },
  section: { marginBottom: Spacing.xxxl },

  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  paginationDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: BankingColors.textLight,
  },
  paginationDotActive: {
    backgroundColor: BankingColors.primary,
    width: Spacing.xxl,
  },

  categoriesContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.md },
  categoryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    overflow: "hidden",
    ...Shadow.card,
  },
  categoryContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  addButtonIcon: {
    width: IconSize.xxl,
    height: IconSize.xxl,
    borderRadius: IconSize.md,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  billerLogo: { width: IconSize.xxl, height: IconSize.xxl },
  addButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    flex: 1,
  },

  billersGrid: { gap: Spacing.sm },
  billerCardWrapper: { marginBottom: Spacing.sm },

  favoritesContent: { paddingHorizontal: Spacing.lg },
  favoriteCardWrapper: { width: FAVORITE_CARD_WIDTH },

  paymentsContainer: { paddingHorizontal: Spacing.lg, gap: Spacing.sm },

  emptyFavoritesContainer: { paddingHorizontal: Spacing.lg },
  emptyFavoritesCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadow.card,
  },
  emptyFavoritesIconContainer: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.xl,
    backgroundColor: BankingColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  emptyFavoritesText: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    lineHeight: FontSize.lg,
    flex: 1,
  },

  emptyPaymentsContainer: { paddingHorizontal: Spacing.lg },
  emptyPaymentsCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    ...Shadow.card,
  },
  emptyPaymentsIconContainer: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.xl,
    backgroundColor: BankingColors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  emptyPaymentsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    lineHeight: FontSize.lg,
    flex: 1,
  },
});
