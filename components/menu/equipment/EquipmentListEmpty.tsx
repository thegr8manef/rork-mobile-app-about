import React from "react";
import { View, StyleSheet } from "react-native";
import { Package } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors, FontSize, Spacing } from "@/constants";

export default function EquipmentListEmpty() {
  return (
    <View style={styles.container}>
      <Package size={48} color={BankingColors.textLight} />
      <TText style={styles.text} tKey="equipments.noEquipments" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: Spacing.xxxl },
  text: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: BankingColors.textLight } });
