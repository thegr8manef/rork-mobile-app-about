import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Dimensions } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";

type Props = {
  /** default: 3 (TECH / RECLAMATION / SERVICE) */
  typeCardsCount?: number;
  /** show the top summary skeleton */
  showSummary?: boolean;
  /** show assistance block skeleton */
  showAssistance?: boolean;
};

const { width } = Dimensions.get("window");

const useShimmerOpacity = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true }),
      ]),
    );

    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  return shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.28, 0.7] });
};

const ClaimHomeSkeletonItem = () => {
  const opacity = useShimmerOpacity();

  return (
    <View style={styles.root}>
      {/* ===== SUMMARY CARD ===== */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeaderRow}>
          <Animated.View style={[styles.skelTitle, { opacity }]} />
          <Animated.View style={[styles.skelLink, { opacity }]} />
        </View>

        <View style={styles.countersRow}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <View key={idx} style={styles.counterBox}>
              <Animated.View style={[styles.counterLabel, { opacity }]} />
              <Animated.View style={[styles.counterValue, { opacity }]} />
            </View>
          ))}
        </View>
      </View>

      {/* ===== TYPE CARDS ===== */}
      <View style={styles.typesSection}>
        {Array.from({ length: 3 }).map((_, idx) => (
          <View key={idx} style={styles.typeCard}>
            {/* left border accent */}
            <Animated.View style={[styles.leftAccent, { opacity }]} />

            {/* icon container */}
            <Animated.View style={[styles.iconCircle, { opacity }]} />

            {/* content */}
            <View style={styles.typeContent}>
              <Animated.View style={[styles.typeTitle, { opacity }]} />
              <Animated.View style={[styles.typeLine, { opacity }]} />
              <Animated.View style={[styles.typeLineShort, { opacity }]} />
            </View>

            {/* arrow circle */}
            <Animated.View style={[styles.arrowCircle, { opacity }]} />
          </View>
        ))}
      </View>

      {/* ===== ASSISTANCE BLOCK ===== */}
      <View style={styles.assistanceCard}>
        <View style={styles.assistanceHeader}>
          <Animated.View style={[styles.assistanceIconCircle, { opacity }]} />
          <Animated.View style={[styles.assistanceTitle, { opacity }]} />
        </View>

        <Animated.View style={[styles.assistanceLine, { opacity }]} />
        <Animated.View style={[styles.assistanceLineWide, { opacity }]} />
        <Animated.View style={[styles.assistanceLineShort, { opacity }]} />

        <Animated.View style={[styles.assistanceButton, { opacity }]} />
      </View>
    </View>
  );
};

export default function ClaimHomeSkeleton({
  typeCardsCount = 3,
  showSummary = true,
  showAssistance = true }: Props) {
  const blocks = useMemo(() => {
    // we render one “home skeleton page”; typeCardsCount affects how many type cards we show
    return { typeCardsCount };
  }, [typeCardsCount]);

  return (
    <View style={styles.wrapper}>
      {/* Summary */}
      {showSummary && (
        <ClaimHomeSkeletonSummaryAndTypes count={blocks.typeCardsCount} />
      )}

      {/* Assistance */}
      {showAssistance && <ClaimHomeSkeletonAssistance />}
    </View>
  );
}

/** Split components so you can show/hide easily without re-animating multiple loops */
const ClaimHomeSkeletonSummaryAndTypes = ({ count }: { count: number }) => {
  const opacity = useShimmerOpacity();

  return (
    <View>
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeaderRow}>
          <Animated.View style={[styles.skelTitle, { opacity }]} />
          <Animated.View style={[styles.skelLink, { opacity }]} />
        </View>

        <View style={styles.countersRow}>
          {Array.from({ length: 3 }).map((_, idx) => (
            <View key={idx} style={styles.counterBox}>
              <Animated.View style={[styles.counterLabel, { opacity }]} />
              <Animated.View style={[styles.counterValue, { opacity }]} />
            </View>
          ))}
        </View>
      </View>

      <View style={styles.typesSection}>
        {Array.from({ length: count }).map((_, idx) => (
          <View key={idx} style={styles.typeCard}>
            <Animated.View style={[styles.leftAccent, { opacity }]} />
            <Animated.View style={[styles.iconCircle, { opacity }]} />

            <View style={styles.typeContent}>
              <Animated.View style={[styles.typeTitle, { opacity }]} />
              <Animated.View style={[styles.typeLine, { opacity }]} />
              <Animated.View style={[styles.typeLineShort, { opacity }]} />
            </View>

            <Animated.View style={[styles.arrowCircle, { opacity }]} />
          </View>
        ))}
      </View>
    </View>
  );
};

const ClaimHomeSkeletonAssistance = () => {
  const opacity = useShimmerOpacity();

  return (
    <View style={styles.assistanceCard}>
      <View style={styles.assistanceHeader}>
        <Animated.View style={[styles.assistanceIconCircle, { opacity }]} />
        <Animated.View style={[styles.assistanceTitle, { opacity }]} />
      </View>

      <Animated.View style={[styles.assistanceLine, { opacity }]} />
      <Animated.View style={[styles.assistanceLineWide, { opacity }]} />
      <Animated.View style={[styles.assistanceLineShort, { opacity }]} />

      <Animated.View style={[styles.assistanceButton, { opacity }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: BankingColors.background,
    padding: Spacing.lg,
    paddingBottom: Spacing.massive },

  root: {
    flex: 1 },

  /* ===== Summary ===== */
  summaryCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card },
  summaryHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.lg },
  skelTitle: {
    width: width * 0.48,
    height: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },
  skelLink: {
    width: 70,
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },
  countersRow: {
    flexDirection: "row",
    gap: Spacing.md },
  counterBox: {
    flex: 1,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    backgroundColor: BankingColors.background,
    height: 84,
    justifyContent: "center" },
  counterLabel: {
    width: "72%",
    height: 12,
    borderRadius: BorderRadius.sm,
    marginBottom: 12,
    backgroundColor: BankingColors.border },
  counterValue: {
    width: 30,
    height: 26,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },

  /* ===== Type cards ===== */
  typesSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg },
  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.card,
    overflow: "hidden" },
  leftAccent: {
    width: 4,
    height: 54,
    borderRadius: 4,
    marginRight: Spacing.md,
    backgroundColor: BankingColors.border },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    marginRight: Spacing.md,
    backgroundColor: BankingColors.border },
  typeContent: {
    flex: 1 },
  typeTitle: {
    width: "62%",
    height: 14,
    borderRadius: BorderRadius.sm,
    marginBottom: 10,
    backgroundColor: BankingColors.border },
  typeLine: {
    width: "92%",
    height: 10,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    backgroundColor: BankingColors.border },
  typeLineShort: {
    width: "78%",
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },
  arrowCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginLeft: Spacing.md,
    backgroundColor: BankingColors.border },

  /* ===== Assistance ===== */
  assistanceCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.card },
  assistanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.md },
  assistanceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.border },
  assistanceTitle: {
    width: width * 0.45,
    height: 14,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },
  assistanceLine: {
    width: "92%",
    height: 10,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    backgroundColor: BankingColors.border },
  assistanceLineWide: {
    width: "86%",
    height: 10,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    backgroundColor: BankingColors.border },
  assistanceLineShort: {
    width: "72%",
    height: 10,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border },
  assistanceButton: {
    marginTop: Spacing.lg,
    height: 44,
    borderRadius: BorderRadius.lg,
    width: "100%",
    backgroundColor: BankingColors.border } });
