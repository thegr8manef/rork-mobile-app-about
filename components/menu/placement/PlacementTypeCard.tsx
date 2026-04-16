import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow, FontFamily } from "@/constants";

import { PlacementType } from "@/types/banking";

interface Props {
  placement: PlacementType;
  onPress: () => void;
}

export default function PlacementTypeCard({ placement, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Image source={{ uri: placement.imageUri }} style={styles.image} />

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.8)"]}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {placement.name}
          </Text>
          <Text style={styles.description} numberOfLines={2}>
            {placement.description}
          </Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 280,
    height: 180,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    marginRight: Spacing.md,
    ...Shadow.card },

  image: {
    width: "100%",
    height: "100%",
    position: "absolute" },

  gradient: {
    flex: 1,
    justifyContent: "flex-end" },

  content: {
    padding: Spacing.md },

  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface },

  description: {
    fontSize: FontSize.sm,
    color: BankingColors.surface } });
