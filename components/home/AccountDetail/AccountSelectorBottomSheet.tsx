import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { X, Search, Building2, AlertTriangle } from "lucide-react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal } from "@gorhom/bottom-sheet";

import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import type { SelectableAccount } from "@/types/selectable-account";
import { formatBalance } from "@/utils/account-formatters";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

type Props = {
  visible: boolean;
  accounts: SelectableAccount[];
  selectedAccountId?: string;
  onSelect: (accountId: string) => void;
  onClose: () => void;
  title?: string;
  unavailable?: boolean;
};

export default function AccountSelectorBottomSheet({
  visible,
  accounts,
  selectedAccountId,
  onSelect,
  onClose,
  title = "Sélectionner un compte",
  unavailable }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const snapPoints = useMemo(() => ["60%", "80%"], []);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  // ✅ single source of truth: onDismiss => reset + parent close
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

    return accounts.filter((acc) => {
      const title = (acc.accountTitle ?? "").toLowerCase();
      const rib = (acc.ribFormatAccount ?? "").toLowerCase();
      const num = (acc.accountNumber ?? "").toLowerCase();
      return title.includes(q) || rib.includes(q) || num.includes(q);
    });
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

  const keyExtractor = useCallback((item: SelectableAccount) => item.id, []);

  const handleSelect = useCallback(
    (id: string) => {
      // ✅ select first
      onSelect(id);

      // ✅ close immediately (no onClose here!)
      dismissSheet();
    },
    [onSelect, dismissSheet]
  );

  const renderItem = useCallback(
    ({ item }: { item: SelectableAccount }) => {
      const isSelected = item.id === selectedAccountId;
      const rib = item.ribFormatAccount || item.ibanFormatAccount || "";

      return (
        <TouchableOpacity
          style={[styles.accountItem, isSelected && styles.accountItemSelected]}
          onPress={() => handleSelect(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.accountAvatar}>
            <Building2 size={24} color={BankingColors.primary} />
          </View>

          <View style={styles.accountInfo}>
            <Text style={styles.accountName} numberOfLines={1}>
              {item.accountTitle}
            </Text>
            <Text style={styles.accountDetails} numberOfLines={1} ellipsizeMode="middle">
              {formatBalance(item.availableBalance, item.currencyAlphaCode ?? "TND")} • {rib || item.accountNumber}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedAccountId, handleSelect]
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
      <View
        style={[
          styles.sheetContainer,
          isLarge && contentMaxWidth
            ? { alignSelf: "center", width: "100%", maxWidth: contentMaxWidth }
            : null,
        ]}
      >
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle} numberOfLines={1}>
            {title}
          </Text>
          <TouchableOpacity onPress={dismissSheet} style={styles.closeButton}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un compte..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
            contextMenuHidden
          />
        </View>

        {unavailable ? (
          <View style={styles.unavailableContainer}>
            <View style={styles.unavailableIconWrap}>
              <AlertTriangle size={28} color="#F59E0B" />
            </View>
            <TText tKey="common.serviceUnavailableTitle" style={styles.unavailableTitle} />
            <TText tKey="common.serviceUnavailableDesc" style={styles.unavailableSubtitle} />
          </View>
        ) : (
          <BottomSheetFlatList<SelectableAccount>
            data={filteredAccounts}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
          />
        )}
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
  accountName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  accountDetails: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  unavailableContainer: {
    alignItems: "center",
    paddingVertical: 48,
    paddingHorizontal: 32 },
  unavailableIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#FFF4E6",
    borderWidth: 1,
    borderColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14 },
  unavailableTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: "#92400E",
    textAlign: "center",
    marginBottom: 8 },
  unavailableSubtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20 } });
