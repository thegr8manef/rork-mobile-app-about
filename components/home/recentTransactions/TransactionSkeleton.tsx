import React from "react";
import { StyleSheet, View, StyleSheet as RNStyleSheet } from "react-native";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  Shadow,
  AvatarSize } from "@/constants";

type Props = {
  count?: number;
  rowHeight: number;
};

const Separator = () => (
  <View
    style={{
      height: RNStyleSheet.hairlineWidth,
      backgroundColor: BankingColors.borderLight,
      marginLeft: Spacing.lg }}
  />
);

export default function TransactionSkeleton({ count = 3, rowHeight }: Props) {
  return (
    <View style={styles.wrap}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i}>
          <View style={[styles.row, { height: rowHeight }]}>
            <View style={styles.icon} />
            <View style={styles.body}>
              <View style={[styles.line, { width: "65%" }]} />
              <View style={[styles.line, { width: "40%", marginTop: Spacing.sm }]} />
            </View>
            <View style={styles.amount} />
          </View>

          {i < count - 1 ? <Separator /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginHorizontal: Spacing.lg,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.sm,
    overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg },
  icon: {
    width: AvatarSize.md,
    height: AvatarSize.md,
    borderRadius: AvatarSize.md / 2,
    backgroundColor: BankingColors.surfaceSecondary },
  body: {
    flex: 1 },
  line: {
    height: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary },
  amount: {
    width: AvatarSize.lg,
    height: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary } });
