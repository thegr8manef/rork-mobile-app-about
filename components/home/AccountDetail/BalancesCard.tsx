import React from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  Wallet,
  BadgeDollarSign,
  ShieldCheck,
  CalendarClock,
  BookmarkMinus } from "lucide-react-native";
import { amountFormatter } from "@/utils/amountFormatter";

import { BankingColors,
  BorderRadius,
  FontSize,
  Shadow,
  Spacing, FontFamily } from "@/constants";
import { SelectableAccount } from "@/types/selectable-account";
import { formatBalance } from "@/utils/account-formatters";
import TText from "@/components/TText";

type Props = {
  styles: any;
  account: SelectableAccount;
};

const formatDateOnly = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

type BalanceRowProps = {
  icon: React.ReactNode;
  iconBg: string;
  labelKey: string;
  value: string;
  valueColor?: string;
  isLast?: boolean;
};

function BalanceRow({
  icon,
  iconBg,
  labelKey,
  value,
  valueColor,
  isLast }: BalanceRowProps) {
  return (
    <>
      <View style={localStyles.row}>
        <View style={localStyles.rowLeft}>
          <View style={[localStyles.rowIcon, { backgroundColor: iconBg }]}>
            {icon}
          </View>
          <TText style={localStyles.rowLabel} tKey={labelKey} numberOfLines={2} />
        </View>
        <Text
          style={[
            localStyles.rowValue,
            valueColor ? { color: valueColor } : undefined,
          ]}
          numberOfLines={1}
        >
          {value}
        </Text>
      </View>
      {!isLast && <View style={localStyles.divider} />}
    </>
  );
}

export default function BalancesCard({ styles, account }: Props) {
  
  return (
    <View>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <View style={styles.iconContainer}>
            <Wallet size={20} color={BankingColors.primary} />
          </View>
          <TText style={styles.sectionTitle} tKey="accountDetails.balances" />
        </View>
      </View>

      <View style={localStyles.card}>
        <BalanceRow
          icon={<Wallet size={Spacing.lg} color={BankingColors.primary} />}
          iconBg={BankingColors.primaryLight + "20"}
          labelKey="accountDetails.availableBalance"
          value={formatBalance(
            account.availableBalance,
            account.currencyAlphaCode,
          )}
          valueColor={BankingColors.success}
        />

        <BalanceRow
          icon={<BadgeDollarSign size={18} color="#0066CC" />}
          iconBg={BankingColors.actionBlue}
          labelKey="accountDetails.accountBalance"
          value={formatBalance(
            account.indicativeBalance ?? "0",
            account.currencyAlphaCode,
          )}
        />

        <BalanceRow
          icon={<ShieldCheck size={18} color="#FF9500" />}
          iconBg={BankingColors.actionOrange}
          labelKey="accountDetails.overdraftAuthorization"
          value={
            account.overDraftLimitValue && account.overDraftLimitValue !== "-"
              ? formatBalance(
                  account.overDraftLimitValue ?? "0",
                  account.currencyAlphaCode,
                )
              : "-"
          }
        />

        <BalanceRow
          icon={<CalendarClock size={18} color="#9C27B0" />}
          iconBg={BankingColors.actionPurple}
          labelKey="accountDetails.overdraftExpiry"
          value={formatDateOnly(account.overDraftExpiryDate)}
        />

        <BalanceRow
          icon={<BookmarkMinus size={18} color="#E53935" />}
          iconBg={BankingColors.actionRed}
          labelKey="accountDetails.fundReservation"
          value={
            account.fundReservation === "0.000"
              ? "-"
              : formatBalance(
                  account.fundReservation ?? "0",
                  account.currencyAlphaCode,
                )
          }
          isLast
        />
      </View>
    </View>
  );
}

const localStyles = StyleSheet.create({
  card: {
  backgroundColor: BankingColors.white,
  borderRadius: BorderRadius.xl,
  paddingHorizontal: Spacing.lg,
  paddingVertical: Spacing.sm,  // was Spacing.lg
  ...Shadow.sm },
  row: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingVertical: Spacing.sm,  // was Spacing.md
  gap: Spacing.sm },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: Spacing.sm },
  rowIcon: {
  width: 32,   // was 36
  height: 32,  // was 36
  borderRadius: 8,  // was 10
  justifyContent: "center",
  alignItems: "center" },
  rowLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    flex: 1 },
  rowValue: {
  fontSize: FontSize.sm,  // was FontSize.base
  fontFamily: FontFamily.bold,
  color: BankingColors.text,
  flexShrink: 0 },
  divider: {
    height: 1,
    backgroundColor: "#F0F3F8" } });