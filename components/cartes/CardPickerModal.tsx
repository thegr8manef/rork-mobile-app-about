import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { CreditCard, Search, X } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal } from "@gorhom/bottom-sheet";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

interface CardItem {
  id: string;
  product: { description: string };
  pcipan: string;
  namePrinted: string;
}

interface Props {
  visible: boolean;
  cards: CardItem[];
  selectedCardId: string;
  onClose: () => void;
  onSelect: (cardId: string) => void;
}

export default function CardPickerModal({
  visible,
  cards,
  selectedCardId,
  onClose,
  onSelect }: Props) {
  const sheetRef = useRef<BottomSheetModal>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const snapPoints = useMemo(() => ["60%", "80%"], []);

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

  const filteredCards = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return cards;
    return cards.filter((card) => {
      const desc = (card.product?.description ?? "").toLowerCase();
      const pan = (card.pcipan ?? "").toLowerCase();
      const name = (card.namePrinted ?? "").toLowerCase();
      return desc.includes(q) || pan.includes(q) || name.includes(q);
    });
  }, [cards, searchQuery]);

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

  const keyExtractor = useCallback((item: CardItem) => item.id, []);

  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
      dismissSheet();
    },
    [onSelect, dismissSheet]
  );

  const renderItem = useCallback(
    ({ item }: { item: CardItem }) => {
      const isSelected = item.id === selectedCardId;

      return (
        <TouchableOpacity
          style={[styles.cardItem, isSelected && styles.cardItemSelected]}
          onPress={() => handleSelect(item.id)}
          activeOpacity={0.85}
        >
          <View style={styles.cardAvatar}>
            <CreditCard size={24} color={BankingColors.primary} />
          </View>

          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {item.product.description}
            </Text>
            <Text style={styles.cardDetails} numberOfLines={1} ellipsizeMode="middle">
              {item.pcipan} • {item.namePrinted}
            </Text>
          </View>
        </TouchableOpacity>
      );
    },
    [selectedCardId, handleSelect]
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
            ? { alignSelf: "center" as const, width: "100%", maxWidth: contentMaxWidth }
            : null,
        ]}
      >
        <View style={styles.modalHeader}>
          <TText tKey="cards.selectCard" style={styles.modalTitle} />
          <TouchableOpacity onPress={dismissSheet} style={styles.closeButton}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Search size={20} color={BankingColors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher une carte..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={BankingColors.textLight}
            contextMenuHidden
          />
        </View>

        <BottomSheetFlatList<CardItem>
          data={filteredCards}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <CreditCard size={48} color={BankingColors.textLight} />
              <TText tKey="cards.noCardFound" style={styles.emptyText} />
            </View>
          }
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
  cardItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: BankingColors.background,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12 },
  cardItemSelected: {
    backgroundColor: BankingColors.primary + "20",
    borderWidth: 2,
    borderColor: BankingColors.primary },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  cardInfo: {
    flex: 1 },
  cardName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  cardDetails: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12 },
  emptyText: {
    fontSize: FontSize.md,
    color: BankingColors.textLight } });
