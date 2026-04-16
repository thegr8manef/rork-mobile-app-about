import React from "react";
import { View, StyleSheet } from "react-native";
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Lock,
  DollarSign,
  Hash,
  Calendar,
} from "lucide-react-native";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  FontFamily,
} from "@/constants";
import { verticalScale } from "@/utils/scale";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface TitreCardProps {
  item: {
    securitiesAccount: string;
    valueCode: string;
    label: string;
    quantity: number;
    blockedQuantity: number;
    marketPrice: number;
    lastPriceEstimate: number;
    unitCostPrice: number;
    costPriceEstimate: number;
    latentProfitLoss: number;
    lastPriceEstimateDate: string;
  };
}

const formatTND = (v: number) => formatBalance(v, "TND");

export default function TitreCard({ item }: TitreCardProps) {
  const { t } = useTranslation();
  const latent = item.latentProfitLoss ?? 0;
  const isPositive = latent >= 0;
  const formatDateFR = (dateString?: string) => {
    if (!dateString) return "-";

    const parts = dateString.split("-");
    if (parts.length !== 3) return "-";

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months start at 0
    const year = parseInt(parts[2], 10);

    const d = new Date(year, month, day);

    if (Number.isNaN(d.getTime())) return "-";

    const selectedLanguage = useAppPreferencesStore(
      (s) => s.selectedLanguage,
    ) as LangChoice;

    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            isPositive ? styles.iconBgGreen : styles.iconBgRed,
          ]}
        >
          {isPositive ? (
            <TrendingUp
              size={22}
              color={BankingColors.secondary}
              strokeWidth={1.8}
            />
          ) : (
            <TrendingDown
              size={22}
              color={BankingColors.error}
              strokeWidth={1.8}
            />
          )}
        </View>
        <View style={styles.headerText}>
          <TText style={styles.titleText} numberOfLines={2}>
            {item.label}
          </TText>
          <View style={styles.refRow}>
            <TText style={styles.refLabel}>{t("portfolio.code")}: </TText>
            <TText style={styles.refValue}>{item.valueCode}</TText>
          </View>
        </View>
      </View>

      <View style={styles.latentBadge}>
        <TText
          style={[
            styles.latentValue,
            {
              color: isPositive ? BankingColors.secondary : BankingColors.error,
            },
          ]}
        >
          {isPositive ? "+" : ""}
          {formatTND(latent)}
        </TText>
        <TText style={styles.latentLabel}>{t("portfolio.latent")}</TText>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailsGrid}>
        <DetailRow
          icon={
            <Hash size={14} color={BankingColors.primary} strokeWidth={2} />
          }
          label={t("portfolio.quantity")}
          value={String(item.quantity ?? 0)}
        />
        <DetailRow
          icon={<Lock size={14} color={BankingColors.error} strokeWidth={2} />}
          label={t("portfolio.blockedQuantity")}
          value={String(item.blockedQuantity ?? 0)}
        />
        <DetailRow
          icon={
            <BarChart3
              size={14}
              color={BankingColors.accentIndigo}
              strokeWidth={2}
            />
          }
          label={t("portfolio.stockPrice")}
          value={formatTND(item.marketPrice ?? 0)}
        />
        <DetailRow
          icon={
            <DollarSign
              size={14}
              color={BankingColors.secondary}
              strokeWidth={2}
            />
          }
          label={t("portfolio.lastPriceEstimate")}
          value={formatTND(item.lastPriceEstimate ?? 0)}
        />
        <DetailRow
          icon={
            <DollarSign
              size={14}
              color={BankingColors.primary}
              strokeWidth={2}
            />
          }
          label={t("portfolio.unitCostPrice")}
          value={formatTND(item.unitCostPrice ?? 0)}
        />
        <DetailRow
          icon={
            <DollarSign
              size={14}
              color={BankingColors.accentBlue}
              strokeWidth={2}
            />
          }
          label={t("portfolio.costPriceEstimate")}
          value={formatTND(item.costPriceEstimate ?? 0)}
        />
        <DetailRow
          icon={
            <Calendar
              size={14}
              color={BankingColors.secondary}
              strokeWidth={2}
            />
          }
          label={t("portfolio.lastPriceEstimateDate")}
          value={formatDateFR(item.lastPriceEstimateDate) ?? "-"}
        />
      </View>
    </View>
  );
}

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIconWrap}>{icon}</View>
      <TText style={styles.detailLabel}>{label}</TText>
      <TText style={styles.detailValueBold}>{value}</TText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: verticalScale(Spacing.lg),
    marginBottom: Spacing.md + 4,
    borderWidth: 1,
    borderColor: BankingColors.border,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBgGreen: {
    backgroundColor: BankingColors.successLight,
  },
  iconBgRed: {
    backgroundColor: BankingColors.errorLight,
  },
  headerText: {
    flex: 1,
  },
  titleText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  refRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  refLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textLabel,
  },
  refValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  latentBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.surfaceSecondary,
  },
  latentValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
  },
  latentLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textLabel,
    fontFamily: FontFamily.medium,
  },
  separator: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginVertical: Spacing.md,
  },
  detailsGrid: {
    gap: Spacing.sm + 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailIconWrap: {
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  detailLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textLabel,
  },
  detailValueBold: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
});
