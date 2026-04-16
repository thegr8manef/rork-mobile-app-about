// SplashRenderComponent.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Easing,
  ColorValue } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { Spacing } from "@/constants";
import { gradientColors } from "@/constants/banking-colors";

type GradientTuple = readonly [ColorValue, ColorValue, ...ColorValue[]];

type Props = {
  durationMs?: number;
  logoSize?: number;
};

function normalizeToTuple(input: readonly ColorValue[]): GradientTuple {
  if (input.length >= 2) {
    // build a tuple safely (no direct cast)
    const [a, b, ...rest] = input;
    return [a, b, ...rest];
  }
  return ["#0EA5E9", "#1D4ED8"];
}

function rotateTuple(colors: GradientTuple, offset: number): GradientTuple {
  const n = colors.length;
  const k = ((offset % n) + n) % n;

  // We build the output by indexing, so TS knows we always have >=2 items.
  const first = colors[k];
  const second = colors[(k + 1) % n];

  const rest: ColorValue[] = [];
  for (let i = 2; i < n; i++) {
    rest.push(colors[(k + i) % n]);
  }

  return [first, second, ...rest];
}

export default function SplashRenderComponent({
  durationMs = 2200,
  logoSize = 180 }: Props) {
  const base = useMemo<GradientTuple>(
    () => normalizeToTuple(gradientColors),
    []
  );

  const [index, setIndex] = useState(0);
  const [fromColors, setFromColors] = useState<GradientTuple>(() =>
    rotateTuple(base, 0)
  );
  const [toColors, setToColors] = useState<GradientTuple>(() =>
    rotateTuple(base, 1)
  );

  const t = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    const loop = () => {
      t.setValue(0);

      Animated.timing(t, {
        toValue: 1,
        duration: durationMs,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true, // opacity animation
      }).start(({ finished }) => {
        if (!finished || !mounted) return;

        const nextIndex = index + 1;
        setIndex(nextIndex);

        setFromColors(rotateTuple(base, nextIndex));
        setToColors(rotateTuple(base, nextIndex + 1));

        loop();
      });
    };

    loop();
    return () => {
      mounted = false;
      t.stopAnimation();
    };
  }, [durationMs, index, base, t]);

  const topOpacity = t;
  const bottomOpacity = t.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0] });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: bottomOpacity }]}
      >
        <LinearGradient
          colors={fromColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[StyleSheet.absoluteFill, { opacity: topOpacity }]}>
        <LinearGradient
          colors={toColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <View style={styles.center}>
        <Image
          source={require("@assets/images/newlogodark.png")}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing?.lg ?? 16 } });