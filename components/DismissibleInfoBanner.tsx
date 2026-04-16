import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager } from "react-native";
import { Info, X } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, LineHeight } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DismissibleInfoBannerProps {
  tKey: string;
  autoDismissDelay?: number;
  variant?: "info" | "warning";
  showInfoButton?: boolean;
}

export default function DismissibleInfoBanner({
  tKey,
  autoDismissDelay = 6000,
  variant = "info",
  showInfoButton = true }: DismissibleInfoBannerProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const colors = variant === "warning" 
    ? { bg: BankingColors.warningLight, border: BankingColors.warning, icon: BankingColors.warning }
    : { bg: BankingColors.primaryLight, border: BankingColors.primary, icon: BankingColors.primary };

  const animateIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, scaleAnim]);

  const animateOut = useCallback((callback?: () => void) => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: -10,
        duration: 250,
        useNativeDriver: true }),
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 250,
        useNativeDriver: true }),
    ]).start(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      callback?.();
    });
  }, [fadeAnim, slideAnim, scaleAnim]);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    animateOut(() => {
      setIsVisible(false);
      setIsDismissed(true);
    });
  }, [animateOut]);

  const showAgain = useCallback(() => {
    setIsVisible(true);
    setIsDismissed(false);
    fadeAnim.setValue(0);
    slideAnim.setValue(-20);
    scaleAnim.setValue(0.95);
    
    setTimeout(() => {
      animateIn();
      timerRef.current = setTimeout(dismiss, autoDismissDelay);
    }, 50);
  }, [animateIn, dismiss, autoDismissDelay, fadeAnim, slideAnim, scaleAnim]);

  useEffect(() => {
    animateIn();
    timerRef.current = setTimeout(dismiss, autoDismissDelay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isVisible && !isDismissed) return null;

  if (isDismissed && showInfoButton) {
    return null;
  }

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: colors.bg, borderLeftColor: colors.border },
        {
          opacity: fadeAnim,
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ] },
      ]}
    >
      <View style={styles.iconContainer}>
        <Info size={18} color={colors.icon} />
      </View>
      <TText style={styles.text} tKey={tKey} />
      <TouchableOpacity
        style={styles.closeButton}
        onPress={dismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <X size={16} color={BankingColors.textSecondary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    gap: Spacing.sm },
  iconContainer: {
    marginTop: 1 },
  text: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textPrimary,
    lineHeight: FontSize.sm * LineHeight.relaxed },
  closeButton: {
    padding: Spacing.xs,
    marginTop: -2,
    marginRight: -4 },
  infoButton: {
    alignSelf: "flex-start",
    padding: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginBottom: Spacing.md } });
