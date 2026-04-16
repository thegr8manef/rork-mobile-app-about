import React, { useEffect } from "react";
import {
  View,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  LayoutAnimation } from "react-native";
import { ArrowUpRight, Eye, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { BankingColors } from "@/constants/banking-colors";
import TText from "@/components/TText";

import type { UITransfer } from "../types";
import { FontFamily } from "@/constants";
import {
  formatCurrency,
  formatDateJjMoisYyyy,
  getStatusColor,
  getStatusText } from "../utils";

type Props = {
  transfer: UITransfer;
  onOpen: (tr: UITransfer) => void;
  onCancel?: (tr: UITransfer) => void;
  canCancel?: boolean;
  cancelling?: boolean;
};

export default function TransferHistoryRow({
  transfer,
  onOpen,
  onCancel,
  canCancel = false,
  cancelling = false }: Props) {
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [canCancel]);
  const { t, i18n } = useTranslation();
  const locale =
    (i18n.language || "fr").split("-")[0] === "en" ? "en-US" : "fr-FR";

  const showDeferredBadge =
    transfer.transferTypeUi === "ponctuel" && transfer.nature === "deferred";

  return (
    <View style={styles.transferCard}>
      <View style={styles.transferHeader}>
        <View style={styles.transferIcon}>
          <ArrowUpRight size={18} color={BankingColors.error} />
        </View>

        <View style={styles.transferContent}>
          <TText style={styles.title} numberOfLines={1}>
            {transfer.displayTitle}
          </TText>

          {!!transfer.displaySubtitle && (
            <TText style={styles.subtitle} numberOfLines={1}>
              {transfer.displaySubtitle}
            </TText>
          )}
        </View>

        <View style={styles.right}>
          <TText style={styles.amount} numberOfLines={1}>
            -{formatCurrency(transfer.amount, transfer.currency)}
          </TText>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(transfer.status) },
              ]}
            />
            <TText style={styles.statusText} numberOfLines={1} tKey={getStatusText(transfer.status)}>
      
            </TText>
          </View>
        </View>
      </View>

      <View style={styles.metaRow}>
        <TText style={styles.smallDate} numberOfLines={1}>
          {formatDateJjMoisYyyy(transfer.executionDateISO, locale)}
        </TText>

        {showDeferredBadge && (
          <View style={styles.badge}>
            <TText style={styles.badgeText}>
              {t("transferHistory.badge.deferred", "Différé")}
            </TText>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionBtn, styles.viewBtn]}
          onPress={() => onOpen(transfer)}
        >
          <Eye size={16} color={BankingColors.primary} />
          <TText style={styles.viewText}>{t("common.view", "Consulter")}</TText>
        </TouchableOpacity>

        {canCancel && !!onCancel && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.viewBtn]}
            onPress={() => onCancel(transfer)}
            disabled={cancelling}
            activeOpacity={0.7}
          >
            {cancelling ? (
              <ActivityIndicator size="small" color={BankingColors.primary} />
            ) : (
              <X size={16} color={BankingColors.primary} />
            )}

            <TText style={styles.viewText}>
              {cancelling
                ? t("common.loading", "Chargement")
                : t("common.cancel", "Annuler")}
            </TText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  transferCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.9,
    shadowRadius: 3,
    elevation: 2 },
  transferHeader: { flexDirection: "row", alignItems: "center" },
  transferIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.error + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10 },
  transferContent: { flex: 1, minWidth: 0 },
  title: { fontSize: 14, fontFamily: FontFamily.semibold, color: BankingColors.text },
  subtitle: {
    marginTop: 2,
    fontSize: 12,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary },

  right: { alignItems: "flex-end", marginLeft: 10 },
  amount: { fontSize: 14, fontFamily: FontFamily.semibold, color: BankingColors.text },
  statusRow: {
    marginTop: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, color: BankingColors.textSecondary },

  metaRow: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10 },
  smallDate: { fontSize: 11, color: BankingColors.textLight },

  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BankingColors.primary + "12",
    borderWidth: 1,
    borderColor: BankingColors.primary + "25" },
  badgeText: { fontSize: 11, color: BankingColors.primary, fontFamily: FontFamily.semibold },

  actions: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    flexDirection: "row",
    gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10 },
  viewBtn: { backgroundColor: BankingColors.background },
  viewText: { fontSize: 13, fontFamily: FontFamily.semibold, color: BankingColors.primary },
  cancelBtn: { backgroundColor: "#EF4444" },
  cancelText: { fontSize: 13, fontFamily: FontFamily.bold, color: "#FFFFFF" } });
