import React, { useMemo, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from "react-native";
import { ChevronRight, Calendar, Banknote } from "lucide-react-native";
import { router } from "expo-router";
import { t } from "i18next";

import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  FontFamily,
} from "@/constants";

import { Loan } from "@/types/ioans.type";
import { verticalScale } from "react-native-size-matters";
import { horizontalScale, moderateScale } from "@/utils/scale";
import { width as screenWidth } from "@/constants/size-scale";

import { CircularProgress } from "@/components/menu/loans/CircularProgress";
import { getLoanProgressFromList } from "@/utils/loan-progress";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface LoanCardProps {
  loan: Loan;

  // ✅ optional onPress
  onPress?: () => void;
}

const CIRCLE_SIZE = moderateScale(Math.min(screenWidth * 0.28, 120), 0.3);
const CIRCLE_STROKE = moderateScale(6, 0.3);

export default function LoanCard({ loan, onPress }: LoanCardProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const { totalMonths, remainingMonths } = useMemo(() => {
    return getLoanProgressFromList(
      loan.duration,
      loan.installmentDetails?.numberRemainingInstallments,
    );
  }, [loan.duration, loan.installmentDetails?.numberRemainingInstallments]);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const defaultPress = () => {
    router.navigate({
      pathname: "/loan-details",
      params: { loanId: loan.id },
    });
  };

  const handlePress = () => {
    // ✅ use external handler if provided
    if (onPress) return onPress();
    return defaultPress();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        style={styles.container}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        testID={`loan-card-${loan.id}`}
      >
        <View style={styles.content}>
          <CircularProgress
            remainingMonths={remainingMonths}
            totalMonths={totalMonths}
            size={CIRCLE_SIZE}
            strokeWidth={CIRCLE_STROKE}
          />

          <View style={styles.details}>
            <Text
              style={styles.loanName}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {loan.loanType?.label ?? "—"}
            </Text>

            <Text
              style={styles.reference}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {t("loans.ref")} {loan.fileNumber}
            </Text>

            <View style={styles.infoRow}>
              <View style={styles.labelRow}>
                <Calendar
                  size={IconSize.xs}
                  color={BankingColors.loanLabelText}
                  style={styles.infoIcon}
                />
                <Text style={styles.label}>{t("loans.releaseDate")}</Text>
              </View>
              <Text style={styles.value}>{formatDate(loan.unlockDate)}</Text>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.labelRow}>
                <Banknote
                  size={IconSize.xs}
                  color={BankingColors.loanLabelText}
                  style={styles.infoIcon}
                />
                <Text style={styles.label}>{t("loans.principalAmount")}</Text>
              </View>
              <Text style={styles.value} numberOfLines={1} ellipsizeMode="tail">
                {formatBalance(loan.loanAmount, loan.currency?.alphaCode ?? "TND")}
              </Text>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <ChevronRight
              size={IconSize.lg}
              color={BankingColors.text}
              strokeWidth={2.5}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: verticalScale(Spacing.lg),
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    paddingHorizontal: horizontalScale(Spacing.sm),
    ...Shadow.md,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  details: {
    flex: 1,
    minWidth: 0,
  },
  loanName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
    textTransform: "uppercase",
  },
  reference: {
    fontSize: FontSize.sm,
    color: BankingColors.loanLabelText,
    marginBottom: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    gap: Spacing.xs,
    flexShrink: 1,
    flexWrap: "wrap",
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
  },
  infoIcon: {
    marginRight: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    color: BankingColors.loanLabelText,
  },
  value: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    flexShrink: 0,
    maxWidth: "100%" as unknown as number,
  },
  arrowContainer: {
    marginLeft: Spacing.md,
    justifyContent: "center",
    flexShrink: 0,
  },
});
