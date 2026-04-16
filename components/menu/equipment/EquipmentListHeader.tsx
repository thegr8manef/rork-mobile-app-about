import React from "react";
import { View, StyleSheet } from "react-native";
import TText from "@/components/TText";
import { FontSize, BankingColors, Spacing, FontFamily } from "@/constants";

interface Props {
  count: number;
}

export default function EquipmentListHeader({ count }: Props) {
  return (
    <View style={styles.header}>
      <TText style={styles.title}>
        <TText tKey="equipments.title" /> ({count})
      </TText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text } });
