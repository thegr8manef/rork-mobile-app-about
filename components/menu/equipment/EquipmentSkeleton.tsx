import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BankingColors, Spacing, BorderRadius, Shadow } from "@/constants";

const { width: SCREEN_W } = Dimensions.get("window");

function Shimmer({ style }: { style?: any }) {
  const translateX = useRef(new Animated.Value(-SCREEN_W)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(translateX, {
        toValue: SCREEN_W,
        duration: 1200,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <View style={[styles.shimmerBase, style]}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { transform: [{ translateX }] }]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.4)", "transparent"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={{ flex: 1, width: SCREEN_W * 0.6 }}
        />
      </Animated.View>
    </View>
  );
}

export function SkeletonEquipment() {
  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.header}>
        <Shimmer style={styles.icon} />
        <View style={{ flex: 1 }}>
          <Shimmer style={styles.title} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Row labels */}
      <View style={styles.row}>
        <Shimmer style={styles.label} />
        <Shimmer style={styles.value} />
      </View>

      {/* Date box */}
      <Shimmer style={styles.dateBox} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.lg,
  },

  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },

  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },

  title: {
    height: 14,
    width: "70%",
    borderRadius: 8,
  },

  divider: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginVertical: Spacing.md,
  },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },

  label: {
    height: 12,
    width: "40%",
    borderRadius: 6,
  },

  value: {
    height: 12,
    width: "25%",
    borderRadius: 6,
  },

  dateBox: {
    height: 36,
    width: "100%",
    borderRadius: BorderRadius.md,
  },

  shimmerBase: {
    backgroundColor: BankingColors.border,
    opacity: 0.4,
    overflow: "hidden",
  },
});
