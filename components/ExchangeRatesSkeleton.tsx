import React, { useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, Animated, ScrollView } from "react-native";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  Shadow,
  FontSize,
  FontFamily,
} from "@/constants";
import TText from "@/components/TText";
import { formatLocalizedDate } from "@/utils/date-locale";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Props = {
  count?: number;
  activeTab?: "" | "BBE";
};

const useShimmerOpacity = () => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  return anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.25, 0.75],
  });
};

// keep same visual rows as your screen
const CURRENCIES = [
  { code: "EUR", name: "EURO", flag: "🇪🇺" },
  { code: "USD", name: "DOLLAR DES USA", flag: "🇺🇸" },
  { code: "GBP", name: "LIVRE STERLING", flag: "🇬🇧" },
  { code: "DKK", name: "COURONNE DANOISE", flag: "🇩🇰" },
  { code: "JPY", name: "YEN JAPONAIS", flag: "🇯🇵" },
  { code: "NOK", name: "COURONNE NORVEGIENNE", flag: "🇳🇴" },
];

function ExchangeRateRowSkeleton({
  currency,
  opacity,
}: {
  currency: { code: string; name: string; flag: string };
  opacity: Animated.AnimatedInterpolation<string | number>;
}) {
  return (
    <View style={styles.rateRow}>
      {/* LEFT: real flag + texts */}
      <View style={styles.currencyColumn}>
        <TText style={styles.flagText}>{currency.flag}</TText>
        <View style={styles.currencyInfo}>
          <TText style={styles.currencyCode}>{currency.code}</TText>
          <TText style={styles.currencyName} numberOfLines={1}>
            {currency.name}
          </TText>
        </View>
      </View>

      {/* RIGHT: ONLY skeleton for buy/sell */}
      <View style={styles.rateColumn}>
        <Animated.View style={[styles.rateSkeleton, { opacity }]} />
      </View>
      <View style={styles.rateColumn}>
        <Animated.View style={[styles.rateSkeleton, { opacity }]} />
      </View>
      <View style={styles.rateColumn}>
        <Animated.View style={[styles.rateSkeleton, { opacity }]} />
      </View>
    </View>
  );
}

export default function ExchangeRatesSkeleton({
  count = 6,
  activeTab = "",
}: Props) {
  const opacity = useShimmerOpacity();
  const items = useMemo(() => CURRENCIES.slice(0, count), [count]);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const todayFR = useMemo(() => {
    return new Date().toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.infoBox}>
        <TText style={styles.infoSubtext} tKey="exchangeRates.disclaimer" />
      </View>
      {/* Header card */}
      <View style={styles.headerCard}>
        {/* Date line (uses your same tKey + today) */}
        <TText style={styles.dateText}>
          <TText tKey="exchangeRates.rateDate" /> {todayFR}
        </TText>

        {/* Tabs with translated labels */}
        <View style={styles.tabsContainer}>
          <View style={[styles.tab, activeTab === "BBE" && styles.activeTab]}>
            <TText
              style={[
                styles.tabText,
                activeTab === "BBE" && styles.activeTabText,
              ]}
              tKey="exchangeRates.cashRate"
            />
          </View>
          <View style={[styles.tab, activeTab === "" && styles.activeTab]}>
            <TText
              style={[styles.tabText, activeTab === "" && styles.activeTabText]}
              tKey="exchangeRates.accountRate"
            />
          </View>
        </View>
      </View>

      {/* Table header (translated) */}
      <View style={styles.tableHeader}>
        <View style={styles.currencyColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.currency" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.unit" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.buy" />
        </View>
        <View style={styles.rateColumn}>
          <TText style={styles.tableHeaderText} tKey="exchangeRates.sell" />
        </View>
      </View>

      <View style={styles.divider} />

      {/* List */}
      <View style={styles.listCard}>
        {items.map((c) => (
          <ExchangeRateRowSkeleton
            key={c.code}
            currency={c}
            opacity={opacity}
          />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { paddingBottom: Spacing.xl },
  infoBox: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary,
  },
  infoSubtext: {
    color: BankingColors.textSecondary,
    lineHeight: 16,
  },
  headerCard: {
    backgroundColor: BankingColors.surface,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    ...Shadow.card,
  },

  dateText: {
    textAlign: "center",
    color: BankingColors.textSecondary,
    marginBottom: Spacing.md,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },

  tabsContainer: {
    flexDirection: "row",
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.xs / 2,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
  },
  activeTab: { backgroundColor: BankingColors.primary },
  tabText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  activeTabText: {
    color: BankingColors.surface,
    fontFamily: FontFamily.extrabold,
  },

  tableHeader: {
    flexDirection: "row",
    backgroundColor: BankingColors.surface,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  tableHeaderText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.text,
    textAlign: "center",
  },
  divider: {
    height: 2,
    backgroundColor: BankingColors.primary,
    marginBottom: Spacing.xs,
  },

  listCard: { backgroundColor: BankingColors.surface },

  rateRow: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
    alignItems: "center",
  },

  currencyColumn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
  },
  flagText: { fontSize: 32, marginRight: Spacing.md },
  currencyInfo: { flex: 1 },
  currencyCode: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  currencyName: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
  },

  rateColumn: { flex: 1, alignItems: "center" },
  rateSkeleton: {
    width: 64,
    height: 18,
    borderRadius: BorderRadius.sm,
    backgroundColor: BankingColors.border,
  },
});
