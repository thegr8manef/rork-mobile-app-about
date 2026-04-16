import React from "react";
import { View, TouchableOpacity, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BankingColors,
  IconSize,
  FontSize,
  FontWeight,
  Spacing,
} from "@/constants";
import { gradientColors } from "@/constants/banking-colors";
import TText from "@/components/TText";
import { useRouter } from "expo-router";
import { FontFamily } from "../../../constants/typography";

type Props = {
  /** Back button action */
  onBack?: () => void;

  /** i18n key */
  tKey?: string;

  /** Raw title */
  title?: string;

  /** Optional right icon */
  rightIcon?: React.ReactNode;

  /** Right icon press */
  onRightPress?: () => void;

  /** Optional container style override */
  style?: ViewStyle;

  /** Toggle back button visibility */
  showBackButton?: boolean;
};

export default function CustomHeader({
  onBack,
  tKey,
  title = "",
  rightIcon,
  onRightPress,
  showBackButton = true,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = onBack ?? (() => router.back());
  return (
    <LinearGradient
      colors={gradientColors as any}
      start={{ x: 1, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.container, { paddingTop: insets.top }, style]}
    >
      <View style={styles.row}>
        {/* LEFT SECTION: Icon or Empty Placeholder */}
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            style={styles.iconButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <ChevronLeft
              size={IconSize.xxl ?? 28}
              color={BankingColors.white}
            />
          </TouchableOpacity>
        ) : (
          /* Invisible view of same width (40) to push title to center */
          <View style={styles.iconButton} />
        )}

        {/* CENTER SECTION: Title */}
        <View style={styles.titleWrap}>
          {tKey ? (
            <TText tKey={tKey} style={styles.title} numberOfLines={1} />
          ) : (
            <TText style={styles.title} numberOfLines={1}>
              {title}
            </TText>
          )}
        </View>

        {/* RIGHT SECTION: Icon or Empty Placeholder */}
        {rightIcon ? (
          <TouchableOpacity
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={10}
            activeOpacity={0.7}
          >
            {rightIcon}
          </TouchableOpacity>
        ) : (
          /* Invisible view of same width (40) to push title to center */
          <View style={styles.iconButton} />
        )}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between", // Ensures items are spread across
    height: 50, // Fixed height for alignment consistency
  },
  iconButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  titleWrap: {
    flex: 1, // Takes up all remaining space
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    color: BankingColors.white,
    fontSize: FontSize.md ?? 16,
    fontFamily: FontFamily.bold,
    textAlign: "center",
  },
});
