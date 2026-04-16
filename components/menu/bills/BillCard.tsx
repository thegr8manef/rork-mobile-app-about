import React from "react";
import { View } from "react-native";
import { CheckCircle, Clock, XCircle } from "lucide-react-native";
import { BankingColors } from "@/constants";
import { BillOfExchangeRecord } from "@/types/bill-of-exchange.type";
import TText from "@/components/TText";
import CustomButton from "@/components/CustomButton";

type Props = {
  bill: BillOfExchangeRecord;
  isPayer: boolean;
  styles: any;
  isLoading: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  onPreview?: () => void;
  onDownload?: () => void;
};

export default function BillCard({
  bill,
  isPayer,
  styles,
  isLoading,
  formatCurrency,
  formatDate,
  onPreview,
  onDownload }: Props) {
  const getStatusKey = (status: string): string => {
    switch (status) {
      case "PAID":
        return "bills.status.paid";
      case "CLEARED":
        return "bills.status.cleared";
      // ✅ PDF: PENDING -> En cours
      case "PENDING":
        return "bills.status.pending";
      // ✅ PDF: IMPAID -> Impayé
      case "IMPAID":
        return "bills.status.unpaid";
      case "REJECTED":
        return "bills.status.rejected";
      case "CANCELLED":
        return "bills.status.cancelled";
      default:
        return "bills.status.pending";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PAID":
      case "CLEARED":
        return BankingColors.success;
      case "PENDING":
        return BankingColors.warning;
      default:
        return BankingColors.error;
    }
  };

  const getStatusIcon = (status: string) => {
    const color = getStatusColor(status);
    if (status === "PENDING") return <Clock size={20} color={color} />;
    if (status === "PAID" || status === "CLEARED")
      return <CheckCircle size={20} color={color} />;
    return <XCircle size={20} color={color} />;
  };

  return (
    <View style={styles.billCard}>
      {/* ===== Header ===== */}
      <View style={styles.billHeader}>
        <View style={styles.billInfo}>
          <TText
            style={styles.billNumber}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {bill.billNumber}
          </TText>

          <TText
            style={styles.beneficiary}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {isPayer ? bill.draweeName || bill.draweeRib : bill.remitterName}
          </TText>
        </View>

        <View style={styles.statusBadge}>
          {getStatusIcon(bill.outcome)}
          <TText
            tKey={getStatusKey(bill.outcome)}
            style={[styles.statusText, { color: getStatusColor(bill.outcome) }]}
            numberOfLines={1}
          />
        </View>
      </View>

      {/* ===== Details ===== */}
      <View style={styles.billDetails}>
        <View style={styles.detailRow}>
          <TText
            style={styles.detailLabel}
            // ✅ PDF: "Banque du tiré" → "Banque du bénéficiaire" for payer
            tKey={isPayer ? "bills.beneficiaryBank" : "bills.remitterBankLabel"}
          />
          <TText style={styles.detailValue} numberOfLines={1}>
            {isPayer
              ? bill.draweeBankCode || "-"
              : bill.remitterBankCode || "-"}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <TText
            style={styles.detailLabel}
            // ✅ PDF: "RIB du tiré" → "RIB du bénéficiaire" for payer
            tKey={isPayer ? "bills.beneficiaryRib" : "bills.remitterRibLabel"}
          />
          <TText style={styles.detailValue} numberOfLines={1}>
            {isPayer ? bill.draweeRib || "-" : bill.remitterRib || "-"}
          </TText>
        </View>

        {/* ✅ PDF: Remove "Numéro de remise" - HIDDEN */}
        {/* <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="bills.remittanceNumber" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {bill.remittanceNumber || "-"}
          </TText>
        </View> */}

        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="bills.remittanceDate" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {formatDate(bill.remittanceDate)}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="bills.instalmentDate" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {formatDate(bill.instalmentDate)}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="bills.billType" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {/* ✅ PDF: Use paymentType.designation instead of type.designation */}
            {bill.paymentType?.designation || "-"}
          </TText>
        </View>

        <View style={styles.detailRow}>
          <TText style={styles.detailLabel} tKey="bills.amount" />
          <TText style={styles.detailValue} numberOfLines={1}>
            {/* ✅ PDF: Show full decimal precision from API */}
            {formatCurrency(+bill.amount, bill.currency.alphaCode)}
          </TText>
        </View>
      </View>

      {/* ✅ PDF: "Télécharger l'image" → "Voir effet" */}
      <CustomButton
        tKey="bills.viewBill"
        onPress={onPreview}
        disabled={!onPreview || isLoading}
        variant="secondary"
        loading={isLoading}
      />
    </View>
  );
}