import React, { useEffect, useMemo, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { BankingColors, BorderRadius, Shadow, Spacing } from "@/constants";

type Props = {
  count?: number; // number of cards
};

function LoanCardSkeleton({
  opacity,
  isSettled }: {
  opacity: Animated.Value;
  isSettled?: boolean;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.cardRow}>
        {/* Left circle */}
        <View style={styles.leftCol}>
          <Animated.View
            style={[
              styles.circle,
              { opacity },
              isSettled && styles.circleSettled,
            ]}
          />
          <Animated.View style={[styles.circleLine1, { opacity }]} />
          <Animated.View style={[styles.circleLine2, { opacity }]} />
        </View>

        {/* Middle content */}
        <View style={styles.midCol}>
          <Animated.View style={[styles.lineTitle, { opacity }]} />
          <Animated.View style={[styles.lineSub, { opacity }]} />

          <View style={{ height: Spacing.md }} />

          <View style={styles.detailRow}>
            <Animated.View style={[styles.iconTiny, { opacity }]} />
            <Animated.View style={[styles.lineDetail, { opacity }]} />
          </View>

          <View style={styles.detailRow}>
            <Animated.View style={[styles.iconTiny, { opacity }]} />
            <Animated.View style={[styles.lineDetailWide, { opacity }]} />
          </View>
        </View>

        {/* Right chevron placeholder */}
        <View style={styles.rightCol}>
          <Animated.View style={[styles.chevronSkel, { opacity }]} />
        </View>
      </View>
    </View>
  );
}

export default function LoansListSkeleton({ count = 3 }: Props) {
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

  const cards = useMemo(
    () => Array.from({ length: count }, (_, i) => i),
    [count],
  );

  return (
    <View style={styles.wrap}>
      {/* "Mes crédits (4)" line */}
      <Animated.View style={[styles.pageTitle, { opacity }]} />

      {/* Cards */}
      {cards.map((i) => (
        <LoanCardSkeleton
          key={i}
          opacity={opacity}
          // optional: make one look like "Soldé" by using thicker ring
          isSettled={i === 2}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg },

  pageTitle: {
    width: "48%",
    height: 22,
    borderRadius: BorderRadius.sm,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: Spacing.lg },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card },

  cardRow: {
    flexDirection: "row",
    gap: Spacing.lg },

  leftCol: {
    width: 110,
    alignItems: "center",
    justifyContent: "center" },

  circle: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 8,
    borderColor: "rgba(245,124,0,0.18)", // looks like progress ring
    backgroundColor: "rgba(245,124,0,0.06)",
    marginBottom: Spacing.sm },
  circleSettled: {
    borderColor: "rgba(245,124,0,0.30)" },
  circleLine1: {
    width: 70,
    height: 12,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginBottom: 6 },
  circleLine2: {
    width: 55,
    height: 12,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.06)" },

  midCol: {
    flex: 1,
    marginLeft: Spacing.lg },

  lineTitle: {
    width: "75%",
    height: 16,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginBottom: 8 },
  lineSub: {
    width: "45%",
    height: 13,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.06)" },

  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10 },
  iconTiny: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.06)" },
  lineDetail: {
    width: "55%",
    height: 13,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.06)" },
  lineDetailWide: {
    width: "72%",
    height: 13,
    borderRadius: BorderRadius.xs,
    backgroundColor: "rgba(0,0,0,0.06)" },

  rightCol: {
    width: 26,
    alignItems: "flex-end",
    justifyContent: "center" },
  chevronSkel: {
    width: 18,
    height: 18,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.06)" } });
