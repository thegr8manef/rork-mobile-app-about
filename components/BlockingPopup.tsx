// BlockingPopup.tsx
import { BankingColors, FontFamily } from "@/constants";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Platform,
  BackHandler,
  KeyboardAvoidingView,
  ActivityIndicator,
  ViewStyle,
  TextStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type PopupTheme = {
  backdrop: string;
  surface: string;
  text: string;
  mutedText: string;
  border: string;
  primary: string;
  danger: string;
  radius: number;
  spacing: number;
  titleSize: number;
  bodySize: number;
  buttonTextSize: number;
  shadow?: ViewStyle;
};

type PopupAction = {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "danger";
  loading?: boolean;
  disabled?: boolean;
  testID?: string;
};

type BlockingPopupProps = {
  visible: boolean;
  title?: string;
  message?: string;
  children?: React.ReactNode;

  actions?: PopupAction[];
  showCloseX?: boolean;

  allowBackdropClose?: boolean;
  allowAndroidBackClose?: boolean;
  onRequestClose?: () => void;

  maxWidth?: number;
  containerStyle?: ViewStyle;
  titleStyle?: TextStyle;
  messageStyle?: TextStyle;

  theme?: Partial<PopupTheme>;
  testID?: string;
};

/**
 * ✅ LIGHT DEFAULT THEME (your app looks light)
 * If you want dark mode later, we can switch this based on Appearance.
 */
const DEFAULT_THEME: PopupTheme = {
  backdrop: "rgba(0,0,0,0.35)",
  surface: "#FFFFFF",
  text: "#111827",
  mutedText: "#6B7280",
  border: "rgba(17, 24, 39, 0.10)",

  primary: BankingColors.primary, // ✅ HERE
  danger: BankingColors.primary,

  radius: 18,
  spacing: 12,
  titleSize: 18,
  bodySize: 14,
  buttonTextSize: 14,

  shadow: Platform.select<ViewStyle>({
    ios: {
      shadowColor: "#000",
      shadowOpacity: 0.18,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 10 } },
    android: { elevation: 10 },
    default: {} }) };

export function BlockingPopup({
  visible,
  title,
  message,
  children,
  actions = [],
  showCloseX = false,
  allowBackdropClose = false,
  allowAndroidBackClose = false,
  onRequestClose,
  maxWidth = 520,
  containerStyle,
  titleStyle,
  messageStyle,
  theme,
  testID }: BlockingPopupProps) {
  const insets = useSafeAreaInsets();
  const t = useMemo(() => ({ ...DEFAULT_THEME, ...(theme ?? {}) }), [theme]);

  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.96)).current;
  const translateY = useRef(new Animated.Value(12)).current;

  const [mounted, setMounted] = useState(visible);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true }),
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 140,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible, mounted, opacity, scale, translateY]);

  useEffect(() => {
    if (Platform.OS !== "android" || !mounted) return;

    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!visible) return false;
      if (allowAndroidBackClose) onRequestClose?.();
      return true;
    });

    return () => sub.remove();
  }, [mounted, visible, allowAndroidBackClose, onRequestClose]);

  const renderButton = (a: PopupAction, idx: number) => {
    const variant = a.variant ?? (idx === 0 ? "primary" : "secondary");
    const isDanger = variant === "danger";

    const bg =
      variant === "secondary" ? "transparent" : isDanger ? t.danger : t.primary;

    const borderColor =
      variant === "secondary" ? t.border || "rgba(0,0,0,0.12)" : "transparent";

    const textColor = variant === "secondary" ? t.text : "#FFFFFF";
    const disabled = a.disabled || a.loading;

    return (
      <Pressable
        key={`${a.label}-${idx}`}
        testID={a.testID}
        onPress={() => {
          if (disabled) return;
          a.onPress();
        }}
        style={({ pressed }) => [
          styles.btn,
          {
            backgroundColor: bg,
            borderColor,
            opacity: disabled ? 0.55 : pressed ? 0.92 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={a.label}
      >
        {a.loading ? (
          <ActivityIndicator
            color={variant === "secondary" ? t.text : "#FFF"}
          />
        ) : (
          <Text
            style={[
              styles.btnText,
              { color: textColor, fontSize: t.buttonTextSize },
            ]}
          >
            {a.label}
          </Text>
        )}
      </Pressable>
    );
  };

  if (!mounted) return null;

  return (
    <Modal
      visible={mounted}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => {
        if (allowAndroidBackClose) onRequestClose?.();
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
      >
        {/* Backdrop */}
        <Animated.View
          style={[styles.backdrop, { backgroundColor: t.backdrop, opacity }]}
          pointerEvents={visible ? "auto" : "none"}
        >
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (allowBackdropClose) onRequestClose?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            accessibilityHint={
              allowBackdropClose ? "Closes the dialog" : "Dialog is blocking"
            }
          />
        </Animated.View>

        {/* Centered card */}
        <View
          pointerEvents="box-none"
          style={[
            styles.center,
            {
              paddingTop: Math.max(t.spacing, insets.top),
              paddingBottom: Math.max(t.spacing, insets.bottom),
              paddingHorizontal: t.spacing },
          ]}
        >
          <Animated.View
            testID={testID}
            style={[
              styles.card,
              t.shadow,
              {
                backgroundColor: t.surface,
                borderColor: t.border,
                borderRadius: t.radius,
                maxWidth,
                transform: [{ scale }, { translateY }] },
              containerStyle,
            ]}
            accessibilityViewIsModal
            accessibilityRole="alert"
          >
            {/* Header */}
            {(title || showCloseX) && (
              <View style={[styles.header, { padding: t.spacing }]}>
                <View style={{ flex: 1, paddingRight: t.spacing }}>
                  {!!title && (
                    <Text
                      style={[
                        styles.title,
                        { color: t.text, fontSize: t.titleSize },
                        titleStyle,
                      ]}
                      numberOfLines={2}
                    >
                      {title}
                    </Text>
                  )}
                </View>

                {showCloseX && (
                  <Pressable
                    onPress={() => onRequestClose?.()}
                    style={({ pressed }) => [
                      styles.closeX,
                      {
                        opacity: pressed ? 0.75 : 1,
                        borderColor: t.border },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Close"
                  >
                    <Text style={{ color: t.text, fontSize: 16 }}>✕</Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Body */}
            <View
              style={{ paddingHorizontal: t.spacing, paddingBottom: t.spacing }}
            >
              {!!message && (
                <Text
                  style={[
                    styles.message,
                    { color: t.mutedText, fontSize: t.bodySize },
                    messageStyle,
                  ]}
                >
                  {message}
                </Text>
              )}

              {children ? (
                <View style={{ marginTop: message ? t.spacing : 0 }}>
                  {children}
                </View>
              ) : null}
            </View>

            {/* Actions */}
            {actions.length > 0 && (
              <View
                style={[
                  styles.footer,
                  {
                    borderTopColor: t.border,
                    padding: t.spacing,
                    gap: 10 },
                ]}
              >
                {actions.map(renderButton)}
              </View>
            )}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject },
  center: {
    flex: 1,
    justifyContent: "center" },
  card: {
    alignSelf: "center",
    width: "100%",
    borderWidth: 1,
    overflow: "hidden" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10 },
  title: {
    fontFamily: FontFamily.bold },
  closeX: {
    width: 36,
    height: 36,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center" },
  message: {
    lineHeight: 20 },
  footer: {
    borderTopWidth: 1 },
  btn: {
    width: "100%",
    minHeight: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12 },

  btnText: {
    fontFamily: FontFamily.bold } });
