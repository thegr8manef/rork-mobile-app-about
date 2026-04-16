import React, { useCallback, useState, useEffect, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import { Eye, Share2, CheckCircle2 } from "lucide-react-native";
import * as Sharing from "expo-sharing";

import { BankingColors,
  BorderRadius,
  FontSize,
  Spacing, FontFamily } from "@/constants";
import TText from "@/components/TText";
import CustomButton from "@/components/CustomButton";

import type { BillOfExchangeRecord } from "@/types/bill-of-exchange.type";
import {
  saveImageToGallery,
  saveImageBase64ToAppDir } from "@/utils/savePdfBase64";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import useShowMessage from "@/hooks/useShowMessage";
import { requestStoragePermission } from "@/utils/mediaPermission";

type Props = {
  visible: boolean;
  bill: BillOfExchangeRecord | null;
  isPayer: boolean;
  formatCurrency: (amount: number, currency: string) => string;
  formatDate: (date: string) => string;
  onClose: () => void;
  onViewImage: () => void;
  billImageBase64: string | undefined;
  isLoadingImage: boolean;
};

function DetailRow({
  label,
  value,
  subValue }: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <View style={styles.row}>
      <TText style={styles.label}>{label}</TText>
      <View style={styles.valueCol}>
        <TText style={styles.value} numberOfLines={2}>
          {value}
        </TText>
        {!!subValue && (
          <TText style={styles.subValue} numberOfLines={2}>
            {subValue}
          </TText>
        )}
      </View>
    </View>
  );
}

export default function BillDetailModal({
  visible,
  bill,
  isPayer,
  formatCurrency,
  formatDate,
  onClose,
  onViewImage,
  billImageBase64,
  isLoadingImage }: Props) {
  const { t } = useTranslation();
  const { showComplete } = useDownloadNotification();
  const { showMessageSuccess, showMessageError } = useShowMessage();

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedImageUri, setSavedImageUri] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const canShow = !!bill;

  useEffect(() => {
    if (visible) {
      setIsDownloading(false);
      setProgress(0);
      setSavedImageUri(null);
      setDownloadSuccess(false);
    } else {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    }
  }, [visible]);

  const stopProgressTimer = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  const startSmoothProgress = useCallback(() => {
    stopProgressTimer();
    setProgress(0);
    progressTimerRef.current = setInterval(() => {
      setProgress((p) => (p < 0.9 ? Math.min(0.9, p + 0.07) : p));
    }, 250);
  }, [stopProgressTimer]);

  const handleDownload = useCallback(async () => {
    if (!bill?.id || !billImageBase64 || isDownloading) return;

    const { granted } = await requestStoragePermission();
    if (!granted) {
      console.log("[BillDetail] Storage permission denied, blocking download");
      return;
    }

    setIsDownloading(true);
    setSavedImageUri(null);
    startSmoothProgress();

    try {
      const filename = `effet_${bill.billNumber || bill.id}.png`;

      // Save to gallery (Photos / DCIM / "Attijari Up" album)
      await saveImageToGallery(billImageBase64, filename);

      // Also save to app dir for sharing
      const appUri = await saveImageBase64ToAppDir(billImageBase64, filename);

      stopProgressTimer();
      setProgress(1);
      setSavedImageUri(appUri);
      setDownloadSuccess(true);

      // Android notification
      await showComplete(
        t("bills.download.savedTitle", "Image de l'effet enregistrée"),
        t("bills.download.savedToGallery", "Image enregistrée dans votre galerie"),
        appUri,
        "image/png",
      );
    } catch (e: any) {
      stopProgressTimer();
      setProgress(0);

      console.log("Image save error:", e);

      if (e?.message === "GALLERY_PERMISSION_DENIED") {
        showMessageError("bills.download.permissionDenied");
      } else {
        showMessageError("bills.download.inlineError");
      }
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
      }, 400);
    }
  }, [
    bill,
    billImageBase64,
    isDownloading,
    startSmoothProgress,
    stopProgressTimer,
    showMessageSuccess,
    showMessageError,
    showComplete,
    t,
  ]);

  const handleShare = useCallback(async () => {
    if (!savedImageUri || isDownloading) return;

    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageError("bills.share.notAvailable");
        return;
      }

      await Sharing.shareAsync(savedImageUri, {
        mimeType: "image/png",
        dialogTitle: t("bills.share.dialogTitle", "Partager l'effet"),
        UTI: "public.png" });
    } catch (e) {
      console.log("Share error:", e);
      showMessageError("bills.share.inlineError");
    }
  }, [savedImageUri, isDownloading, t, showMessageError]);

  const progressPct = Math.round(progress * 100);

  const getStatusKey = (status: string): string => {
    switch (status) {
      case "PAID":
        return "bills.status.paid";
      case "CLEARED":
        return "bills.status.cleared";
      case "PENDING":
        return "bills.status.pending";
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <TText style={styles.title}>
            {t("bills.details.title", "Détails de l'effet")}
          </TText>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {billImageBase64 && (
              <TouchableOpacity
                style={styles.imageThumbnailContainer}
                onPress={onViewImage}
                activeOpacity={0.8}
              >
                <Image
                  source={{
                    uri: `data:image/png;base64,${billImageBase64}` }}
                  style={styles.imageThumbnail}
                  resizeMode="contain"
                />
                <View style={styles.imageOverlay}>
                  <Eye size={32} color="#FFFFFF" strokeWidth={2} />
                </View>
              </TouchableOpacity>
            )}

            {isLoadingImage && !billImageBase64 && (
              <View style={styles.imageThumbnailContainer}>
                <ActivityIndicator size="large" color={BankingColors.primary} />
                <TText style={styles.loadingImageText}>
                  {t("bills.loadingImage", "Chargement de l'image...")}
                </TText>
              </View>
            )}

            {isPayer ? (
              <>
                <DetailRow
                  label={t("bills.details.beneficiary", "Bénéficiaire")}
                  value={bill?.draweeName || "-"}
                  subValue={bill?.draweeRib}
                />
                <DetailRow
                  label={t(
                    "bills.beneficiaryBank",
                    "Banque du bénéficiaire",
                  )}
                  value={bill?.draweeBankCode || "-"}
                />
              </>
            ) : (
              <>
                <DetailRow
                  label={t("bills.details.remitter", "Émetteur")}
                  value={bill?.remitterName || "-"}
                  subValue={bill?.remitterRib}
                />
                <DetailRow
                  label={t("bills.remitterBank", "Banque de l'émetteur")}
                  value={bill?.remitterBankCode || "-"}
                />
              </>
            )}
          </ScrollView>

          {isDownloading && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <TText style={styles.progressText}>
                {t("bills.download.loading", "Téléchargement…")} {progressPct}%
              </TText>
            </View>
          )}

          {downloadSuccess && !isDownloading && (
            <View style={styles.successWrap}>
              <CheckCircle2 size={20} color={styles.successIcon.color} strokeWidth={2} />
              <TText style={styles.successText}>
                {t("bills.download.inlineSuccess")}
              </TText>
            </View>
          )}

          <View style={styles.actionRow}>
            <View style={styles.btnCol}>
              {!savedImageUri ? (
                <CustomButton
                  tKey="bills.details.download"
                  variant="secondary"
                  onPress={handleDownload}
                  disabled={
                    isDownloading ||
                    !bill ||
                    isLoadingImage ||
                    !billImageBase64
                  }
                  loading={isDownloading}
                  style={styles.actionBtn}
                />
              ) : (
                <CustomButton
                  tKey="bills.details.share"
                  variant="secondary"
                  onPress={handleShare}
                  disabled={isDownloading}
                  icon={Share2}
                  style={styles.actionBtn}
                />
              )}
            </View>

            <View style={styles.btnCol}>
              <CustomButton
                tKey="bills.details.viewImage"
                variant="secondary"
                onPress={onViewImage}
                disabled={
                  isDownloading ||
                  !bill ||
                  isLoadingImage ||
                  !billImageBase64
                }
                icon={Eye}
                style={styles.actionBtn}
              />
            </View>
          </View>

          <CustomButton
            tKey="common.ok"
            onPress={onClose}
            disabled={isDownloading}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%" },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: Spacing.lg,
    textAlign: "center" },
  scroll: { flexGrow: 0 },
  scrollContent: { paddingBottom: Spacing.md },

  imageThumbnailContainer: {
    width: "100%",
    height: 180,
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.lg,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
    alignItems: "center" },
  imageThumbnail: {
    width: "100%",
    height: "100%" },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center" },
  loadingImageText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: BankingColors.textSecondary },

  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale,
    gap: 12 },
  label: { flex: 1, fontSize: 13, color: BankingColors.textSecondary },
  valueCol: { flex: 1, alignItems: "flex-end" },
  value: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right" },
  subValue: {
    marginTop: 2,
    fontSize: 12,
    color: BankingColors.textSecondary,
    textAlign: "right" },

  successWrap: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    backgroundColor: "#F0FDF4",
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  successIcon: { color: "#16A34A" },
  successText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: "#15803D",
    fontFamily: FontFamily.semibold,
    lineHeight: 18,
  },

  progressWrap: { marginTop: Spacing.md },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: BankingColors.borderPale,
    overflow: "hidden" },
  progressFill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: BankingColors.primary },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: BankingColors.textSecondary,
    textAlign: "center" },

  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md },
  btnCol: { flex: 1 },
  actionBtn: { width: "100%" } });