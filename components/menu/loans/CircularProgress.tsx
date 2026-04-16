import React, { useEffect, useMemo, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { CheckCircle } from "lucide-react-native";
import { BankingColors, FontSize, Spacing, FontFamily } from "@/constants";
import { moderateScale } from "@/utils/scale";
import { clamp } from "@/utils/loan-progress";
import { t } from "i18next";

type LoanStatus = "completed" | "inProgress" | "overdue";

interface CircularProgressProps {
  remainingMonths: number;
  totalMonths: number;
  size?: number;
  strokeWidth?: number;
  titleLine1?: string;
  titleLine2?: string;
}

function getLoanStatus(remainingMonths: number): LoanStatus {
  if (remainingMonths <= 0) return "completed";
  return "inProgress";
}

function getStatusColor(status: LoanStatus): string {
  switch (status) {
    case "completed":
      return BankingColors.primary;
    case "overdue":
      return BankingColors.primary;
    case "inProgress":
    default:
      return BankingColors.primary;
  }
}

function getStatusTrackColor(status: LoanStatus): string {
  switch (status) {
    case "completed":
      return BankingColors.loanCompletedLight;
    case "overdue":
      return BankingColors.loanCompletedLight;
    case "inProgress":
    default:
      return BankingColors.loanCompletedLight;
  }
}

// ✅ make Circle animatable
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function CircularProgress({
  remainingMonths,
  totalMonths,
  size = 150,
  strokeWidth = 8,
  titleLine1,
  titleLine2 }: CircularProgressProps) {
  const radius = useMemo(() => (size - strokeWidth) / 2, [size, strokeWidth]);
  const circumference = useMemo(() => 2 * Math.PI * radius, [radius]);

  const safeTotal = Math.max(totalMonths ?? 0, 0);
  const safeRemaining = clamp(remainingMonths ?? 0, 0, safeTotal);

  const progress = safeTotal > 0 ? (safeTotal - safeRemaining) / safeTotal : 0;

  const status = getLoanStatus(safeRemaining);
  const strokeColor = getStatusColor(status);
  const trackColor = getStatusTrackColor(status);
  const isCompleted = status === "completed";

  const line1 = titleLine1 ?? t("loans.installmentsLabel1");
  const line2 = titleLine2 ?? t("loans.installmentsLabel2");

  const isCompact = size < 120;
  const innerFontLabel = isCompact ? moderateScale(8, 0.3) : FontSize.xs;
  const innerFontValue = isCompact ? moderateScale(11, 0.3) : FontSize.base;
  const iconSize = isCompact ? 14 : 18;

  // ✅ animated strokeDashoffset
  const dashOffsetAnim = useRef(new Animated.Value(circumference)).current;

  useEffect(() => {
    // target offset based on progress
    const targetOffset = circumference * (1 - progress);

    // if completed, just snap (optional) or still animate
    // we keep animation, but slower & smooth
    const anim = Animated.timing(dashOffsetAnim, {
      toValue: targetOffset,
      duration: 1600, // ✅ slower
      delay: 250, // ✅ after skeleton
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // strokeDashoffset can't use native driver
    });

    anim.start();
    return () => anim.stop();
  }, [progress, circumference, dashOffsetAnim]);

  return (
    <View style={[styles.progressContainer, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated Progress */}
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffsetAnim}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>

      <View style={styles.progressTextContainer}>
        {isCompleted ? (
          <>
            <CheckCircle size={iconSize} color={BankingColors.primary} />
            <Text
              style={[
                styles.remainingMonths,
                { color: BankingColors.primary, fontSize: innerFontValue },
              ]}
            >
              {t("loans.paid")}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.progressLabel, { fontSize: innerFontLabel }]}>
              {line1}
            </Text>
            <Text style={[styles.progressLabel, { fontSize: innerFontLabel }]}>
              {line2}
            </Text>
            <Text
              style={[
                styles.remainingMonths,
                { color: strokeColor, fontSize: innerFontValue },
              ]}
            >
              {safeRemaining} {t("loans.months")}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressContainer: {
    position: "relative",
    marginRight: Spacing.sm },
  progressTextContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center" },
  progressLabel: {
    fontSize: FontSize.xs,
    color: BankingColors.loanLabelDark,
    textAlign: "center" },
  remainingMonths: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    marginTop: 2 } });