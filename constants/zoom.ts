// utils/zoom.ts
import { useCallback } from "react";
import { Gesture } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming } from "react-native-reanimated";

type ZoomOptions = {
  minScale?: number; // default 1
  maxScale?: number; // default 4
  doubleTapScale?: number; // default 2
  /**
   * Size of the container where the image is displayed (the frame).
   * Used to clamp pan so the image can't be dragged out completely.
   */
  frameWidth: number;
  frameHeight: number;
};

const clamp = (v: number, min: number, max: number) =>
  Math.max(min, Math.min(max, v));

export function useZoomableImage({
  frameWidth,
  frameHeight,
  minScale = 1,
  maxScale = 4,
  doubleTapScale = 2 }: ZoomOptions) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const clampPan = useCallback(
    (x: number, y: number, s: number) => {
      // When scaled, how much extra content exists beyond the frame
      const extraX = ((frameWidth * s) - frameWidth) / 2;
      const extraY = ((frameHeight * s) - frameHeight) / 2;

      return {
        x: clamp(x, -extraX, extraX),
        y: clamp(y, -extraY, extraY) };
    },
    [frameWidth, frameHeight]
  );

  const reset = useCallback(() => {
    scale.value = withTiming(1);
    savedScale.value = 1;
    translateX.value = withTiming(0);
    translateY.value = withTiming(0);
    savedX.value = 0;
    savedY.value = 0;
  }, [scale, savedScale, translateX, translateY, savedX, savedY]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      const next = savedScale.value * e.scale;
      const s = clamp(next, minScale, maxScale);
      scale.value = s;

      // keep pan in bounds while scaling
      const clamped = clampPan(translateX.value, translateY.value, s);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedScale.value = scale.value;

      // snap back if near 1
      if (scale.value <= minScale + 0.02) {
        scale.value = withTiming(minScale);
        savedScale.value = minScale;

        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  // Pan with 1 finger (only when zoomed)
  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onUpdate((e) => {
      if (scale.value <= minScale) return;

      const nextX = savedX.value + e.translationX;
      const nextY = savedY.value + e.translationY;

      const clamped = clampPan(nextX, nextY, scale.value);
      translateX.value = clamped.x;
      translateY.value = clamped.y;
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > minScale ? minScale : doubleTapScale;

      scale.value = withTiming(next);
      savedScale.value = next;

      if (next === minScale) {
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  // ✅ allow pinch + pan to work together, and double tap too
  const gesture = Gesture.Simultaneous(pinch, pan, doubleTap);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { translateX: translateX.value },
        { translateY: translateY.value },
      ] };
  });

  return {
    gesture,
    animatedStyle,
    reset,
    // expose current scale if you want to show UI state
    scale };
}
