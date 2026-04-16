// components/LanguageChangedToast.tsx
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";
import { Check } from "lucide-react-native";
import { BankingColors, FontFamily } from "@/constants";
import TText from "@/components/TText";

type Props = {
  visible: boolean;
  label: string; // e.g. "Français" or "English"
};

export default function LanguageChangedToast({ visible, label }: Props) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200 }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true }),
      ]),
      Animated.delay(1400),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true }),
    ]).start(() => {
      translateY.setValue(20);
    });
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pill, { opacity, transform: [{ translateY }] }]}
    >
      <View style={styles.checkCircle}>
        <Check size={13} color="#fff" strokeWidth={3} />
      </View>
      <TText style={styles.text}>{label}</TText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pill: {
    position: "absolute",
    bottom: 40,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#1A1A2E",
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10 },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center" },
  text: {
    color: "#fff",
    fontSize: 14,
    fontFamily: FontFamily.semibold } });