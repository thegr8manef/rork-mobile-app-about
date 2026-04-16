import React, { useRef } from "react";
import { View, TouchableOpacity, Animated, StyleSheet } from "react-native";
import { Plus } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";

type Props = {
  onPress: () => void;
};

export default function TabBarFabButton({ onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true }),
    ]).start();

    onPress();
  };

  return (
    <View style={styles.fabContainer}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <Animated.View style={[styles.fab, { transform: [{ scale: scaleAnim }] }]}>
          <Plus size={32} color="#FFFFFF" strokeWidth={3} />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: "absolute",
    top: -28,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center" },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: BankingColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8 } });
