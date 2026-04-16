import React from "react";
import { View, StyleSheet } from "react-native";
import { BankingColors } from "@/constants/banking-colors";
import TText from "@/components/TText";
import { FontFamily } from "@/constants";

export default function TransferGroupHeader({ title }: { title: string }) {
  return (
    <View style={styles.dateHeader}>
      <TText style={styles.dateHeaderText}>{title}</TText>
    </View>
  );
}

const styles = StyleSheet.create({
  dateHeader: {
    backgroundColor: "#E5E7EB",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10 },
  dateHeaderText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text } });
