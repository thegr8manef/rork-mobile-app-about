import React from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import {
  FileText,
  Calendar,
  Coins,
  Landmark,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
  BanknoteArrowUp,
  BanknoteX,
  Banknote,
  Building2,
  User,
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
  IconSize,
} from "@/constants";
import { verticalScale } from "@/utils/scale";
import { getCurrencyByNumeric } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";
import { DepositResponse } from "@/types/deposite.type";

interface DepositCardProps {
  deposit: any;
  index: number;
  onPress: () => void;
}
const getCollateralColor = (isCollateralized: boolean) => {
  switch (isCollateralized) {
    case true:
      return "#34C759";
    case false:
      return "#FF3B30";
    default:
      return "#8E8E93";
  }
};

const getCollateralIcon = (isCollateralized: boolean) => {
  switch (isCollateralized) {
    case true:
      return ShieldCheck;
    case false:
      return ShieldX;
    default:
      return ShieldAlert;
  }
};
const getCollateralLabel = (isCollateralized: boolean) => {
  switch (isCollateralized) {
    case true:
      return "placements.collateral.positive";
    case false:
      return "placements.collateral.negative";
    default:
      return "-";
  }
};
const getSortColor = (Sort: string) => {
  switch (Sort) {
    case "Payé":
      return "#34C759";
    case "Impayé":
      return "#FF3B30";
    default:
      return "#8E8E93";
  }
};

const getSortIcon = (Sort: string) => {
  switch (Sort) {
    case "Payé":
      return BanknoteArrowUp;
    case "Impayé":
      return BanknoteX;
    default:
      return Banknote;
  }
};
const getSortLabel = (Sort: string) => {
  switch (Sort) {
    case "Payé":
      return "placements.sort.positive";
    case "Impayé":
      return "placements.sort.negative";
    default:
      return "-";
  }
};
export default function DepositCard({ deposit, onPress }: DepositCardProps) {
  const { t } = useTranslation();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string) => {
    if (!dateString || dateString === "null") return "-";
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return "-";
    return d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // ✅ Resolve currency ONCE safely
  const currencyObj = getCurrencyByNumeric(deposit?.currency) || null;
  const currencyAlpha = currencyObj?.alphaCode ?? "TND";

  const formattedAmount = formatBalance(deposit?.amount, currencyAlpha);

  const isCertificat = String(deposit?.productName ?? "")
    .toLowerCase()
    .includes("certificat");

  const CollateralIcon = getCollateralIcon(deposit?.isCollateralized);
  const CollateralColor = getCollateralColor(deposit?.isCollateralized);
  const CollateralLabel = getCollateralLabel(deposit?.isCollateralized);

  const isBilletTresorerie = String(deposit?.productName ?? "")
    .toLowerCase()
    .includes("billet de trésorerie");

  const SortIcon = getSortIcon(deposit?.sort ?? "");
  const SortColor = getSortColor(deposit?.sort ?? "");
  const SortLabel = getSortLabel(deposit?.sort ?? "");
  return (
    <TouchableOpacity
      style={styles.depositCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View
          style={[
            styles.iconContainer,
            isCertificat ? styles.iconBg1 : styles.iconBg2,
          ]}
        >
          {isCertificat ? (
            <FileText
              size={22}
              color={BankingColors.primary}
              strokeWidth={1.8}
            />
          ) : (
            <Landmark
              size={22}
              color={BankingColors.accentIndigo}
              strokeWidth={1.8}
            />
          )}
        </View>

        <View style={styles.headerText}>
          <TText style={styles.depositTitle} numberOfLines={1}>
            {deposit?.productName ?? "-"}
          </TText>

          <View style={styles.refRow}>
            <TText style={styles.refLabel}>
              <TText tKey="placements.reference" />:{" "}
            </TText>
            <TText style={styles.refValue}>{deposit?.tdNumber ?? "-"}</TText>
          </View>
        </View>
      </View>

      <View style={styles.separator} />

      <View style={styles.detailsGrid}>
        <View style={styles.accountRow}>
          <TText style={styles.accountLabel}>
            {t("placements.accountNumber")}:
          </TText>
          <TText style={styles.accountValue}>
            {deposit?.accountNumber ?? "-"}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Coins size={14} color={BankingColors.primary} strokeWidth={2} />
          </View>
          <TText tKey="placements.amount" style={styles.detailLabel} />
          <TText style={styles.detailValueBold}>{formattedAmount}</TText>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Calendar
              size={14}
              color={BankingColors.secondary}
              strokeWidth={2}
            />
          </View>
          <TText tKey="placements.executionDate" style={styles.detailLabel} />
          <TText style={styles.detailValueBold}>
            {formatDate(deposit?.executionDate)}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <Calendar size={14} color={BankingColors.error} strokeWidth={2} />
          </View>
          <TText tKey="placements.maturityDate" style={styles.detailLabel} />
          <TText style={styles.detailValueBold}>
            {formatDate(deposit?.maturityDate)}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <View style={styles.detailIconWrap}>
            <CollateralIcon size={14} color={CollateralColor} />
          </View>
          <TText tKey="placements.nantissement" style={styles.detailLabel} />
          <TText style={styles.detailValueBold}>{t(CollateralLabel!!)}</TText>
        </View>
        {isBilletTresorerie && (
          <>
            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <Building2 size={14} color={BankingColors.accentIndigo} strokeWidth={2} />
              </View>
              <TText tKey="placements.emetteur" style={styles.detailLabel} />
              <TText style={styles.detailValueBold}>
                {deposit?.transmitter ?? "-"}
              </TText>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <User size={14} color={BankingColors.secondary} strokeWidth={2} />
              </View>
              <TText tKey="placements.souscripteur" style={styles.detailLabel} />
              <TText style={styles.detailValueBold}>
                {deposit?.subscriber ?? "-"}
              </TText>
            </View>

            <View style={styles.detailRow}>
              <View style={styles.detailIconWrap}>
                <SortIcon size={14} color={SortColor} strokeWidth={2} />
              </View>
              <TText tKey="placements.sort" style={styles.detailLabel} />
              <TText style={[styles.detailValueBold, { color: SortColor }]}>
                {deposit?.sort ? t(SortLabel) : "-"}
              </TText>
            </View>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  depositCard: {
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

  iconBg1: { backgroundColor: BankingColors.iconBgOrange },
  iconBg2: { backgroundColor: BankingColors.iconBgIndigo },

  headerText: { flex: 1 },

  depositTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2,
  },

  refRow: { flexDirection: "row", alignItems: "center" },
  refLabel: { fontSize: FontSize.sm, color: BankingColors.textLabel },
  refValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  separator: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginVertical: Spacing.md,
  },

  detailsGrid: { gap: Spacing.sm + 2 },

  accountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },

  accountLabel: { fontSize: FontSize.sm, color: BankingColors.textLabel },
  accountValue: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
  },

  detailRow: { flexDirection: "row", alignItems: "center", gap: 6 },

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
