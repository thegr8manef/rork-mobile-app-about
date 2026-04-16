import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";
import { X } from "lucide-react-native";
import { BankingColors } from "@/constants";

type Account = {
  id: string;
  accountTitle: string;
  accountNumber: string;
  availableBalance: string;
  currencyAccount: { alphaCode: string };
};

type Props = {
  sheetRef: React.RefObject<BottomSheetModal | null>;
  styles: any;

  title?: string;

  accounts: Account[];
  selectedAccountId?: string;

  onSelect: (id: string) => void;

  maskAccountNumber: (v: string) => string;
  formatBalance: (balance: string, currency: string) => string;
};

export default function TransactionsAccountSheet({
  sheetRef,
  styles,
  title = "Sélectionner un compte",
  accounts,
  selectedAccountId,
  onSelect,
  maskAccountNumber,
  formatBalance }: Props) {
const snapPoints = useMemo(() => ["75%", "95%"], []);

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enablePanDownToClose
      backgroundStyle={{ backgroundColor: BankingColors.white }}
      handleIndicatorStyle={{ backgroundColor: BankingColors.border }}
      keyboardBehavior="extend"
      keyboardBlurBehavior="restore"
    >
      <BottomSheetView style={{ flex: 1 }}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={() => sheetRef.current?.dismiss()}>
            <X size={24} color={BankingColors.text} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={accounts}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item }) => {
            const selected = item.id === selectedAccountId;

            return (
              <TouchableOpacity
                onPress={() => {
                  onSelect(item.id);
                  sheetRef.current?.dismiss();
                }}
                activeOpacity={0.85}
                style={[styles.accountRow, selected && styles.accountRowActive]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.accountRowTitle} numberOfLines={1}>
                    {item.accountTitle}
                  </Text>

                  <Text
                    style={styles.accountRowNumber}
                    numberOfLines={1}
                    ellipsizeMode="middle"
                  >
                    {maskAccountNumber(item.accountNumber)}
                  </Text>
                </View>

                <Text style={styles.accountRowBalance} numberOfLines={1}>
                  {formatBalance(
                    item.availableBalance,
                    item.currencyAccount.alphaCode
                  )}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </BottomSheetView>
    </BottomSheetModal>
  );
}
