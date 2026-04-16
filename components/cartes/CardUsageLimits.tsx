import React from "react";
import { View, StyleSheet, Text, Animated, Easing } from "react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import TText from "@/components/TText";
import { moderateScale } from "@/utils/scale";
import { formatBalance } from "@/utils/account-formatters";
import { Card } from "@/types/card.type";

interface CardUsageLimitsProps {
  card: Card;
}

function isFlexCard(card: Card): boolean {
  return card.accounts?.[0]?.accountType?.toString() === "4";
}

export default function CardUsageLimits({ card }: CardUsageLimitsProps) {
  const flex = isFlexCard(card);
  const currency = card?.accounts?.[0]?.currency?.alphaCode ?? "TND";

  const { usedAmount, totalLimit, usagePercentage } = React.useMemo(() => {
    if (flex) {
      const account = card.accounts?.[0];
      const creditLimit = parseFloat(account?.creditLimit ?? "0");
      const available = account?.available ?? 0;

      if (creditLimit <= 0) {
        return { usedAmount: 0, totalLimit: 0, usagePercentage: 0 };
      }

      const used = creditLimit - available;

      return {
        usedAmount: Math.max(0, used),
        totalLimit: creditLimit,
        usagePercentage: Math.min(100, (used / creditLimit) * 100) };
    }

    const total = card.globalLimit ?? 0;
    const remaining = card.globalRemaining ?? 0;
    const used = total - remaining;

    return {
      usedAmount: Math.max(0, used),
      totalLimit: total,
      usagePercentage: total > 0 ? Math.min(100, (used / total) * 100) : 0 };
  }, [card, flex]);

  const barColor =
    usagePercentage > 80
      ? BankingColors.error
      : usagePercentage > 60
      ? "#FF9800"
      : BankingColors.primary;

  const progressAnim = React.useRef(new Animated.Value(0)).current;

  // ✅ track first render so we can start from 0 only once
  const didAnimateOnce = React.useRef(false);

  React.useEffect(() => {
    // If you prefer: only first time start from 0
    if (!didAnimateOnce.current) {
      progressAnim.setValue(0);
      didAnimateOnce.current = true;
    }

    const animation = Animated.timing(progressAnim, {
      toValue: usagePercentage,
      duration: 1600, // ✅ slower
      delay: 250,     // ✅ feels better after skeleton disappears
      easing: Easing.out(Easing.cubic), // smooth & "bank style"
      useNativeDriver: false });

    animation.start();

    return () => {
      animation.stop();
    };
  }, [usagePercentage, progressAnim]);

  const usedText = formatBalance(usedAmount, currency);
  const totalText = formatBalance(totalLimit, currency);

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleWrap}>
          <TText
            style={styles.title}
            tKey="cards.usageRights"
            numberOfLines={1}
            ellipsizeMode="tail"
          />
        </View>

        <Text
          style={styles.amount}
          numberOfLines={1}
          ellipsizeMode="tail"
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {usedText} / {totalText}
        </Text>
      </View>

      <View style={styles.barTrack}>
        <Animated.View
          style={[
            styles.barFill,
            {
              backgroundColor: barColor,
              width: progressAnim.interpolate({
                inputRange: [0, 100],
                outputRange: ["0%", "100%"] }) },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.card },

  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm },

  titleWrap: {
    flex: 1,
    minWidth: 0 },

  title: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },

  amount: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    flexShrink: 0,
    fontVariant: ["tabular-nums"] },

  barTrack: {
    height: moderateScale(6),
    backgroundColor: BankingColors.borderGray,
    borderRadius: moderateScale(99),
    overflow: "hidden" },

  barFill: {
    height: "100%",
    borderRadius: moderateScale(99) } });