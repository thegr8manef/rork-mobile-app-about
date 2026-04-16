import React, { useCallback, useState, useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Platform } from "react-native";
import { Lock, Delete, ArrowLeft, LucideIcon } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import * as Haptics from "expo-haptics";

interface PinPadProps {
  title: string;
  subtitle?: string;
  digits?: number;
  isLoading?: boolean;
  disabled?: boolean;
  onComplete: (pin: string) => void;
  footerText?: string;
  footerComponent?: React.ReactNode;
  iconColor?: string;
  resetKey?: number;
  onBack?: () => void;
  headerExtra?: React.ReactNode;
  icon?: LucideIcon;
}

const DOT_SIZE = 20;
const DOT_SPACING = 16;
const KEY_SIZE = 72;
const KEY_GAP = 20;

export default function PinPad({
  title,
  subtitle,
  digits = 6,
  isLoading = false,
  disabled = false,
  onComplete,
  footerText,
  footerComponent,
  iconColor = BankingColors.primary,
  resetKey = 0,
  onBack,
  headerExtra,
  icon: IconComponent = Lock }: PinPadProps) {
  const [pin, setPin] = useState("");

  useEffect(() => {
    setPin("");
  }, [resetKey]);

  const triggerHaptic = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, []);

  const handlePress = useCallback(
    (key: string) => {
      if (isLoading || disabled) return;
      triggerHaptic();

      if (key === "delete") {
        setPin((prev) => {
          if (prev.length === 0) return prev;
          return prev.slice(0, -1);
        });
        return;
      }

      setPin((prev) => {
        if (prev.length >= digits) return prev;
        const newPin = prev + key;

        if (newPin.length === digits) {
          setTimeout(() => onComplete(newPin), 150);
        }
        return newPin;
      });
    },
    [isLoading, disabled, digits, onComplete, triggerHaptic],
  );

  const keys = [
    ["1", "2", "3"],
    ["4", "5", "6"],
    ["7", "8", "9"],
    ["", "0", "delete"],
  ];

  return (
    <View style={styles.container}>
      {onBack && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isLoading || disabled}
          activeOpacity={0.6}
          testID="pin-back"
        >
          <ArrowLeft size={22} color={BankingColors.primary} strokeWidth={2} />
        </TouchableOpacity>
      )}

      <View style={styles.header}>
        <View
          style={[
            styles.lockIconWrap,
            { backgroundColor: iconColor + "12" },
          ]}
        >
          <IconComponent size={28} color={iconColor} strokeWidth={2.2} />
        </View>

        <TText style={styles.title}>{title}</TText>

        {subtitle ? <TText style={styles.subtitle}>{subtitle}</TText> : null}

        <View style={styles.dotsRow}>
          {Array.from({ length: digits }).map((_, i) => (
            <View key={i} style={styles.dotOuter}>
              {i < pin.length && <View style={styles.dotFilled} />}
            </View>
          ))}
        </View>

        {headerExtra}
      </View>

      <View style={styles.keypadContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BankingColors.primary} />
          </View>
        )}

        {keys.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.keyRow}>
            {row.map((key, keyIndex) => {
              if (key === "") {
                return <View key={keyIndex} style={styles.keyEmpty} />;
              }

              if (key === "delete") {
                return (
                  <TouchableOpacity
                    key={keyIndex}
                    style={[styles.keyButton, isLoading && styles.keyHidden]}
                    onPress={() => handlePress("delete")}
                    disabled={isLoading || disabled || pin.length === 0}
                    activeOpacity={0.6}
                    testID="pin-delete"
                  >
                    <Delete
                      size={24}
                      color={
                        pin.length === 0
                          ? BankingColors.textMuted
                          : BankingColors.textPrimary
                      }
                      strokeWidth={1.8}
                    />
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={keyIndex}
                  style={[styles.keyButton, isLoading && styles.keyHidden]}
                  onPress={() => handlePress(key)}
                  disabled={isLoading || disabled}
                  activeOpacity={0.6}
                  testID={`pin-key-${key}`}
                >
                  <TText style={styles.keyText}>{key}</TText>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      <View style={styles.footer}>
        {footerComponent}
        {footerText ? (
          <TText style={styles.footerText}>{footerText}</TText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between" },
  backButton: {
    alignSelf: "flex-start",
    marginLeft: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: -40,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10 },
  header: {
    alignItems: "center",
    paddingTop: Spacing.xl },
  lockIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm },
  subtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xxl },
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: DOT_SPACING,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl },
  dotOuter: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    borderWidth: 2,
    borderColor: BankingColors.textSecondary,
    alignItems: "center",
    justifyContent: "center" },
  dotFilled: {
    width: DOT_SIZE - 4,
    height: DOT_SIZE - 4,
    borderRadius: (DOT_SIZE - 4) / 2,
    backgroundColor: BankingColors.primary },
  keypadContainer: {
    alignItems: "center",
    gap: KEY_GAP },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10 },
  keyHidden: {
    opacity: 0 },
  keyRow: {
    flexDirection: "row",
    gap: KEY_GAP },
  keyButton: {
    width: KEY_SIZE,
    height: KEY_SIZE,
    borderRadius: KEY_SIZE / 2,
    borderWidth: 1,
    borderColor: BankingColors.borderGray,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center" },
  keyEmpty: {
    width: KEY_SIZE,
    height: KEY_SIZE },
  keyText: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.medium,
    color: BankingColors.textPrimary },
  footer: {
    alignItems: "center",
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.md },
  footerText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "center" } });