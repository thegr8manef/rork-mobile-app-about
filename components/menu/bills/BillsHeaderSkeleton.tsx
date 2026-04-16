// =========================
// LoansHeaderSkeleton.tsx
// ✅ Same style/animation as BillsHeaderSkeleton
// ✅ Fits "Crédit" screen (orange header + back icon + title)
// =========================
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { BankingColors, BorderRadius, Shadow, Spacing } from "@/constants";

type Props = {
  insetsTop: number;
};

const HEADER_HEIGHT = 150;

export default function LoansHeaderSkeleton({ insetsTop }: Props) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 800,
          useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={[styles.header, { paddingTop: insetsTop }]}>
      <View style={styles.headerInner}>
        <View style={styles.row}>
          <Animated.View style={[styles.iconSkel, { opacity }]} />
          <Animated.View style={[styles.titleSkel, { opacity }]} />
          <Animated.View style={[styles.iconSkel, { opacity }]} />
        </View>
        <Animated.View style={[styles.subTitleSkel, { opacity }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: HEADER_HEIGHT,
    backgroundColor: BankingColors.primary, // keep your orange primary
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    justifyContent: "flex-end" },
  headerInner: {
    width: "100%",
    alignSelf: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md },
  iconSkel: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.25)" },
  titleSkel: {
    flex: 1,
    height: 18,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginHorizontal: Spacing.md },
  subTitleSkel: {
    marginTop: Spacing.md,
    width: "45%",
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(255,255,255,0.18)" } });