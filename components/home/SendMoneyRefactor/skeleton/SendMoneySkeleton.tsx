import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";

type Props = { count?: number };

function Shimmer({ style, opacity }: { style: any; opacity: Animated.Value }) {
  return <Animated.View style={[style, { opacity }]} />;
}

function SkeletonScreen() {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <View style={styles.page}>
      {/* Compte à débiter */}
      <View style={styles.section}>
        <Shimmer opacity={opacity} style={styles.sectionTitle} />
        <View style={styles.selectCard}>
          <Shimmer opacity={opacity} style={styles.selectPlaceholder} />
          <Shimmer opacity={opacity} style={styles.chevron} />
        </View>
      </View>

      {/* Compte à créditer */}
      <View style={styles.section}>
        <Shimmer opacity={opacity} style={styles.sectionTitle} />
        <View style={styles.selectCard}>
          <Shimmer opacity={opacity} style={styles.selectPlaceholder} />
          <Shimmer opacity={opacity} style={styles.chevron} />
        </View>
      </View>

      {/* Montant */}

      <View style={styles.section}>
        <Shimmer opacity={opacity} style={styles.sectionTitle} />
        <View style={styles.selectCard}>
          <Shimmer opacity={opacity} style={styles.selectPlaceholder} />
          <Shimmer opacity={opacity} style={styles.chevron} />
        </View>
      </View>
      {/* Sélectionner le type de virement */}
   <View style={styles.section}>
        <Animated.View style={[styles.fieldLabelWide, { opacity }]} />
        <View style={styles.toggleContainer}>
          <Animated.View style={[styles.toggleButtonActive, { opacity }]} />
          <Animated.View style={[styles.toggleButtonInactive, { opacity }]} />
        </View>
      </View>

      {/* Date d'exécution */}
      <View style={styles.section}>
        <Shimmer opacity={opacity} style={styles.fieldLabel} />
        <View style={styles.dateInput}>
          <Shimmer opacity={opacity} style={styles.datePlaceholder} />
          <View style={styles.iconBox}>
            <Shimmer opacity={opacity} style={styles.calendarIcon} />
          </View>
        </View>
      </View>

      {/* Motif */}
      <View style={styles.section}>
        <Shimmer opacity={opacity} style={styles.fieldLabel} />
        <View style={styles.motifInput}>
          <Shimmer opacity={opacity} style={styles.motifPlaceholder} />
        </View>
      </View>

      {/* padding bottom (tab bar + scroll space) */}
      <View style={{ height: 220 }} />
    </View>
  );
}

export default function SendMoneySkeleton({ count = 1 }: Props) {
  return (
    <View>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonScreen key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    backgroundColor: BankingColors.background },

  section: {
    marginBottom: Spacing.lg },

  // Section titles
  sectionTitle: {
    height: 20,
    width: 140,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary,
    marginBottom: Spacing.md },

  fieldLabel: {
    height: 16,
    width: 100,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary,
    marginBottom: Spacing.md },

  fieldLabelWide: {
    height: 16,
    width: 200,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary,
    marginBottom: Spacing.md },

  // Select dropdowns (Compte à débiter/créditer)
  selectCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BankingColors.white,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 64,
    ...Shadow.xs },

  selectPlaceholder: {
    height: 16,
    width: "60%",
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },

  chevron: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },

  // Amount input
  amountInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 56,
    overflow: "hidden",
    ...Shadow.xs },

  amountPlaceholder: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary,
    marginLeft: Spacing.lg },

  currencyBox: {
    width: 86,
    height: "100%",
    backgroundColor: BankingColors.background,
    alignItems: "center",
    justifyContent: "center" },

  currencyText: {
    width: 40,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },



  toggleButton: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: BankingColors.white },

  // Date input
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    ...Shadow.xs },

  datePlaceholder: {
    flex: 1,
    height: 16,
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },

  iconBox: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md },

  calendarIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    backgroundColor: "#FF5733" },

  // Motif input
  motifInput: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 56,
    paddingHorizontal: Spacing.lg,
    justifyContent: "center",
    ...Shadow.xs },

  motifPlaceholder: {
    height: 16,
    width: "50%",
    borderRadius: 4,
    backgroundColor: BankingColors.surfaceSecondary },
  // Toggle buttons
  toggleContainer: {
    flexDirection: "row",
    gap: 4,
    backgroundColor: BankingColors.border,
    borderRadius: 28,
    padding: 4,
    height: 56 },

  toggleButtonActive: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: BankingColors.white,
    ...Shadow.xs },

  toggleButtonInactive: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: "transparent" } });