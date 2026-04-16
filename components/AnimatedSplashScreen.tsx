import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Image } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  cancelAnimation } from "react-native-reanimated";
import { BankingColors } from "@/constants/banking-colors";

interface AnimatedSplashScreenProps {
  onFinish: () => void;
}

export default function AnimatedSplashScreen({ onFinish }: AnimatedSplashScreenProps) {
  const finishedRef = useRef(false);
  const mountedRef = useRef(true);

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.3);
  const signatureOpacity = useSharedValue(0);
  const signatureTranslateY = useSharedValue(50);
  const backgroundOpacity = useSharedValue(1);

  const safeFinish = () => {
    if (!mountedRef.current) return;
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish();
  };

  useEffect(() => {
    mountedRef.current = true;
    finishedRef.current = false;

    // reset values (important if component remounts)
    logoOpacity.value = 0;
    logoScale.value = 0.3;
    signatureOpacity.value = 0;
    signatureTranslateY.value = 50;
    backgroundOpacity.value = 1;

    logoOpacity.value = withDelay(
      500,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.cubic) })
    );

    logoScale.value = withDelay(
      500,
      withTiming(1, { duration: 1200, easing: Easing.out(Easing.back(1.2)) })
    );

    signatureOpacity.value = withDelay(
      1800,
      withTiming(1, { duration: 800, easing: Easing.out(Easing.ease) })
    );

    signatureTranslateY.value = withDelay(
      1800,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) })
    );

    backgroundOpacity.value = withDelay(
      3800,
      withTiming(
        0,
        { duration: 600, easing: Easing.in(Easing.ease) },
        (finished) => {
          if (finished) runOnJS(safeFinish)();
        }
      )
    );

    return () => {
      mountedRef.current = false;
      cancelAnimation(logoOpacity);
      cancelAnimation(logoScale);
      cancelAnimation(signatureOpacity);
      cancelAnimation(signatureTranslateY);
      cancelAnimation(backgroundOpacity);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }] }));

  const signatureAnimatedStyle = useAnimatedStyle(() => ({
    opacity: signatureOpacity.value,
    transform: [{ translateY: signatureTranslateY.value }] }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: backgroundOpacity.value }));

  return (
    <Animated.View
      style={[styles.container, containerAnimatedStyle]}
      pointerEvents="none"
    >
      <View style={styles.content}>
        <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.View style={[styles.signatureContainer, signatureAnimatedStyle]}>
          <Image
            source={require("@/assets/signature/signature.png")}
            style={styles.signature}
            resizeMode="contain"
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BankingColors.white,
    zIndex: 9999 },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40 },
  logoContainer: { marginBottom: 60 },
  logo: { width: 200, height: 80 },
  signatureContainer: {
    position: "absolute",
    bottom: 100,
    alignItems: "center" },
  signature: {
    width: 280,
    height: 60,
    tintColor: BankingColors.primary } });
