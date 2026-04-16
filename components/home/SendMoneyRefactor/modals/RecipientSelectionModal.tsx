import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet } from "react-native";
import { X, User, Building2, Search, Plus } from "lucide-react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetView } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";

import { BankingColors, FontSize, Spacing, FontFamily } from "@/constants";
import type { Account, Beneficiary } from "@/types/account.type";
import { formatBalance } from "@/utils/account-formatters";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

type RecipientTab = "beneficiaries" | "accounts";

type Props = {
  visible: boolean;
  recipientTab: RecipientTab;
  onChangeTab: (t: RecipientTab) => void;
  searchQuery: string;
  onChangeSearch: (q: string) => void;
  filteredBeneficiaries: Beneficiary[];
  filteredAccounts: Account[];
  onSelectBeneficiary: (b: Beneficiary) => void;
  onSelectAccount: (a: Account) => void;
  onAddBeneficiary: () => void;
  onClose: () => void;
};

type ListItem =
  | { type: "beneficiary"; data: Beneficiary }
  | { type: "account"; data: Account }
  | { type: "addButton" }
  | { type: "empty" };

const getAccountRib = (a: Account | null | undefined) => {
  if (!a) return "";
  return (
    (a as any).ribFormatAccount ?? (a as any).rib ?? (a as any).accountRib ?? ""
  );
};

export default function RecipientSelectionModal({
  visible,
  recipientTab,
  onChangeTab,
  searchQuery,
  onChangeSearch,
  filteredBeneficiaries,
  filteredAccounts,
  onSelectBeneficiary,
  onSelectAccount,
  onAddBeneficiary,
  onClose }: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);

  const snapPoints = useMemo(() => ["90%"], []);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    [],
  );

  const listData = useMemo((): ListItem[] => {
    if (recipientTab === "beneficiaries") {
      if (!filteredBeneficiaries.length) {
        return [{ type: "empty" }, { type: "addButton" }];
      }
      return [
        ...filteredBeneficiaries.map((b) => ({
          type: "beneficiary" as const,
          data: b })),
        { type: "addButton" as const },
      ];
    }

    // accounts
    if (!filteredAccounts.length) {
      return [{ type: "empty" }];
    }
    return filteredAccounts.map((a) => ({
      type: "account" as const,
      data: a }));
  }, [recipientTab, filteredBeneficiaries, filteredAccounts]);

  const keyExtractor = useCallback((item: ListItem, index: number) => {
    if (item.type === "beneficiary") return `b-${item.data.id}`;
    if (item.type === "account") return `a-${item.data.id}`;
    if (item.type === "addButton") return "addButton";
    return `empty-${index}`;
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: ListItem }) => {
      if (item.type === "beneficiary") {
        return (
          <TouchableOpacity
            style={styles.recipientItem}
            onPress={() => onSelectBeneficiary(item.data)}
            activeOpacity={0.85}
          >
            <View style={styles.recipientAvatar}>
              <User size={24} color={BankingColors.primary} />
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName} numberOfLines={1}>
                {item.data.fullName}
              </Text>
              <Text style={styles.recipientDetails} numberOfLines={1}>
                {item.data.rib}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }

      if (item.type === "account") {
        const rib = getAccountRib(item.data);
        const currency = item.data.currencyAccount?.alphaCode ?? "";
        return (
          <TouchableOpacity
            style={styles.recipientItem}
            onPress={() => onSelectAccount(item.data)}
            activeOpacity={0.85}
          >
            <View style={styles.recipientAvatar}>
              <Building2 size={24} color={BankingColors.primary} />
            </View>
            <View style={styles.recipientInfo}>
              <Text style={styles.recipientName} numberOfLines={1}>
                {item.data.accountLabel}
              </Text>

              <Text style={styles.recipientDetails} numberOfLines={1}>
                {formatBalance(item.data.availableBalance ?? "0", currency || "TND")}
                {rib ? ` • ${rib}` : ""}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }

      if (item.type === "addButton") {
        return (
          <TouchableOpacity
            style={styles.addButton}
            onPress={onAddBeneficiary}
            activeOpacity={0.85}
          >
            <Plus size={20} color={BankingColors.primary} />
            <Text style={styles.addButtonText}>
              {t("beneficiary.add", "Ajouter un bénéficiaire")}
            </Text>
          </TouchableOpacity>
        );
      }

      // empty
      const isBenef = recipientTab === "beneficiaries";
      const emptyText = searchQuery
        ? isBenef
          ? t("beneficiary.emptySearch", "Aucun bénéficiaire trouvé")
          : t("account.emptySearch", "Aucun compte trouvé")
        : isBenef
          ? t("beneficiary.empty", "Aucun bénéficiaire")
          : t("account.empty", "Aucun compte disponible");

      return (
        <View style={styles.emptyState}>
          {isBenef ? (
            <User size={48} color={BankingColors.textLight} />
          ) : (
            <Building2 size={48} color={BankingColors.textLight} />
          )}
          <Text style={styles.emptyText}>{emptyText}</Text>
        </View>
      );
    },
    [
      onSelectBeneficiary,
      onSelectAccount,
      onAddBeneficiary,
      recipientTab,
      searchQuery,
      t,
    ],
  );

return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={handleClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      {/* Header - OUTSIDE list */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle} numberOfLines={1}>
          {t(
            "sendMoney.selectRecipientTitle",
            "Sélectionner un destinataire",
          )}
        </Text>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <X size={24} color={BankingColors.text} />
        </TouchableOpacity>
      </View>

      {/* Tabs - OUTSIDE list */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            recipientTab === "beneficiaries" && styles.tabActive,
          ]}
          onPress={() => onChangeTab("beneficiaries")}
          activeOpacity={0.85}
        >
          <User
            size={20}
            color={
              recipientTab === "beneficiaries"
                ? BankingColors.primary
                : BankingColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              recipientTab === "beneficiaries" && styles.tabTextActive,
            ]}
          >
            {t("sendMoney.tabs.beneficiaries", "Mes bénéficiaires")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tab,
            recipientTab === "accounts" && styles.tabActive,
          ]}
          onPress={() => onChangeTab("accounts")}
          activeOpacity={0.85}
        >
          <Building2
            size={20}
            color={
              recipientTab === "accounts"
                ? BankingColors.primary
                : BankingColors.textSecondary
            }
          />
          <Text
            style={[
              styles.tabText,
              recipientTab === "accounts" && styles.tabTextActive,
            ]}
          >
            {t("sendMoney.tabs.accounts", "Mes comptes")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search - OUTSIDE list */}
      <View style={styles.searchContainer}>
        <Search size={20} color={BankingColors.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder={
            recipientTab === "beneficiaries"
              ? t(
                  "sendMoney.searchBeneficiary",
                  "Rechercher un bénéficiaire...",
                )
              : t("sendMoney.searchAccount", "Rechercher un compte...")
          }
          value={searchQuery}
          onChangeText={onChangeSearch}
          placeholderTextColor={BankingColors.textLight}
          contextMenuHidden
        />
      </View>

      {/* ✅ LIST - Now properly scrollable */}
      <BottomSheetFlatList
        data={listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
      />
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
sheetBackground: {
    backgroundColor: BankingColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24 },
  handleIndicator: {
    backgroundColor: BankingColors.border },
 listContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  modalTitle: {
    flex: 1,
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  closeButton: {
    padding: 4,
    marginLeft: 12 },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: BankingColors.background,
    gap: 8 },
  tabActive: {
    backgroundColor: BankingColors.primary + "20" },
  tabText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  tabTextActive: {
    color: BankingColors.primary },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    gap: 12 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.text },

  recipientInfo: {
    flex: 1,
    minWidth: 0 },
  recipientItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: BankingColors.background,
    borderRadius: 10,
    marginBottom: 8,
    gap: 10 },

  recipientAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: BankingColors.primary + "14",
    justifyContent: "center",
    alignItems: "center" },

  recipientName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2 },

  recipientDetails: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary },

  emptyState: {
    alignItems: "center",
    paddingVertical: 28 },

  emptyText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: 8 },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: BankingColors.primary + "0D",
    borderRadius: 10,
    marginTop: 6,
    gap: 8,
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
    borderStyle: "dashed" },

  addButtonText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary } });