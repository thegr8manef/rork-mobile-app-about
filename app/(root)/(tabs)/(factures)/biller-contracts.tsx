// app/(root)/(tabs)/(factures)/biller-contracts.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
} from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { Plus, FileText } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { useQueryClient } from "@tanstack/react-query";

import { useHaptic } from "@/utils/useHaptic";
import TText from "@/components/TText";
import ContractCard from "@/components/ContractCard";
import EmptyState from "@/components/factures/EmptyState";
import { BlockingPopup } from "@/components/BlockingPopup";
import { AddMoreButton } from "@/components/AddMoreButton";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import { BorderRadius, IconSize } from "@/constants/sizes";

import { SavedContract } from "@/types/contract.types";
import {
  useFetchAllBillers,
  useGetAllContracts,
  useDeleteContractBillersPayment,
  useToggleFavoriteBillersPayment, // ✅ NEW HOOK
} from "@/hooks/use-billers";
/**
 * ✅ BUSINESS KEY (stable)
 * If backend creates a new id each time, dedupe by:
 * billerId + search criteria values
 */
const contractBusinessKey = (c: SavedContract) => {
  const values =
    c.searchCriterias
      ?.map((x) => String(x?.searchCriteriaValue ?? "").trim())
      .filter(Boolean)
      .join("|") ?? "";
  return `${String(c.billerId)}|${values}`;
};

const dedupeContractsByBusinessKey = (items: SavedContract[]) => {
  const map = new Map<string, SavedContract>();
  for (const c of items) map.set(contractBusinessKey(c), c);
  return Array.from(map.values());
};

export default function BillerContractsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const qc = useQueryClient();

  const { billerId } = useLocalSearchParams<{ billerId: string }>();
  const { triggerLightHaptic, triggerSelectionHaptic } = useHaptic();

  const { data: billersResponse } = useFetchAllBillers();

  // ✅ keep full query object so we can refetch
  const contractsQuery = useGetAllContracts(false);
  const getSavedContracts = contractsQuery.data;

  // mutations
  const toggleFavoriteMutation = useToggleFavoriteBillersPayment(); // ✅ expects contractId: string
  const deleteContractMutation = useDeleteContractBillersPayment(); // expects { contractId }

  useFocusEffect(
    React.useCallback(() => {
      contractsQuery.refetch();
    }, [contractsQuery]),
  );

  const billersMemo = useMemo(() => billersResponse || [], [billersResponse]);

  const contractsMemoRaw = useMemo(
    () => (getSavedContracts || []) as SavedContract[],
    [getSavedContracts],
  );

  const contractsMemo = useMemo(
    () => dedupeContractsByBusinessKey(contractsMemoRaw),
    [contractsMemoRaw],
  );

  const [localContracts, setLocalContracts] = useState<SavedContract[]>([]);
  useEffect(() => {
    setLocalContracts(contractsMemo);
  }, [contractsMemo]);

  const biller = useMemo(() => {
    return billersMemo.find((b) => String(b.id) === String(billerId));
  }, [billersMemo, billerId]);

  const contracts = useMemo(() => {
    return localContracts.filter(
      (c) => String(c.billerId) === String(billerId),
    );
  }, [localContracts, billerId]);

  const getPendingBillsCount = (_contractId: string) => 0;

  const setFavoriteLocally = useCallback((id: string, value: boolean) => {
    setLocalContracts((prev) =>
      prev.map((c) =>
        String(c.id) === String(id) ? { ...c, isFavorite: value } : c,
      ),
    );
  }, []);

  // ⭐ toggle favorite using NEW API: PUT /favorites/{contractId}
  const toggleFavorite = useCallback(
    async (contract: SavedContract) => {
      const contractId = String(contract.id);
      const previousIsFavorite = !!contract.isFavorite;
      const nextIsFavorite = !previousIsFavorite;

      setFavoriteLocally(contract.id, nextIsFavorite);

      try {
        const bills = await toggleFavoriteMutation.mutateAsync({
          contractId,
          isFavorite: nextIsFavorite,
        });

        await qc.invalidateQueries({
          queryKey: ["contracts"],
          refetchType: "all",
        });

        await contractsQuery.refetch();

        return bills;
      } catch (e: any) {
        setFavoriteLocally(contract.id, previousIsFavorite);

        const msg = String(e?.message ?? "");
        if (msg.includes("NO_BILLS_FOUND")) {
          console.warn(
            "[biller-contracts] NO_BILLS_FOUND for contract",
            contractId,
          );
        } else {
          console.error("[biller-contracts] toggle favorite failed:", e);
        }
      }
    },
    [toggleFavoriteMutation, qc, setFavoriteLocally, contractsQuery],
  );

  const handleFavoriteToggle = useCallback(
    (contract: SavedContract) => {
      triggerSelectionHaptic();
      toggleFavorite(contract);
    },
    [toggleFavorite, triggerSelectionHaptic],
  );

  const handleContractPress = (contractId: string) => {
    triggerLightHaptic();
    router.navigate({ pathname: "/contract-bills", params: { contractId } });
  };

  const handleAddContract = () => {
    triggerLightHaptic();
    router.navigate({ pathname: "/add-biller-contract", params: { billerId } });
  };

  // -------------------------
  // ✅ BlockingPopup delete flow
  // -------------------------
  const [deletePopupVisible, setDeletePopupVisible] = useState(false);
  const [selectedContract, setSelectedContract] =
    useState<SavedContract | null>(null);

  const openDeletePopup = useCallback(
    (contract: SavedContract) => {
      triggerSelectionHaptic();
      setSelectedContract(contract);
      setDeletePopupVisible(true);
    },
    [triggerSelectionHaptic],
  );

  const closeDeletePopup = useCallback(() => {
    if (deleteContractMutation.isPending) return;
    setDeletePopupVisible(false);
    setSelectedContract(null);
  }, [deleteContractMutation.isPending]);

  const confirmDeleteContract = useCallback(() => {
    if (!selectedContract) return;

    const contractId = String(selectedContract.id);
    const businessKeyToRemove = contractBusinessKey(selectedContract);
    const snapshot = [...localContracts];

    console.log("[biller-contracts] confirm delete", {
      contractId,
      businessKeyToRemove,
    });

    // Remove ALL visually identical duplicates
    setLocalContracts((prev) =>
      prev.filter((c) => contractBusinessKey(c) !== businessKeyToRemove),
    );

    deleteContractMutation.mutate(
      { contractId },
      {
        onSuccess: async () => {
          console.log("[biller-contracts] delete success for", contractId);

          await qc.invalidateQueries({
            queryKey: ["contracts"],
            refetchType: "all",
          });

          await contractsQuery.refetch();

          setDeletePopupVisible(false);
          setSelectedContract(null);
        },
        onError: (err) => {
          setLocalContracts(dedupeContractsByBusinessKey(snapshot));
          console.error("[biller-contracts] delete contract failed:", err);
        },
      },
    );
  }, [
    selectedContract,
    localContracts,
    deleteContractMutation,
    qc,
    contractsQuery,
  ]);

  const disableActions =
    deleteContractMutation.isPending || toggleFavoriteMutation.isPending;
  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      "Energie et Eau": "billers.category.waterElectricity",
      "Internet et Téléphonie": "billers.category.telephonyInternet",
      Transport: "billers.category.transport",
    };
    return labels[category];
  };

  if (!biller) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: "bills.myContracts",
            headerStyle: { backgroundColor: BankingColors.primary },
            headerTintColor: "#FFFFFF",
          }}
        />
        <EmptyState titleKey="bills.billerNotFound" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: biller.billerLabel,
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
        }}
      />

      <BlockingPopup
        visible={deletePopupVisible}
        title={t("common.confirmation") || "Confirmation"}
        message={
          t("bills.deleteContractConfirm") ||
          "Voulez-vous supprimer ce contrat ?"
        }
        actions={[
          {
            label: t("common.cancel") || "Annuler",
            variant: "secondary",
            onPress: closeDeletePopup,
            disabled: deleteContractMutation.isPending,
          },
          {
            label: t("common.delete") || "Supprimer",
            variant: "danger",
            onPress: confirmDeleteContract,
            loading: deleteContractMutation.isPending,
          },
        ]}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        onRequestClose={closeDeletePopup}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Biller header */}
        <View style={styles.billerInfo}>
          <Image
            source={{ uri: biller.billerIcon }}
            style={styles.billerIcon}
          />
          <View style={styles.billerDetails}>
            <Text style={styles.billerName}>{biller.billerLabel}</Text>
            <Text style={styles.billerCategory}>
              {t(getCategoryLabel(biller.billerCategory.categoryLabel))}
            </Text>
          </View>
        </View>

        {/* Contracts */}
        <View style={styles.contractsList}>
          {contracts.length === 0 ? (
            <EmptyState
              titleKey="bills.noContractRegistered"
              descriptionKey="bills.addContractPrompt"
              icon={FileText}
              iconColor={BankingColors.primary}
            >
              <TouchableOpacity
                style={styles.addButton}
                onPress={handleAddContract}
              >
                <Plus size={20} color="#FFFFFF" />
                <TText tKey="bills.addContract" style={styles.addButtonText} />
              </TouchableOpacity>
            </EmptyState>
          ) : (
            <>
              <AddMoreButton
                onPress={handleAddContract}
                tKey="bills.addAnotherContract"
              />

              {contracts.map((contract, index) => (
                <ContractCard
                  key={contractBusinessKey(contract)}
                  contract={contract}
                  billerName={biller.billerLabel}
                  pendingBillsCount={getPendingBillsCount(contract.id)}
                  onPress={() => handleContractPress(contract.id)}
                  onToggleFavorite={() => handleFavoriteToggle(contract)}
                  onDelete={() => openDeletePopup(contract)}
                  disableActions={disableActions}
                  logo={biller.billerIcon}
                />
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1 },
  contractsList: { padding: Spacing.lg, paddingTop: Spacing.md },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.sm,
    ...Shadow.button,
  },
  addButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },

  billerInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  billerIcon: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.lg,
    backgroundColor: BankingColors.background,
  },
  billerDetails: { marginLeft: Spacing.lg, flex: 1 },
  billerName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  billerCategory: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
});
