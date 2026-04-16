import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

const { width } = Dimensions.get("window");
const FAVORITE_CARD_WIDTH = width - Spacing.lg * 3;

function usePulse() {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 850,
          useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return opacity;
}

function SkeletonItem() {
  const opacity = usePulse();

  return (
    <View style={styles.card}>
      {/* top-right trash */}
      <Animated.View style={[styles.trashSkeleton, { opacity }]} />

      {/* bottom-right star */}
      <Animated.View style={[styles.starSkeleton, { opacity }]} />

      <View style={styles.row}>
        {/* left logo */}
        <Animated.View style={[styles.logoSkeleton, { opacity }]} />

        {/* content */}
        <View style={styles.content}>
          <Animated.View style={[styles.titleSkeleton, { opacity }]} />
          <Animated.View style={[styles.subtitleSkeleton, { opacity }]} />

          {/* badge bottom-left */}
          <Animated.View style={[styles.badgeSkeleton, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

export default function FavoriteSkeleton() {
  return (
    <View style={styles.container}>
      <SkeletonItem />
    </View>
  );
}

const SKELETON_BG = BankingColors.surfaceSecondary;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg },

  card: {
    width: FAVORITE_CARD_WIDTH,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.card,

    // match ContractCard
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary,

    position: "relative",

    // space so text never goes under icons
    paddingRight: Spacing.lg + 28,
    paddingBottom: Spacing.lg + 28 },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },

  logoSkeleton: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.lg,
    backgroundColor: SKELETON_BG },

  content: {
    flex: 1 },

  titleSkeleton: {
    width: "60%",
    height: 18,
    borderRadius: BorderRadius.xs,
    backgroundColor: SKELETON_BG,
    marginBottom: Spacing.sm },

  subtitleSkeleton: {
    width: "45%",
    height: 14,
    borderRadius: BorderRadius.xs,
    backgroundColor: SKELETON_BG,
    marginBottom: Spacing.md },

  badgeSkeleton: {
    alignSelf: "flex-start",
    width: 90,
    height: 24,
    borderRadius: BorderRadius.full,
    backgroundColor: SKELETON_BG },

  trashSkeleton: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: SKELETON_BG },

  starSkeleton: {
    position: "absolute",
    bottom: Spacing.md,
    right: Spacing.md,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: SKELETON_BG } });
