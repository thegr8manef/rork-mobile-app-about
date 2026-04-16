import React from "react";
import { View } from "react-native";
import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import { BankingColors, FontFamily } from "@/constants";
import { CheckRecord } from "@/types/cheque.type";
import TText from "@/components/TText";
import CustomButton from "@/components/CustomButton";
import { useTranslation } from "react-i18next";
import { getCurrencyByNumeric } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";

type Props = {
  cheque: CheckRecord;
  isPayer: boolean;
  styles: any;
  isLoading: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  onPreview?: () => void;
};

export default function ChequeCard({
  cheque,
  isPayer,
  styles,
  isLoading,
  formatCurrency,
  formatDate,
  onPreview }: Props) {
  const { t } = useTranslation();

  const getStatusKey = (status: string): string => {
    switch (status) {
      case "PAID":
        return "cheques.status.paid";
      case "CLEARED":
        return "cheques.status.cleared";
      case "PENDING":
        return "cheques.status.pending";
      case "REJECTED":
        return "cheques.status.rejected";
      case "CANCELLED":
        return "cheques.status.cancelled";
      default:
        return "cheques.status.pending";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "CLEARED":
        return "#0A8A5E";
      case "PENDING":
        return BankingColors.primary;
      default:
        return BankingColors.error;
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "CLEARED":
        return "rgba(14, 159, 110, 0.10)";
      case "PENDING":
        return "rgba(246, 68, 39, 0.10)";
      default:
        return "rgba(239, 68, 68, 0.10)";
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    if (status === "PENDING") return <Clock size={20} color={color} />;
    if (status === "PAID" || status === "CLEARED")
      return <CheckCircle size={20} color={color} />;
    return <XCircle size={20} color={color} />;
  };

  const displayName = isPayer ? cheque.draweeName : cheque.remitterName;

  return (
    <View style={styles.chequeCard}>
      {/* ===== Header ===== */}
      <View style={styles.chequeHeader}>
        <View style={styles.chequeInfo}>
          <TText style={styles.chequeNumberLabel}>
            {t("cheques.chequeNumber")}
          </TText>
          <TText
            style={styles.chequeNumber}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {cheque.checkNumber}
          </TText>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusBgColor(cheque.outcome) },
          ]}
        >
          {getStatusIcon(cheque.outcome)}
          <TText
            tKey={getStatusKey(cheque.outcome)}
            style={[
              styles.statusText,
              { color: getStatusColor(cheque.outcome) },
            ]}
            numberOfLines={1}
          />
        </View>
      </View>

      {/* ===== Details ===== */}
      <View style={styles.chequeDetails}>
        {/* name */}
        <View style={styles.detailRow}>
          <TText style={styles.detailLabel}>
            {t(isPayer ? "cheques.beneficiaryName" : "cheques.issuerName")}
          </TText>

          {/* ✅ FIX: show full name (no slice) + allow wrap */}
          <TText
            style={[styles.detailValue, { minWidth: 0, flex: 1 }]}
            numberOfLines={3}
            ellipsizeMode="tail"
          >
            {displayName || "-"}
          </TText>
        </View>

        {/* Date de remise */}
        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="cheques.remittanceDate" />
          <TText
            style={[styles.detailValue, { fontFamily: FontFamily.bold }]}
            numberOfLines={1}
          >
            {formatDate(cheque.remittanceDate)}
          </TText>
        </View>

        {/* Numéro de remise - only for encaisser */}
        {!isPayer && cheque.remittanceNumber && (
          <View style={styles.detailRow}>
            <TText style={styles.detailLabel} tKey="cheques.remittanceNumber" />
            <TText style={styles.detailValue} numberOfLines={1}>
              {cheque.remittanceNumber}
            </TText>
          </View>
        )}

        {/* RIB */}
        <View style={styles.detailRow}>
          <TText
            style={styles.detailLabel}
            tKey={isPayer ? "cheques.beneficiaryRib" : "cheques.issuerRib"}
          />
          <TText style={styles.detailValue} numberOfLines={1}>
            {isPayer ? cheque.draweeRib : cheque.remitterRib}
          </TText>
        </View>

        {/* Montant */}
        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="cheques.amount" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {formatBalance(
              cheque.amount,
              getCurrencyByNumeric(cheque.currency)?.alphaCode ?? "TND",
            )}
          </TText>
        </View>

        {/* Motif - only if rejected */}
        {cheque.outcome === "REJECTED" && cheque.rejectionReason && (
          <View style={styles.detailRow}>
            <TText style={styles.detailLabel} tKey="cheques.rejectionReason" />
            <TText
              style={[styles.detailValue, { color: BankingColors.error }]}
              numberOfLines={3}
              ellipsizeMode="tail"
            >
              {cheque.rejectionReason}
            </TText>
          </View>
        )}
      </View>

      <CustomButton
        tKey="cheques.previewImage"
        onPress={onPreview}
        disabled={!onPreview || isLoading}
        variant="secondary"
        loading={isLoading}
        style={{ borderWidth: 1, borderColor: BankingColors.border }}
      />
    </View>
  );
}
