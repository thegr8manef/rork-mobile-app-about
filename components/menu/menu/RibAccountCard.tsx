import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  Eye,
  EyeOff,
  ChevronRight,
  Landmark,
  PiggyBank } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

import { BankingColors, Spacing, BorderRadius, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import type { Account } from "@/types/account.type";

type Props = {
  account: Account;
  showBalance: boolean;
  onToggleBalance: () => void;
  onPress: (accountId: string) => void;
};

// ─── Helpers ────────────────────────────────────────────────
function formatBalance(amount: string | undefined | null, alphaCode = "TND"): string {
  if (!amount) return "0,000";
  const numeric = parseFloat(amount);
  if (isNaN(numeric)) return "0,000";
  const decimals = alphaCode === "TND" ? 3 : 2;
  const parts = numeric.toFixed(decimals).split(".");
  const intPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `${intPart},${parts[1]}`;
}

function maskBalance(): string {
  return "••• •••,•••";
}

/**
 * Detect savings account from multiple possible indicators:
 * - accountClass.code === 5
 * - accountLabel contains "EPARGNE"
 * - chapter starts with "5"
 */
function isSavings(account: Account): boolean {
  if (account.accountClass?.code === 5) return true;
  const label = account.accountLabel?.toUpperCase() ?? "";
  if (label.includes("EPARGNE") || label.includes("SAVINGS")) return true;
  if (account.chapter?.startsWith("5")) return true;
  return false;
}

// ─── Component ──────────────────────────────────────────────
export default function RibAccountCard({
  account,
  showBalance,
  onToggleBalance,
  onPress }: Props) {
  const { t } = useTranslation();
  const savings = isSavings(account);
  const currency = account.currencyAccount?.alphaCode || "TND";

  const accentColors: [string, string] = savings
    ? ["#0D9488", "#14B8A6"]
    : [BankingColors.primary, "#E68A00"];

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(account.id)}
      style={styles.card}
    >
      {/* Left accent stripe */}
      <LinearGradient
        colors={accentColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.accentStripe}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* ── Top row: icon + account info + eye ──────────── */}
        <View style={styles.topRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: savings ? "#F0FDFA" : "#FFF7ED" },
            ]}
          >
            {savings ? (
              <PiggyBank size={20} color="#0D9488" />
            ) : (
              <Landmark size={20} color={BankingColors.primary} />
            )}
          </View>

          <View style={styles.accountInfo}>
            <TText style={styles.accountName} numberOfLines={2}>
              {account.accountLabel || account.accountTitle || t("rib.myAccount")}
            </TText>
            <TText style={styles.accountTypeTxt} numberOfLines={1}>
              {account.accountType?.designation || "—"}
            </TText>
          </View>

          <TouchableOpacity
            onPress={onToggleBalance}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            style={styles.eyeBtn}
            activeOpacity={0.6}
          >
            {showBalance ? (
              <Eye size={18} color={BankingColors.textSecondary} />
            ) : (
              <EyeOff size={18} color={BankingColors.textSecondary} />
            )}
          </TouchableOpacity>
        </View>

        {/* ── RIB row ────────────────────────────────────── */}
        <View style={styles.ribRow}>
          <View style={styles.ribBadge}>
            <TText style={styles.ribBadgeText} tKey="common.rib" />
          </View>
          <TText style={styles.ribValue} numberOfLines={1}>
            {account.ribFormatAccount || account.accountRib || "---"}
          </TText>
        </View>

        {/* ── Divider ────────────────────────────────────── */}
        <View style={styles.divider} />

        {/* ── Bottom row: balance + chevron ───────────────── */}
        <View style={styles.bottomRow}>
          <View style={styles.balanceBlock}>
            <TText style={styles.balanceLabel}>
              {t("rib.availableBalance")}
            </TText>
            <View style={styles.balanceValueRow}>
              <TText style={styles.balanceAmount}>
                {showBalance
                  ? formatBalance(account.availableBalance, currency)
                  : maskBalance()}
              </TText>
              <TText style={styles.currency}>{currency}</TText>
            </View>
          </View>

          <View style={styles.chevronCircle}>
            <ChevronRight size={16} color={BankingColors.textSecondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
    overflow: "hidden" },

  accentStripe: {
    width: 5 },

  content: {
    flex: 1,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg },

  // ── Top row ───────────────────────────────────────────────
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },

  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0 },

  accountInfo: {
    flex: 1,
    marginRight: Spacing.sm },

  accountName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    letterSpacing: -0.2 },

  accountTypeTxt: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 2 },

  eyeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.03)",
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0 },

  // ── RIB row ───────────────────────────────────────────────
  ribRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.md },

  ribBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    flexShrink: 0 },

  ribBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    letterSpacing: 0.8 },

  ribValue: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.5 },

  // ── Divider ───────────────────────────────────────────────
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: Spacing.md },

  // ── Bottom row ────────────────────────────────────────────
  bottomRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between" },

  balanceBlock: {
    flex: 1 },

  balanceLabel: {
    fontSize: 11,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    letterSpacing: 0.3,
    textTransform: "uppercase",
    marginBottom: 3 },

  balanceValueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 5 },

  balanceAmount: {
    fontSize: 24,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.textPrimary,
    letterSpacing: -0.3,
    fontVariant: ["tabular-nums"] },

  currency: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },

  chevronCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: Spacing.md,
    flexShrink: 0 } });