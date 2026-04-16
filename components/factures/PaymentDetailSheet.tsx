// components/factures/PaymentDetailSheet.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  Download,
  Share2,
  Eye,
  X,
  FileText,
  CheckCircle,
} from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";

import TText from "@/components/TText";
import {
  BankingColors,
  BorderRadius,
  FontSize,
  Spacing,
  FontFamily,
} from "@/constants";

import type { BillPayment } from "@/types/bill-payment.types";
import { getFacturePdfBase64 } from "@/services/account.api";
import { formatBalance } from "@/utils/account-formatters";
import {
  savePdfBase64ToAppDir,
  savePdfToDownloads,
} from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Props = {
  visible: boolean;
  payment: BillPayment | null;
  billerLabel?: string;
  initialSavedUri?: string | null;
  onClose: () => void;
};

const getStatusLabel = (status?: string | null, t?: any) => {
  switch (status) {
    case "PAID":
      return t?.("bills.success") ?? "Payé";
    case "REJECTED":
      return t?.("bills.failed") ?? "Rejeté";
    case "INIT":
      return t?.("bills.inProgress") ?? "En cours";
    default:
      return status || "-";
  }
};

const getStatusColor = (status?: string | null) => {
  switch (status) {
    case "PAID":
      return BankingColors.success;
    case "REJECTED":
      return BankingColors.error;
    case "INIT":
      return BankingColors.warning;
    default:
      return BankingColors.textSecondary;
  }
};

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.detailRow}>
      <TText style={styles.detailLabel} numberOfLines={2}>
        {label}
      </TText>
      <TText style={styles.detailValue} numberOfLines={3}>
        {value && value.trim() !== "" ? value : "-"}
      </TText>
    </View>
  );
}

export default function PaymentDetailSheet({
  visible,
  payment,
  billerLabel,
  initialSavedUri,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const sheetRef = useRef<BottomSheetModal>(null);
  const { showComplete } = useDownloadNotification();
  const snapPoints = useMemo(() => ["70%", "90%"], []);
  const { showMessageError } = useShowMessage();

  const [isDownloading, setIsDownloading] = useState(false);
  const [savedPdfUri, setSavedPdfUri] = useState<string | null>(null);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  useEffect(() => {
    if (visible) {
      sheetRef.current?.present();
      setSavedPdfUri(initialSavedUri ?? null);
    } else {
      sheetRef.current?.dismiss();
    }
  }, [visible, initialSavedUri]);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    [],
  );

  const status = (payment as any)?.transactionStatus as string | undefined;
  const statusColor = getStatusColor(status);
  const amount = parseFloat(
    payment?.paymentAmount || payment?.requestedAmount || "0",
  );
  const isPaid = status === "PAID";

  // ── Download ──────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!payment?.id || isDownloading) return;

    if (!isPaid) {
      showMessageError("bills.viewPdf.loadErrorInvalidStatus");
      return;
    }

    const { granted } = await requestStoragePermission();
    if (!granted) return;

    setIsDownloading(true);
    try {
      const base64 = await getFacturePdfBase64(payment.id);

      const downloadUri = await savePdfToDownloads(
        base64,
        `facture_${payment.id}.pdf`,
      );
      const appUri = await savePdfBase64ToAppDir(
        base64,
        `facture_${payment.id}.pdf`,
      );

      setSavedPdfUri(appUri);

      await showComplete(
        t("bills.download.savedTitle", "Reçu enregistré"),
        t(
          "bills.download.savedDesc",
          "Le reçu a été enregistré dans vos téléchargements.",
        ),
        downloadUri,
      );
    } catch (e) {
      showMessageError("pdf.downloadErrorMessage");
    } finally {
      setIsDownloading(false);
    }
  }, [payment?.id, isDownloading, t, showComplete]);

  // ── Share ─────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (isDownloading) return;

    if (!isPaid) {
      showMessageError("bills.viewPdf.loadErrorInvalidStatus");
      return;
    }

    if (!savedPdfUri) {
      if (!payment?.id) return;

      setIsDownloading(true);
      try {
        const base64 = await getFacturePdfBase64(String(payment.id));
        const appUri = await savePdfBase64ToAppDir(
          base64,
          `facture_${payment.id}.pdf`,
        );
        setSavedPdfUri(appUri);

        const available = await Sharing.isAvailableAsync();
        if (!available) return;

        await Sharing.shareAsync(appUri, {
          mimeType: "application/pdf",
          dialogTitle: t("bills.share.dialogTitle", "Partager le reçu"),
          UTI: "com.adobe.pdf",
        });
      } catch (e) {
        showMessageError("pdf.downloadErrorMessage");
      } finally {
        setIsDownloading(false);
      }
      return;
    }

    const available = await Sharing.isAvailableAsync();
    if (!available) return;

    await Sharing.shareAsync(savedPdfUri, {
      mimeType: "application/pdf",
      dialogTitle: t("bills.share.dialogTitle", "Partager le reçu"),
      UTI: "com.adobe.pdf",
    });
  }, [savedPdfUri, payment?.id, isDownloading, t]);

  // ── View PDF ──────────────────────────────────────────────────────

  const handleViewPdf = useCallback(() => {
    if (!payment?.id) return;
    onClose();
    router.push({
      pathname: "/(root)/(tabs)/(factures)/facture-view-pdf",
      params: {
        paymentId: payment.id,
        paymentStatus: payment.transactionStatus,
      },
    });
  }, [payment?.id, payment?.transactionStatus, onClose]);

  if (!payment) return null;

  return (
    <BottomSheetModal
      ref={sheetRef}
      snapPoints={snapPoints}
      enableDynamicSizing={false}
      onDismiss={onClose}
      enablePanDownToClose
      backdropComponent={renderBackdrop}
      backgroundStyle={styles.sheetBackground}
      handleIndicatorStyle={styles.handleIndicator}
    >
      <View style={styles.header}>
        <TText style={styles.title}>
          {t("bills.detail.title", "Détail du paiement")}
        </TText>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={22} color={BankingColors.text} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status + amount */}
        <View style={styles.statusRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "15" },
            ]}
          >
            <View
              style={[styles.statusDot, { backgroundColor: statusColor }]}
            />
            <TText style={[styles.statusLabel, { color: statusColor }]}>
              {getStatusLabel(status, t)}
            </TText>
          </View>

          <TText style={styles.amountBig}>{formatBalance(amount, "TND")}</TText>
        </View>

        {/* Detail card with icon + rows + actions */}
        <View style={styles.detailsCard}>
          {/* Icon */}
          <View style={styles.cardIconWrap}>
            <View style={styles.cardIconCircle}>
              <FileText size={22} color={BankingColors.primary} />
            </View>
          </View>

          {/* Detail rows */}
          <DetailRow
            label={t("bills.detail.biller", "Facturier")}
            value={billerLabel || t("bills.unknownBiller")}
          />
          <DetailRow
            label={t("bills.detail.reference", "Référence")}
            value={payment.objectReference || payment.objectId || "-"}
          />
          <DetailRow
            label={t("bills.detail.date", "Date")}
            value={formatDate(payment.paymentDate)}
          />
          <DetailRow
            label={t("bills.detail.amount", "Montant")}
            value={formatBalance(amount, "TND")}
          />
          <DetailRow
            label={t("bills.detail.status", "Statut")}
            value={getStatusLabel(status, t)}
          />

          {/* Action buttons inside the card */}
          {isPaid ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  !!savedPdfUri && styles.actionBtnDisabled,
                ]}
                onPress={handleDownload}
                disabled={isDownloading || !!savedPdfUri}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconCircle}>
                  {isDownloading ? (
                    <ActivityIndicator
                      size="small"
                      color={BankingColors.primary}
                    />
                  ) : savedPdfUri ? (
                    <CheckCircle size={18} color={BankingColors.success} />
                  ) : (
                    <Download size={18} color={BankingColors.primary} />
                  )}
                </View>
                <TText
                  style={[
                    styles.actionLabel,
                    !!savedPdfUri && { color: BankingColors.success },
                  ]}
                >
                  {savedPdfUri
                    ? t("common.downloaded") || "Téléchargé"
                    : t("common.download")}
                </TText>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  isDownloading && styles.actionBtnDisabled,
                ]}
                onPress={handleShare}
                disabled={isDownloading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconCircle}>
                  <Share2 size={18} color={BankingColors.primary} />
                </View>
                <TText style={styles.actionLabel}>{t("common.share")}</TText>
              </TouchableOpacity>

              <View style={styles.actionDivider} />

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  isDownloading && styles.actionBtnDisabled,
                ]}
                onPress={handleViewPdf}
                disabled={isDownloading}
                activeOpacity={0.7}
              >
                <View style={styles.actionIconCircle}>
                  <Eye size={18} color={BankingColors.primary} />
                </View>
                <TText style={styles.actionLabel}>{t("common.viewPdf")}</TText>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.invalidStatusNote}>
              <TText style={styles.invalidStatusText}>
                {t(
                  "bills.viewPdf.loadErrorInvalidStatus",
                  "Le reçu n'est pas disponible car ce paiement n'est pas encore finalisé.",
                )}
              </TText>
            </View>
          )}
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

const styles = StyleSheet.create({
  sheetBackground: {
    backgroundColor: BankingColors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handleIndicator: { backgroundColor: BankingColors.border },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  closeBtn: { padding: 4 },

  content: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },

  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: 20,
    gap: Spacing.xs,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: FontSize.sm, fontFamily: FontFamily.semibold },
  amountBig: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },

  detailsCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 0,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },

  cardIconWrap: {
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  cardIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  detailLabel: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    paddingRight: Spacing.md,
  },
  detailValue: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right",
  },

  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
  },
  actionBtnDisabled: { opacity: 0.4 },
  actionIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  actionLabel: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  actionDivider: {
    width: 1,
    height: 40,
    backgroundColor: BankingColors.border,
  },
  invalidStatusNote: {
    marginTop: Spacing.md,
    padding: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.warning,
    backgroundColor: BankingColors.warning + "15",
  },
  invalidStatusText: {
    fontSize: FontSize.sm,
    color: BankingColors.warning,
    textAlign: "center",
  },
});
