import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";

import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  CardHeight,
  FontFamily,
} from "@/constants";
import BeneficiarySkeleton from "@/components/BeneficiarySkeleton";
import { Search, User, X, Trash2, ChevronLeft } from "lucide-react-native";
import { Beneficiary } from "@/types/account.type";
import {
  useBeneficiaries,
  useDeleteBeneficiary,
} from "@/hooks/use-accounts-api";
import BeneficiaryCard from "@/components/home/Beneficiary/BeneficiaryCard";
import ScreenState from "@/components/ScreenState";
import useShowMessage from "@/hooks/useShowMessage";
import { useAppPreferencesStore } from "@/store/store";

const MAX_GUIDE_SHOWS = 3;

type ListItem =
  | { type: "sectionTitle"; key: string; title: string }
  | { type: "beneficiary"; key: string; data: Beneficiary };

/* =========================================================
 * Swipe Guide Animation Component
 * ========================================================= */
function SwipeGuideAnimation() {
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 600 }),
          withTiming(0, { duration: 500 }),
          withTiming(0, { duration: 800 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.guideAnimWrapper}>
      <View style={styles.guideDeleteZone}>
        <Trash2 size={18} color="#fff" />
      </View>

      <Animated.View style={[styles.guideMockCard, cardStyle]}>
        <View style={styles.guideMockAvatar}>
          <Text style={styles.guideMockAvatarText}>AB</Text>
        </View>
        <View style={styles.guideMockLines}>
          <View style={styles.guideMockLine1} />
          <View style={styles.guideMockLine2} />
        </View>
        <ChevronLeft size={16} color={BankingColors.textSecondary} />
      </Animated.View>
    </View>
  );
}

/* =========================================================
 * Main Screen
 * ========================================================= */
export default function BeneficiariesScreen() {
  const { t } = useTranslation();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const params = useLocalSearchParams();
  const {
    data: beneficiariesResponse,
    isLoading: isLoadingBeneficiaries,
    isFetching,
    error,
    refetch: refetchBeneficiaries,
  } = useBeneficiaries();

  const beneficiaries: Beneficiary[] = beneficiariesResponse?.data ?? [];

  const deleteInitMutation = useDeleteBeneficiary();

  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<{
    id: string;
    fullName: string;
  } | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const isDeleting =
    deleteInitMutation.isPending && deletingId === selectedBeneficiary?.id;

  const dismissedRef = useRef(false);

  const swipeHintCount = useAppPreferencesStore(
    (s) => s.beneficiarySwipeHintCount,
  );
  const incrementSwipeHint = useAppPreferencesStore(
    (s) => s.incrementBeneficiarySwipeHint,
  );

  /* ── Handle search param ── */
  useEffect(() => {
    if (params.search) {
      setSearchQuery(params.search as string);
    }
  }, [params.search]);

  /* ── Show guide once per mount, up to 3 total ── */
  useEffect(() => {
    if (dismissedRef.current) return;
    if (beneficiaries.length === 0) return;
    if (swipeHintCount < MAX_GUIDE_SHOWS) {
      setShowGuide(true);
    }
  }, [beneficiaries.length, swipeHintCount]);

  const dismissGuide = useCallback(() => {
    dismissedRef.current = true;
    setShowGuide(false);
    incrementSwipeHint();
  }, [incrementSwipeHint]);

  const filteredBeneficiaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return beneficiaries;

    return beneficiaries.filter((b) => {
      const fullName = (b.fullName ?? "").toLowerCase();
      const bankName = (b.bankName ?? "").toLowerCase();
      const rib = (b.rib ?? "").toLowerCase();
      return fullName.includes(q) || bankName.includes(q) || rib.includes(q);
    });
  }, [beneficiaries, searchQuery]);

  const frequentBeneficiaries: Beneficiary[] = useMemo(() => [], []);
  const otherBeneficiaries = useMemo(
    () => filteredBeneficiaries,
    [filteredBeneficiaries],
  );

  const refetchList = useCallback(() => {
    refetchBeneficiaries();
  }, [refetchBeneficiaries]);

  const handleSendMoney = useCallback((beneficiaryId: string) => {
    console.log("🚀 ~ BeneficiariesScreen ~ beneficiaryId:", beneficiaryId);
    router.navigate({
      pathname: "/(root)/(tabs)/(home)/send-money",
      params: { beneficiaryId },
    });
  }, []);

  const handleDeleteBeneficiary = useCallback(
    (beneficiaryId: string, fullName: string) => {
      setSelectedBeneficiary({ id: beneficiaryId, fullName });
      setShowDeleteModal(true);
    },
    [],
  );

  const confirmDelete = useCallback(async () => {
    setShowDeleteModal(false);
    if (!selectedBeneficiary) return;

    const id = selectedBeneficiary.id;

    try {
      setDeletingId(id);

      await deleteInitMutation.mutateAsync({ beneficiaryId: id });

      setSelectedBeneficiary(null);

      showMessageSuccess?.(
        "beneficiaries.deleteSuccessTitle",
        "beneficiaries.deleteSuccessDesc",
      );
    } catch {
      showMessageError("common.error", "beneficiaries.deleteErrorDesc");
    } finally {
      setDeletingId(null);
    }
  }, [
    selectedBeneficiary,
    deleteInitMutation,
    showMessageError,
    showMessageSuccess,
  ]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
  }, []);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];

    if (frequentBeneficiaries.length > 0) {
      items.push({
        type: "sectionTitle",
        key: "frequent-title",
        title: t("beneficiaries.frequent"),
      });
      frequentBeneficiaries.forEach((b) => {
        items.push({ type: "beneficiary", key: `frequent-${b.id}`, data: b });
      });
    }

    if (otherBeneficiaries.length > 0) {
      items.push({
        type: "sectionTitle",
        key: "others-title",
        title: t(
          frequentBeneficiaries.length > 0
            ? "beneficiaries.others"
            : "beneficiaries.all",
        ),
      });
      otherBeneficiaries.forEach((b) => {
        items.push({ type: "beneficiary", key: `other-${b.id}`, data: b });
      });
    }

    return items;
  }, [frequentBeneficiaries, otherBeneficiaries, t]);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      switch (item.type) {
        case "sectionTitle":
          return (
            <View style={styles.sectionTitleContainer}>
              <Text style={styles.sectionTitle}>{item.title}</Text>
            </View>
          );

        case "beneficiary": {
          const firstBeneficiaryIndex = listData.findIndex(
            (i) => i.type === "beneficiary",
          );
          const isFirst = item.key === listData[firstBeneficiaryIndex]?.key;
          return (
            <BeneficiaryCard
              beneficiary={item.data}
              onSendMoney={handleSendMoney}
              onDelete={handleDeleteBeneficiary}
              isDeleting={deletingId === item.data.id}
              actionsDisabled={deletingId !== null}
              showSwipeHint={isFirst && swipeHintCount < MAX_GUIDE_SHOWS}
            />
          );
        }

        default:
          return null;
      }
    },
    [
      deletingId,
      handleSendMoney,
      handleDeleteBeneficiary,
      listData,
      swipeHintCount,
    ],
  );

  const getItemType = useCallback((item: ListItem) => {
    return item.type;
  }, []);

  const renderListHeader = useCallback(() => {
    return (
      <View style={styles.addButtonContainer}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.navigate("/add-beneficiary")}
          disabled={deletingId !== null}
        >
          <User size={20} color={BankingColors.surface} />
          <TText tKey="beneficiaries.add" style={styles.addButtonText} />
        </TouchableOpacity>
      </View>
    );
  }, [deletingId]);

  const renderListEmpty = useCallback(() => {
    return (
      <ScreenState
        variant="empty"
        titleKey={searchQuery ? "beneficiaries.noFound" : "beneficiaries.noYet"}
        descriptionKey={
          searchQuery
            ? "beneficiaries.adjustSearch"
            : "beneficiaries.addDescription"
        }
      />
    );
  }, [searchQuery, deletingId]);

  if (isLoadingBeneficiaries) {
    return (
      <View style={styles.container}>
        <View style={styles.addButtonContainer}>
          <TouchableOpacity style={styles.addButton} disabled>
            <User size={20} color={BankingColors.surface} />
            <TText tKey="beneficiaries.add" style={styles.addButtonText} />
          </TouchableOpacity>
        </View>
        <BeneficiarySkeleton count={4} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <TText tKey="beneficiaries.loadError" style={styles.errorText} />
          <TouchableOpacity style={styles.emptyButton} onPress={refetchList}>
            <TText tKey="beneficiaries.retry" style={styles.emptyButtonText} />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("beneficiaries.searchPlaceholder")}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <X size={20} color={BankingColors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlashList
        data={listData}
        renderItem={renderItem}
        keyExtractor={(item) => item.key}
        getItemType={getItemType}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        contentContainerStyle={styles.listContent}
      />

      {/* ── Delete Confirmation Modal ── */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TText tKey="beneficiaries.delete" style={styles.modalTitle} />

            <Text style={styles.modalMessage}>
              {t("beneficiaries.deleteMessage")}{" "}
              <Text style={{ fontFamily: FontFamily.bold }}>
                {selectedBeneficiary?.fullName}
              </Text>{" "}
              ?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowDeleteModal(false)}
                disabled={deleteInitMutation.isPending || deletingId !== null}
              >
                <TText tKey="common.cancel" style={styles.cancelButtonText} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmDelete}
                disabled={deleteInitMutation.isPending || deletingId !== null}
              >
                <Text style={styles.confirmButtonText}>
                  {deleteInitMutation.isPending || deletingId !== null
                    ? "..."
                    : t("beneficiaries.deleteButton")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Swipe Guide Overlay (once per mount, up to 3 total) ── */}
      {showGuide && beneficiaries.length > 0 && (
        <Modal
          visible={showGuide}
          transparent
          animationType="fade"
          onRequestClose={dismissGuide}
        >
          <TouchableOpacity
            style={styles.guideOverlay}
            activeOpacity={1}
            onPress={dismissGuide}
          >
            <View style={styles.guideContent}>
              <SwipeGuideAnimation />

              <Text style={styles.guideTitle}>
                {t("beneficiaries.swipeGuideTitle", "Glissez pour supprimer")}
              </Text>

              <Text style={styles.guideDesc}>
                {t(
                  "beneficiaries.swipeGuideDesc",
                  "Faites glisser un bénéficiaire vers la gauche pour le supprimer",
                )}
              </Text>

              <TouchableOpacity
                style={styles.guideButton}
                onPress={dismissGuide}
                activeOpacity={0.8}
              >
                <Text style={styles.guideButtonText}>
                  {t("common.understood", "Compris")}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  listContent: {
    paddingBottom: CardHeight.md,
  },

  addButtonContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  addButton: {
    backgroundColor: BankingColors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadow.md,
  },
  addButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface,
  },

  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },

  sectionTitleContainer: {
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: Spacing.massive + Spacing.md,
    paddingHorizontal: IconSize.xxxl + Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.xl,
    marginBottom: Spacing.xxl,
  },
  emptyButton: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  emptyButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface,
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.base,
    color: BankingColors.error,
    marginBottom: Spacing.lg,
    textAlign: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  modalContent: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: FontSize.xl,
  },
  modalButtons: { flexDirection: "row", gap: Spacing.md },
  modalButton: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: BankingColors.borderLight },
  confirmButton: { backgroundColor: BankingColors.primary },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  confirmButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface,
  },

  guideOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xxl,
  },
  guideContent: {
    backgroundColor: BankingColors.surface,
    borderRadius: 24,
    padding: Spacing.xxl,
    alignItems: "center",
    width: "100%",
    maxWidth: 320,
  },
  guideAnimWrapper: {
    width: 220,
    height: 56,
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: Spacing.xl,
    backgroundColor: "#F1F5F9",
  },
  guideDeleteZone: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    width: 50,
    backgroundColor: "#E53935",
    justifyContent: "center",
    alignItems: "center",
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  guideMockCard: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  guideMockAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  guideMockAvatarText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },
  guideMockLines: {
    flex: 1,
    gap: 6,
  },
  guideMockLine1: {
    width: "70%",
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E2E8F0",
  },
  guideMockLine2: {
    width: "45%",
    height: 6,
    borderRadius: 3,
    backgroundColor: "#F1F5F9",
  },
  guideTitle: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 8,
    textAlign: "center",
  },
  guideDesc: {
    fontSize: 14,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  guideButton: {
    backgroundColor: BankingColors.primary,
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 999,
  },
  guideButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#fff",
  },
});
