import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";

type Props = {
  compactTop?: boolean; // if you want less top blank space
};

export default function TransferReceiptPdfSkeleton({ compactTop }: Props) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const shimmerOpacity = useMemo(
    () =>
      anim.interpolate({
        inputRange: [0, 1],
        outputRange: [0.35, 0.75] }),
    [anim]
  );

  return (
    <View style={styles.wrap}>
      {/* "Page" */}
      <View style={styles.page}>
        {/* Header row: logo + date */}
        <View style={[styles.row, styles.topRow, compactTop && { marginTop: 0 }]}>
          <Animated.View style={[styles.block, styles.logo, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.date, { opacity: shimmerOpacity }]} />
        </View>

        {/* Big title band */}
        <Animated.View style={[styles.block, styles.bigBand, { opacity: shimmerOpacity }]} />

        {/* Reference line */}
        <View style={[styles.row, { marginTop: Spacing.lg }]}>
          <Animated.View style={[styles.block, styles.refLabel, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.refValue, { opacity: shimmerOpacity }]} />
        </View>

        {/* Two columns boxes */}
        <View style={[styles.row, styles.cols]}>
          <View style={styles.colBox}>
            <Animated.View style={[styles.block, styles.colTitle, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
          </View>

          <View style={styles.colBox}>
            <Animated.View style={[styles.block, styles.colTitle, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.block, styles.line, { opacity: shimmerOpacity }]} />
          </View>
        </View>

        {/* Bottom box */}
        <View style={styles.bottomBox}>
          <Animated.View style={[styles.block, styles.lineWide, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.lineWide, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.lineWide, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.lineWide, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.lineWide, { opacity: shimmerOpacity }]} />
        </View>

        {/* Footer small text */}
        <View style={styles.footer}>
          <Animated.View style={[styles.block, styles.footerLine, { opacity: shimmerOpacity }]} />
          <Animated.View style={[styles.block, styles.footerLine2, { opacity: shimmerOpacity }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: BankingColors.background,
    padding: Spacing.lg },
  page: {
    flex: 1,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadow.md },

  block: {
    backgroundColor: BankingColors.borderPale,
    borderRadius: BorderRadius.md },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between" },

  topRow: {
    marginTop: Spacing.md },
  logo: {
    width: 90,
    height: 42,
    borderRadius: BorderRadius.md },
  date: {
    width: 110,
    height: 14,
    borderRadius: BorderRadius.sm },

  bigBand: {
    marginTop: Spacing.lg,
    width: 190,
    height: 34,
    borderRadius: BorderRadius.md },

  refLabel: { width: 130, height: 12, borderRadius: BorderRadius.sm },
  refValue: { width: 170, height: 12, borderRadius: BorderRadius.sm },

  cols: { marginTop: Spacing.xl, gap: Spacing.lg },
  colBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: BankingColors.borderPale,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm },
  colTitle: { width: 110, height: 12, borderRadius: BorderRadius.sm, marginBottom: 6 },
  line: { width: "100%", height: 12, borderRadius: BorderRadius.sm },

  bottomBox: {
    marginTop: Spacing.xl,
    borderWidth: 1,
    borderColor: BankingColors.borderPale,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm },
  lineWide: { width: "100%", height: 12, borderRadius: BorderRadius.sm },

  footer: { marginTop: "auto", gap: 8, paddingTop: Spacing.xl },
  footerLine: { width: 220, height: 10, borderRadius: BorderRadius.sm },
  footerLine2: { width: 180, height: 10, borderRadius: BorderRadius.sm } });
