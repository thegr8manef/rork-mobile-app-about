import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  Platform,
  Text,
  Easing } from "react-native";
import { BankingColors, FontFamily } from "@/constants";
import { ChevronRight, X, Sparkles } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTranslation } from "react-i18next";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const OVERLAY_COLOR = "rgba(15, 23, 42, 0.62)";
const SPOTLIGHT_BORDER_COLOR = "rgba(255, 255, 255, 0.45)";
const SPOTLIGHT_GLOW_COLOR = BankingColors.primary;

export interface SpotlightRegion {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface OnboardingStep {
  key: string;
  title: string;
  description: string;
  region: SpotlightRegion;
  tooltipPosition: "above" | "below";
  borderRadius: number;
  padding: number;
}

interface OnboardingGuideProps {
  visible: boolean;
  steps: OnboardingStep[];
  onComplete: () => void;
  onBeforeStep?: (nextIndex: number, stepKey: string) => Promise<SpotlightRegion | null>;
  skipLabel?: string;
  nextLabel?: string;
  doneLabel?: string;
}

export function measureViewAsync(
  ref: React.RefObject<View | null>,
): Promise<SpotlightRegion | null> {
  return new Promise((resolve) => {
    if (!ref.current) {
      resolve(null);
      return;
    }
    ref.current.measureInWindow((x, y, width, height) => {
      if (width === 0 && height === 0) {
        resolve(null);
      } else {
        resolve({ x, y, width, height });
      }
    });
  });
}

export default function OnboardingGuide({
  visible,
  steps,
  onComplete,
  onBeforeStep,
  skipLabel,
  nextLabel,
  doneLabel }: OnboardingGuideProps) {
  const { t } = useTranslation();
  const resolvedSkipLabel = skipLabel ?? t("guide.skip");
  const resolvedNextLabel = nextLabel ?? t("guide.next");
  const resolvedDoneLabel = doneLabel ?? t("guide.done");
  const [dynamicRegions, setDynamicRegions] = useState<Record<string, SpotlightRegion>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const tooltipOpacity = useRef(new Animated.Value(0)).current;
  const tooltipTranslateY = useRef(new Animated.Value(20)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const progressWidth = useRef(new Animated.Value(0)).current;
  const borderGlow = useRef(new Animated.Value(0)).current;

  const animateIn = useCallback(() => {
    fadeAnim.setValue(0);
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(20);

    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true }),
      Animated.parallel([
        Animated.timing(tooltipOpacity, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true }),
        Animated.spring(tooltipTranslateY, {
          toValue: 0,
          damping: 15,
          stiffness: 120,
          mass: 0.8,
          useNativeDriver: true }),
      ]),
    ]).start();
  }, [fadeAnim, tooltipOpacity, tooltipTranslateY]);

  const animateStepTransition = useCallback(() => {
    tooltipOpacity.setValue(0);
    tooltipTranslateY.setValue(16);

    Animated.parallel([
      Animated.timing(tooltipOpacity, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true }),
      Animated.spring(tooltipTranslateY, {
        toValue: 0,
        damping: 14,
        stiffness: 130,
        mass: 0.7,
        useNativeDriver: true }),
    ]).start();
  }, [tooltipOpacity, tooltipTranslateY]);

  const startPulse = useCallback(() => {
    pulseAnim.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true }),
      ]),
    ).start();
  }, [pulseAnim]);

  const startBorderGlow = useCallback(() => {
    borderGlow.setValue(0);
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false }),
        Animated.timing(borderGlow, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false }),
      ]),
    ).start();
  }, [borderGlow]);

  useEffect(() => {
    if (visible && steps.length > 0) {
      setCurrentStep(0);
      setDynamicRegions({});
      animateIn();
      startPulse();
      startBorderGlow();

      Animated.timing(progressWidth, {
        toValue: 1 / steps.length,
        duration: 400,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false }).start();
    }
  }, [visible, steps.length]);

  const handleNext = useCallback(async () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      const nextStep = steps[next];

      if (onBeforeStep && nextStep) {
        tooltipOpacity.setValue(0);
        try {
          const updatedRegion = await onBeforeStep(next, nextStep.key);
          if (updatedRegion) {
            setDynamicRegions((prev) => ({ ...prev, [nextStep.key]: updatedRegion }));
          }
        } catch (e) {
          console.log("onBeforeStep error:", e);
        }
      }

      setCurrentStep(next);
      animateStepTransition();

      Animated.timing(progressWidth, {
        toValue: (next + 1) / steps.length,
        duration: 350,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false }).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true }),
        Animated.timing(tooltipOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true }),
      ]).start(() => {
        onComplete();
      });
    }
  }, [currentStep, steps, onComplete, animateStepTransition, fadeAnim, tooltipOpacity, progressWidth, onBeforeStep]);

  const handleSkip = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true }),
      Animated.timing(tooltipOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true }),
    ]).start(() => {
      onComplete();
    });
  }, [onComplete, fadeAnim, tooltipOpacity]);

  if (!visible || steps.length === 0) return null;

  const step = steps[currentStep];
  if (!step) return null;

  const activeRegion = dynamicRegions[step.key] ?? step.region;
  const pad = step.padding;
  const spotlight = {
    x: activeRegion.x - pad,
    y: activeRegion.y - pad,
    width: activeRegion.width + pad * 2,
    height: activeRegion.height + pad * 2 };

  const isLastStep = currentStep === steps.length - 1;

  const borderOpacity = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.85] });

  const borderShadowRadius = borderGlow.interpolate({
    inputRange: [0, 1],
    outputRange: [4, 14] });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015] });

  const TOOLTIP_ESTIMATED_HEIGHT = 220;
  const BOTTOM_SAFE_MARGIN = 40;

  const wouldOverflowBottom =
    step.tooltipPosition === "below" &&
    spotlight.y + spotlight.height + 16 + TOOLTIP_ESTIMATED_HEIGHT >
      SCREEN_HEIGHT - BOTTOM_SAFE_MARGIN;

  const effectivePosition = wouldOverflowBottom ? "above" : step.tooltipPosition;

  const tooltipTop =
    effectivePosition === "below"
      ? spotlight.y + spotlight.height + 16
      : undefined;
  const tooltipBottom =
    effectivePosition === "above"
      ? SCREEN_HEIGHT - spotlight.y + 16
      : undefined;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleSkip}
    >
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.overlayBar,
            {
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, spotlight.y),
              opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.overlayBar,
            {
              top: spotlight.y,
              left: 0,
              width: Math.max(0, spotlight.x),
              height: spotlight.height,
              opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.overlayBar,
            {
              top: spotlight.y,
              left: spotlight.x + spotlight.width,
              right: 0,
              height: spotlight.height,
              opacity: fadeAnim },
          ]}
        />
        <Animated.View
          style={[
            styles.overlayBar,
            {
              top: spotlight.y + spotlight.height,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: fadeAnim },
          ]}
        />

        <Animated.View
          style={[
            styles.spotlightBorder,
            {
              left: spotlight.x - 2,
              top: spotlight.y - 2,
              width: spotlight.width + 4,
              height: spotlight.height + 4,
              borderRadius: step.borderRadius + 2,
              opacity: fadeAnim,
              transform: [{ scale: pulseScale }] },
          ]}
        >
          <Animated.View
            style={[
              styles.spotlightInnerBorder,
              {
                borderRadius: step.borderRadius + 2,
                borderColor: SPOTLIGHT_BORDER_COLOR,
                opacity: borderOpacity,
                shadowRadius: borderShadowRadius as unknown as number },
            ]}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.tooltip,
            {
              top: tooltipTop,
              bottom: tooltipBottom,
              opacity: tooltipOpacity,
              transform: [{ translateY: tooltipTranslateY }] },
          ]}
        >
          <View style={[styles.tooltipArrow, effectivePosition === "above" ? { bottom: -4 } : { top: -4 }]}>
            {effectivePosition === "above" ? (
              <View style={styles.arrowDown} />
            ) : (
              <View style={styles.arrowUp} />
            )}
          </View>

          <View style={styles.tooltipHeader}>
            <View style={styles.tooltipIconWrap}>
              <Sparkles size={16} color={BankingColors.primary} />
            </View>
            <Text style={styles.tooltipStepLabel}>
              {currentStep + 1}/{steps.length}
            </Text>
          </View>

          <Text style={styles.tooltipTitle}>{step.title}</Text>
          <Text style={styles.tooltipDescription}>{step.description}</Text>

          <View style={styles.progressBarContainer}>
            <Animated.View
              style={[
                styles.progressBarFill,
                {
                  width: progressWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: ["0%", "100%"] }) },
              ]}
            />
          </View>

          <View style={styles.tooltipActions}>
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipButton}
              activeOpacity={0.7}
            >
              <Text style={styles.skipText}>{resolvedSkipLabel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleNext}
              style={styles.nextButton}
              activeOpacity={0.8}
            >
              <Text style={styles.nextText}>
                {isLastStep ? resolvedDoneLabel : resolvedNextLabel}
              </Text>
              {!isLastStep && (
                <ChevronRight
                  size={16}
                  color="#FFFFFF"
                  style={{ marginLeft: 4 }}
                />
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View style={[styles.skipAllContainer, { opacity: fadeAnim }]}>
          <TouchableOpacity
            onPress={handleSkip}
            style={styles.closeOverlayButton}
            activeOpacity={0.7}
          >
            <X size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1 },
  overlayBar: {
    position: "absolute",
    backgroundColor: OVERLAY_COLOR },
  spotlightBorder: {
    position: "absolute",
    overflow: "hidden" },
  spotlightInnerBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: SPOTLIGHT_BORDER_COLOR,
    shadowColor: SPOTLIGHT_GLOW_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    elevation: 8 },
  tooltip: {
    position: "absolute",
    left: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 16 },
  tooltipArrow: {
    position: "absolute",
    alignSelf: "center",
    left: 0,
    right: 0,
    alignItems: "center" },
  arrowUp: {
    position: "absolute",
    top: -8,
    width: 16,
    height: 16,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    borderRadius: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2 },
  arrowDown: {
    position: "absolute",
    bottom: -8,
    width: 16,
    height: 16,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "45deg" }],
    borderRadius: 3 },
  tooltipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10 },
  tooltipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: `${BankingColors.primary}12`,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8 },
  tooltipStepLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    letterSpacing: 0.5 },
  tooltipTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 6,
    letterSpacing: -0.2 },
  tooltipDescription: {
    fontSize: 14,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
    lineHeight: 20,
    marginBottom: 14 },
  progressBarContainer: {
    height: 3,
    backgroundColor: BankingColors.borderLight,
    borderRadius: 2,
    marginBottom: 14,
    overflow: "hidden" },
  progressBarFill: {
    height: "100%",
    backgroundColor: BankingColors.primary,
    borderRadius: 2 },
  tooltipActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  skipButton: {
    paddingVertical: 10,
    paddingHorizontal: 16 },
  skipText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.textLight },
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: BankingColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4 },
  nextText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF" },
  skipAllContainer: {
    position: "absolute",
    top: Platform.OS === "ios" ? 54 : 16,
    right: 16,
    zIndex: 100 },
  closeOverlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center" } });
