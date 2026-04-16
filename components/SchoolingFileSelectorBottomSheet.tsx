import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet } from "react-native";
import { X, Search, FolderOpen } from "lucide-react-native";
import { getCurrencyByNumeric } from "@/utils/currency-helper";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal } from "@gorhom/bottom-sheet";

import { BankingColors, FontFamily } from "@/constants";
import { Spacing } from "@/constants";
import { FontSize } from "@/constants";
import { formatBalance } from "@/utils/account-formatters";
import { SchoolingFileData } from "@/services/schooling.api";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

type Props = {
  visible: boolean;
  files: SchoolingFileData[];
  selectedFileId?: string;
  onSelect: (fileId: string) => void;
  onClose: () => void;
  title?: string;
};

export default function SchoolingFileSelectorBottomSheet({
  visible,
  files,
  selectedFileId,
  onSelect,
  onClose,
  title = "Sélectionner un dossier" }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const snapPoints = useMemo(() => ["80%"], []);

  useEffect(() => {
    if (visible) sheetRef.current?.present();
    else sheetRef.current?.dismiss();
  }, [visible]);

  const handleClose = useCallback(() => {
    setSearchQuery("");
    onClose();
  }, [onClose]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;

    return files.filter((file) => {
      const studentName = file.studentName.toLowerCase();
      const fileRef = file.fileRef;
      return studentName.includes(q) || fileRef.includes(q);
    });
  }, [files, searchQuery]);

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

  const keyExtractor = useCallback((item: SchoolingFileData) => item.id, []);

  const renderItem = useCallback(
    ({ item }: { item: SchoolingFileData }) => {
      const isSelected = item.id === selectedFileId;

      return (
        <TouchableOpacity
          style={[styles.fileItem, isSelected && styles.fileItemSelected]}
          onPress={() => {
            onSelect(item.id);
            setSearchQuery("");
          }}
          activeOpacity={0.85}
        >
          <View style={styles.fileAvatar}>
            <FolderOpen size={24} color="#D97842" />
          </View>

          <View style={styles.fileInfo}>
            <Text style={styles.fileName} numberOfLines={1}>
              {item.studentName}
            </Text>
            <Text style={styles.fileRef} numberOfLines={1}>
              Réf n°{item.fileRef} • {item.fileYear}
            </Text>
            <Text style={styles.fileDetails} numberOfLines={1}>
              {formatBalance(item.fileAmountLimit, "TND")}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [onSelect, selectedFileId]
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
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un dossier..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
          />
        </View>

        <BottomSheetFlatList<SchoolingFileData>
          data={filteredFiles}
          keyExtractor={keyExtractor}
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
  fileItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12 },
  fileItemSelected: {
    backgroundColor: "#D97842" + "20",
    borderWidth: 2,
    borderColor: "#D97842" },
  fileAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D97842" + "20",
    justifyContent: "center",
    alignItems: "center" },
  fileInfo: {
    flex: 1 },
  fileName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  fileRef: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: 2 },
  fileDetails: {
    fontSize: FontSize.base,
    color: "#D97842",
    fontFamily: FontFamily.medium } });
