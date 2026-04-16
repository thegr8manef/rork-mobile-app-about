import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import LoanSkeleton from "@/components/LoanSkeleton";
import { SkeletonEquipment } from "./EquipmentSkeleton";
import { Spacing } from "@/constants";

interface Props {
  count?: number;
}

export default function EquipmentListSkeleton({ count = 3 }: Props) {
  const items = useMemo(() => Array.from({ length: count }), [count]);

  return (
    <View style={styles.container}>
      {items.map((_, i) => (
        <SkeletonEquipment key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    gap: Spacing.lg,
  },
});
