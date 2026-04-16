import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";
import { moderateScale } from "@/utils/scale";
import { width as screenWidth } from "@/constants/size-scale";

interface LoanSkeletonProps {
  count?: number;
}

const { width: SCREEN_W } = Dimensions.get("window");

// Sizes close to your LoanCard layout
const CIRCLE_SIZE = moderateScale(Math.min(screenWidth * 0.28, 120), 0.3);
const CIRCLE_INNER = Math.max(10, CIRCLE_SIZE - moderateScale(22, 0.3));

function ShimmerBlock({
  height,
  width = "100%",
  radius = 12,
  style }: {
  height: number;
  width?: number | string;
  radius?: number;
  style?: any;
}) {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View
      style={[
        styles.blockBase,
        {
          height,
          width,
          borderRadius: radius },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmerWrap,
          {
            transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.shimmer}
        />
      </Animated.View>
    </View>
  );
}

function CircleShimmer() {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true }),
    );
    anim.start();
    return () => anim.stop();
  }, [translateX]);

  return (
    <View style={styles.circleOuter}>
      <View style={styles.circleBase}>
        <Animated.View
          style={[
            styles.shimmerWrap,
            {
              transform: [{ translateX }] },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.35)", "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.shimmer}
          />
        </Animated.View>
      </View>

      {/* inner hole to mimic progress ring */}
      <View style={styles.circleInner} />
    </View>
  );
}

function SkeletonItem() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Left circle (progress) */}
        <CircleShimmer />

        {/* Middle content */}
        <View style={styles.content}>
          {/* Title */}
          <ShimmerBlock height={14} width="62%" radius={10} />
          <View style={{ height: Spacing.xs }} />

          {/* Ref line */}
          <ShimmerBlock height={12} width="48%" radius={10} />
          <View style={{ height: Spacing.md }} />

          {/* Info rows like LoanCard */}
          <View style={styles.infoRow}>
            <ShimmerBlock height={10} width="42%" radius={8} />
            <ShimmerBlock height={12} width="34%" radius={8} />
          </View>

          <View style={styles.infoRow}>
            <ShimmerBlock height={10} width="46%" radius={8} />
            <ShimmerBlock height={12} width="40%" radius={8} />
          </View>
        </View>

        {/* Right arrow placeholder */}
        <View style={styles.arrow}>
          <ShimmerBlock height={24} width={24} radius={8} />
        </View>
      </View>

      {/* Bottom mini progress line (optional aesthetic) */}
      <View style={{ marginTop: Spacing.md }}>
        <ShimmerBlock height={8} width="100%" radius={8} />
      </View>
    </View>
  );
}

export default function LoanSkeleton({ count = 2 }: LoanSkeletonProps) {
  const items = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <View style={styles.listContainer}>
      {items.map((_, index) => (
        <SkeletonItem key={index} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  listContainer: {
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg },

  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card },

  row: {
    flexDirection: "row",
    alignItems: "center" },

  content: {
    flex: 1,
    marginLeft: Spacing.md,
    minWidth: 0 },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6 },

  arrow: {
    marginLeft: Spacing.md,
    justifyContent: "center",
    alignItems: "center" },

  // base shimmer block
  blockBase: {
    backgroundColor: BankingColors.border,
    opacity: 0.45,
    overflow: "hidden" },
  shimmerWrap: {
    ...StyleSheet.absoluteFillObject },
  shimmer: {
    flex: 1,
    width: SCREEN_W * 0.65 },

  // circle shimmer
  circleOuter: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    justifyContent: "center",
    alignItems: "center" },
  circleBase: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: BankingColors.border,
    opacity: 0.45,
    overflow: "hidden" },
  circleInner: {
    position: "absolute",
    width: CIRCLE_INNER,
    height: CIRCLE_INNER,
    borderRadius: CIRCLE_INNER / 2,
    backgroundColor: BankingColors.surface } });
