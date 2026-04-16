// components/cartes/ReloadDetailSheet.tsx
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
  CreditCard,
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

import type { ReloadCardHistoryItem } from "@/services/card.api";
import { getRechargeCartePdfBase64 } from "@/services/account.api";
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

// ── Types ───────────────────────────────────────────────────────────

type Props = {
  visible: boolean;
  item: ReloadCardHistoryItem | null;
  initialSavedUri?: string | null;
  onClose: () => void;
};

// ── Helpers ─────────────────────────────────────────────────────────

const getStatusLabel = (status?: string | null, t?: any) => {
  switch (status) {
    case "EXECUTED":
      return t?.("reloadCard.status.executed") ?? "Exécuté";
    case "EXECUTING":
      return t?.("reloadCard.status.executing") ?? "En cours";
    case "REJECTED":
      return t?.("reloadCard.status.rejected") ?? "Rejeté";
    case "NOT_EXECUTED":
      return t?.("reloadCard.status.notExecuted") ?? "Non exécuté";
    default:
      return status || "-";
  }
};

const getStatusColor = (status?: string | null) => {
  switch (status) {
    case "EXECUTED":
      return BankingColors.success;
    case "EXECUTING":
      return BankingColors.warning;
    case "REJECTED":
      return BankingColors.error;
    default:
      return BankingColors.textSecondary;
  }
};

// ── Detail Row ──────────────────────────────────────────────────────

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

// ── Component ───────────────────────────────────────────────────────

export default function ReloadDetailSheet({
  visible,
  item,
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

  const statusColor = getStatusColor(item?.status);

  // ── Download ──────────────────────────────────────────────────────

  const handleDownload = useCallback(async () => {
    if (!item?.id || isDownloading) return;

    const { granted } = await requestStoragePermission();
    if (!granted) return;

    setIsDownloading(true);
    try {
      const base64 = await getRechargeCartePdfBase64(item.id);

      const downloadUri = await savePdfToDownloads(
        base64,
        `reload_${item.id}.pdf`,
      );
      const appUri = await savePdfBase64ToAppDir(
        base64,
        `reload_${item.id}.pdf`,
      );

      setSavedPdfUri(appUri);

      await showComplete(
        t("reloadCard.download.savedTitle"),
        t("reloadCard.download.savedDesc"),
        downloadUri,
      );
    } catch (e) {
      showMessageError("pdf.downloadErrorMessage");
    } finally {
      setIsDownloading(false);
    }
  }, [item?.id, isDownloading, t, showComplete]);

  // ── Share ─────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (isDownloading) return;

    if (!savedPdfUri) {
      if (!item?.id) return;

      setIsDownloading(true);
      try {
        const base64 = await getRechargeCartePdfBase64(String(item.id));
        const appUri = await savePdfBase64ToAppDir(
          base64,
          `reload_${item.id}.pdf`,
        );
        setSavedPdfUri(appUri);

        const available = await Sharing.isAvailableAsync();
        if (!available) return;

        await Sharing.shareAsync(appUri, {
          mimeType: "application/pdf",
          dialogTitle: t("reloadCard.share.dialogTitle"),
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
      dialogTitle: t("reloadCard.share.dialogTitle"),
      UTI: "com.adobe.pdf",
    });
  }, [savedPdfUri, item?.id, isDownloading, t]);

  // ── View PDF ──────────────────────────────────────────────────────

  const handleViewPdf = useCallback(() => {
    if (!item?.id) return;
    onClose();
    router.push({
      pathname: "/reload-card-view-pdf",
      params: { reloadId: item.id },
    });
  }, [item?.id, onClose]);

  if (!item) return null;

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
      {/* Header */}
      <View style={styles.header}>
        <TText style={styles.title}>{t("reloadCard.detail.title")}</TText>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
          <X size={22} color={BankingColors.text} />
        </TouchableOpacity>
      </View>

      <BottomSheetScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Status badge + amount */}
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
              {getStatusLabel(item.status, t)}
            </TText>
          </View>

          <TText style={styles.amountBig}>
            {formatBalance(item.amount, "TND")}
          </TText>
        </View>

        {/* Detail card with icon + rows + actions */}
        <View style={styles.detailsCard}>
          {/* Icon */}
          <View style={styles.cardIconWrap}>
            <View style={styles.cardIconCircle}>
              <CreditCard size={22} color={BankingColors.primary} />
            </View>
          </View>

          {/* Detail rows */}
          <DetailRow
            label={t("reloadCard.detail.date")}
            value={formatDate(item.executionDate)}
          />
          <DetailRow
            label={t("reloadCard.detail.debitAccount")}
            value={item.debtor?.rib ?? "-"}
          />
          {!!item.cardNumber && (
            <DetailRow
              label={t("reloadCard.detail.cardNumber")}
              value={item.cardNumber}
            />
          )}
          <DetailRow
            label={t("reloadCard.detail.amount")}
            value={formatBalance(item.amount, "TND")}
          />
          <DetailRow
            label={t("reloadCard.detail.status")}
            value={getStatusLabel(item.status, t)}
          />

          {/* Action buttons inside the card */}
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
        </View>
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

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
});
