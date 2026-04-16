import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

function SkeletonBox({
  width,
  height,
  borderRadius = 6,
  opacity,
}: {
  width: number | string;
  height: number;
  borderRadius?: number;
  opacity: Animated.Value;
}) {
  return (
    <Animated.View
      style={[
        {
          width: width as number,
          height,
          borderRadius,
          backgroundColor: BankingColors.border,
          opacity,
        },
      ]}
    />
  );
}

export default function SkeletonBillItem() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.4,
          duration: 700,
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <View style={styles.content}>
        {/* Checkbox placeholder */}
        <SkeletonBox
          width={24}
          height={24}
          borderRadius={4}
          opacity={opacity}
        />

        {/* Icon placeholder */}
        <SkeletonBox
          width={IconSize.huge}
          height={IconSize.huge}
          borderRadius={IconSize.lg}
          opacity={opacity}
        />

        {/* Info placeholder */}
        <View style={styles.info}>
          <SkeletonBox
            width="70%"
            height={14}
            borderRadius={4}
            opacity={opacity}
          />
          <View style={{ height: Spacing.xs }} />
          <SkeletonBox
            width="45%"
            height={11}
            borderRadius={4}
            opacity={opacity}
          />
        </View>

        {/* Amount placeholder */}
        <SkeletonBox
          width={80}
          height={16}
          borderRadius={4}
          opacity={opacity}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    borderLeftWidth: Spacing.xs,
    borderLeftColor: BankingColors.border,
    ...Shadow.card,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  info: {
    flex: 1,
  },
});
