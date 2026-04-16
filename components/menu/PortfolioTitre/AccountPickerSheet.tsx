import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { X, Search, Briefcase, Check } from "lucide-react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal } from "@gorhom/bottom-sheet";
import { useTranslation } from "react-i18next";
import { BankingColors,
  FontSize,
  FontFamily } from "@/constants";

type Props = {
  visible: boolean;
  accounts: string[];
  selected: string | null;
  onSelect: (v: string) => void;
  onClose: () => void;
};

export default function AccountPickerSheet({
  visible,
  accounts,
  selected,
  onSelect,
  onClose }: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const snapPoints = useMemo(() => ["50%", "70%"], []);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleDismiss = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  const dismissSheet = useCallback(() => {
    sheetRef.current?.dismiss();
  }, []);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter((acc) => acc.toLowerCase().includes(q));
  }, [accounts, searchQuery]);

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
    []
  );

  const handleSelect = useCallback(
    (accountNumber: string) => {
      onSelect(accountNumber);
      dismissSheet();
    },
    [onSelect, dismissSheet]
  );

  const renderItem = useCallback(
    ({ item }: { item: string; index: number }) => {
      const isSelected = item === selected;

      return (
        <TouchableOpacity
          style={[styles.accountItem, isSelected && styles.accountItemSelected]}
          onPress={() => handleSelect(item)}
          activeOpacity={0.85}
        >
          <View style={styles.accountAvatar}>
            <Briefcase size={22} color={BankingColors.primary} />
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>
              {t("portfolio.securitiesAccount")}
            </Text>
            <Text style={[styles.accountNumber, isSelected && styles.accountNumberSelected]}>
              {item}
            </Text>
          </View>

          {isSelected && (
            <View style={styles.checkCircle}>
              <Check size={16} color={BankingColors.white} />
            </View>
          )}
        </TouchableOpacity>
      );
    },
    [selected, handleSelect, t]
  );

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      index={1}
      enableDynamicSizing={false}
      onDismiss={handleDismiss}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.sheetContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {t("portfolio.securitiesAccount")}
          </Text>
          <TouchableOpacity onPress={dismissSheet} style={styles.closeButton}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder={t("portfolio.search") || "Rechercher..."}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
            contextMenuHidden
          />
        </View>

        <BottomSheetFlatList<string>
          data={filteredAccounts}
          keyExtractor={(item: string) => item}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      </View>
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
  sheetContainer: {
    flex: 1,
    paddingBottom: 24 },
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    gap: 12 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.text },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40 },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12 },
  accountItemSelected: {
    backgroundColor: BankingColors.primary + "20",
    borderWidth: 2,
    borderColor: BankingColors.primary },
  accountAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  accountInfo: {
    flex: 1 },
  accountLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: 2 },
  accountNumber: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  accountNumberSelected: {
    color: BankingColors.primary },
  checkCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center" } });
