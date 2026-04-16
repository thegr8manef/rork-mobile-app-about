import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  StyleSheet } from "react-native";
import { X, Search, Building2, AlertTriangle } from "lucide-react-native";
import { BankingColors, FontSize, FontFamily } from "@/constants";
import { SelectableAccount } from "@/types/selectable-account";
import TText from "@/components/TText";

type Props = {
  visible: boolean;
  accounts: SelectableAccount[];
  selectedAccountId?: string;
  onSelect: (accountId: string) => void;
  onClose: () => void;
  title?: string;
  unavailable?: boolean;
};

export default function AccountSelectorModal({
  visible,
  accounts,
  selectedAccountId,
  onSelect,
  onClose,
  title = "Sélectionner un compte",
  unavailable }: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.dragIndicator} />
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
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
            />
          </View>

          {unavailable && (
            <View style={styles.unavailableContainer}>
              <View style={styles.unavailableIconWrap}>
                <AlertTriangle size={28} color="#F59E0B" />
              </View>
              <TText tKey="common.serviceUnavailableTitle" style={styles.unavailableTitle} />
              <TText tKey="common.serviceUnavailableDesc" style={styles.unavailableSubtitle} />
            </View>
          )}

          <FlatList
            data={unavailable ? [] : accounts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const isSelected = item.id === selectedAccountId;
              return (
                <TouchableOpacity
                  style={[
                    styles.accountItem,
                    isSelected && styles.accountItemSelected,
                  ]}
                  onPress={() => {
                    onSelect(item.id);
                    setSearchQuery("");
                  }}
                >
                  <Building2 size={24} color={BankingColors.primary} />
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountName}>
                      {item.accountTitle || "N/A"}
                    </Text>
                    <Text style={styles.accountDetails}>
                      {item.ribFormatAccount || "N/A"}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: BankingColors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: "55%",
    maxHeight: "85%",
    paddingBottom: 24 },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  modalTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold },
  searchContainer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    margin: 16,
    backgroundColor: BankingColors.background,
    borderRadius: 12 },
  searchInput: {
    flex: 1,
    fontSize: FontSize.md },
  accountItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: BankingColors.background,
    gap: 12 },
  accountItemSelected: {
    borderWidth: 2,
    borderColor: BankingColors.primary },
  accountInfo: { flex: 1 },
  accountName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold },
  accountDetails: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  unavailableContainer: {
    alignItems: "center",
    paddingVertical: 40,
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
    lineHeight: 20 },
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: BankingColors.border,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4 } });
