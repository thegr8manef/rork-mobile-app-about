// app/(root)/(tabs)/(factures)/facture-view-pdf.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Download, Share2 } from "lucide-react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  Shadow,
  FontFamily,
} from "@/constants";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";

import { getFacturePdfBase64 } from "@/services/account.api";
import {
  savePdfBase64ToAppDir,
  savePdfToDownloads,
} from "@/utils/savePdfBase64";
import TransferReceiptPdfSkeleton from "@/components/home/TransferReceiptPdfSkeleton/TransferReceiptPdfSkeleton";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";

function isInvalidPaymentStatusError(err: any): boolean {
  return err?.response?.data?.errorCode === "INVALID_PAYMENT_STATUS";
}

export default function FactureViewPdfScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { paymentId, paymentStatus } = useLocalSearchParams<{
    paymentId: string;
    paymentStatus?: string;
  }>();
  const { showComplete } = useDownloadNotification();
  const { showMessageError, showMessageInfo } = useShowMessage();

  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloadDone, setIsDownloadDone] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isShareLoading, setIsShareLoading] = useState(false);

  const isPaid = paymentStatus?.toUpperCase() === "PAID";

  const loadPdf = useCallback(async () => {
    if (!paymentId) {
      setError(t("bills.viewPdf.noId", "Identifiant manquant"));
      setIsLoading(false);
      return;
    }

    if (paymentStatus && !isPaid) {
      setError(
        t(
          "bills.viewPdf.loadErrorInvalidStatus",
          "Le reçu n'est pas disponible car ce paiement n'est pas encore finalisé.",
        ),
      );
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const base64 = await getFacturePdfBase64(String(paymentId));
      const uri = await savePdfBase64ToAppDir(
        base64,
        `facture_${paymentId}.pdf`,
      );
      setPdfUri(uri);
    } catch (err) {
      console.error("[FactureViewPdf] Failed to load PDF:", err);
      if (isInvalidPaymentStatusError(err)) {
        setError(
          t(
            "bills.viewPdf.loadErrorInvalidStatus",
            "Le reçu n'est pas disponible car ce paiement n'est pas encore finalisé.",
          ),
        );
      } else {
        showMessageError("pdf.downloadErrorMessage");
        setError("bills.viewPdf.loadError");
      }
    } finally {
      setIsLoading(false);
    }
  }, [paymentId, paymentStatus, isPaid, t, showMessageError]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

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

  useEffect(() => {
    return () => stopProgressTimer();
  }, [stopProgressTimer]);

  const handleDownload = useCallback(async () => {
    if (!pdfUri || isDownloading) return;

    if (paymentStatus && !isPaid) {
      setError(
        t(
          "bills.viewPdf.loadErrorInvalidStatus",
          "Le reçu n'est pas disponible car ce paiement n'est pas encore finalisé.",
        ),
      );
      return;
    }

    const { granted } = await requestStoragePermission();
    if (!granted) return;

    setIsDownloading(true);
    setIsDownloadDone(false);
    startSmoothProgress();

    try {
      const base64 = await getFacturePdfBase64(String(paymentId));
      const uri = await savePdfToDownloads(base64, `facture_${paymentId}.pdf`);

      stopProgressTimer();
      setProgress(1);
      setIsDownloadDone(true);

      await showComplete(
        t("bills.download.savedTitle", "Reçu enregistré"),
        t(
          "bills.download.savedDesc",
          "Le reçu a été enregistré dans vos téléchargements.",
        ),
        uri,
        "application/pdf",
      );
    } catch (err) {
      console.error("[FactureViewPdf] Download error:", err);
      stopProgressTimer();
      setProgress(0);
      if (isInvalidPaymentStatusError(err)) {
        setError(
          t(
            "bills.viewPdf.loadErrorInvalidStatus",
            "Le reçu n'est pas disponible car ce paiement n'est pas encore finalisé.",
          ),
        );
      } else {
        showMessageError("pdf.downloadErrorMessage");
      }
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
      }, 400);
    }
  }, [
    pdfUri,
    paymentId,
    isDownloading,
    startSmoothProgress,
    stopProgressTimer,
    t,
    showComplete,
    showMessageError,
  ]);

  const handleShare = useCallback(async () => {
    if (!pdfUri) return;

    setIsShareLoading(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageInfo("bills.viewPdf.shareUnavailable", "");
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: t("bills.share.dialogTitle", "Partager le reçu"),
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      console.log("[FactureViewPdf] Share error:", e);
      showMessageError("bills.viewPdf.shareError");
    } finally {
      setIsShareLoading(false);
    }
  }, [pdfUri, t]);

  const progressPct = Math.round(progress * 100);
  const buttonsDisabled = !pdfUri || isLoading || !!error;
  const showActionBar = isPaid && !isLoading && !error && !!pdfUri;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("bills.viewPdf.title", "Reçu de paiement"),
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
        }}
      />

      <View style={styles.content}>
        {isLoading && <TransferReceiptPdfSkeleton compactTop />}

        {error && (
          <ApiErrorState
            descriptionTKey={error}
            onRetry={loadPdf}
          />
        )}

        {!isLoading && !error && pdfUri && (
          <Pdf
            source={{ uri: pdfUri }}
            style={styles.pdf}
            trustAllCerts={false}
            onError={(e) => {
              console.log("[FactureViewPdf] PDF render error:", e);
              showMessageError("bills.viewPdf.renderError");
            }}
          />
        )}

        {showActionBar && (
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, Spacing.md) },
            ]}
          >
            {isDownloading && (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                  />
                </View>
                <TText style={styles.progressText}>
                  {t("bills.viewPdf.downloading", "Téléchargement…")}{" "}
                  {progressPct}%
                </TText>
              </View>
            )}

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.downloadBtn,
                  (buttonsDisabled || isDownloading) && styles.disabledBtn,
                  isDownloadDone && styles.downloadDoneBtn,
                ]}
                onPress={handleDownload}
                disabled={buttonsDisabled || isDownloading}
                activeOpacity={0.7}
              >
                <Download
                  size={20}
                  color={
                    isDownloadDone ? BankingColors.white : BankingColors.primary
                  }
                />
                <TText
                  style={[
                    styles.actionBtnText,
                    styles.downloadBtnText,
                    isDownloadDone && styles.downloadDoneBtnText,
                  ]}
                >
                  {isDownloadDone
                    ? t("bills.viewPdf.downloaded", "Téléchargé")
                    : t("common.download")}
                </TText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  styles.shareBtn,
                  (buttonsDisabled || isShareLoading || isDownloading) &&
                    styles.disabledBtn,
                ]}
                onPress={handleShare}
                disabled={buttonsDisabled || isShareLoading || isDownloading}
                activeOpacity={0.7}
              >
                <Share2 size={20} color={BankingColors.white} />
                <TText style={[styles.actionBtnText, styles.shareBtnText]}>
                  {t("common.share")}
                </TText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: BankingColors.white },

  pdf: { flex: 1, backgroundColor: BankingColors.white },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    backgroundColor: "#F8FAFC",
  },

  errorCard: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.borderPale,
    ...Shadow.sm,
  },

  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },

  errorTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },

  errorText: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },

  retryAction: {
    minWidth: 170,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BankingColors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.full,
    ...Shadow.sm,
  },

  retryActionText: {
    color: BankingColors.white,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },

  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: BankingColors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F8",
    ...Shadow.sm,
  },

  progressWrap: { marginBottom: Spacing.md },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: BankingColors.borderPale,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: BankingColors.primary,
    borderRadius: 999,
  },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: BankingColors.textSecondary,
    textAlign: "center",
  },

  btnRow: { flexDirection: "row", gap: 12 },

  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: BorderRadius.xl,
  },
  downloadBtn: {
    backgroundColor: BankingColors.primary + "0A",
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
  },
  downloadDoneBtn: {
    backgroundColor: BankingColors.success,
    borderColor: BankingColors.success,
  },
  shareBtn: { backgroundColor: BankingColors.primary },

  actionBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },
  downloadBtnText: { color: BankingColors.primary },
  downloadDoneBtnText: { color: BankingColors.white },
  shareBtnText: { color: BankingColors.white },
  disabledBtn: { opacity: 0.5 },
});
