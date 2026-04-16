// /(root)/(tabs)/(home)/view-pdf-rib.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";
import { Download, Share2 } from "lucide-react-native";
import useShowMessage from "@/hooks/useShowMessage";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  Shadow,
  FontFamily,
} from "@/constants";
import TText from "@/components/TText";
import CustomButton from "@/components/CustomButton";
import ApiErrorState from "@/components/Apierrorstate";

import { getAccountRibPdfBase64 } from "@/services/account.api";
import {
  savePdfBase64ToAppDir,
  savePdfToDownloads,
} from "@/utils/savePdfBase64";
import TransferReceiptPdfSkeleton from "@/components/home/TransferReceiptPdfSkeleton/TransferReceiptPdfSkeleton";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";

export default function RibViewPdfScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { accountId } = useLocalSearchParams<{ accountId: string }>();
  const { showComplete } = useDownloadNotification();
  const { showMessageError, showMessageInfo } = useShowMessage();
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Download progress
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloadDone, setIsDownloadDone] = useState(false);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isShareLoading, setIsShareLoading] = useState(false);

  const loadPdf = useCallback(async () => {
    if (!accountId) {
      setError(t("ribPdf.noId"));
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const base64 = await getAccountRibPdfBase64(String(accountId), "PDF");
      const uri = await savePdfBase64ToAppDir(base64, `rib_${accountId}.pdf`);
      setPdfUri(uri);
    } catch (err) {
      setError("pdf.rib.downloadErrorMessage");
    } finally {
      setIsLoading(false);
    }
  }, [accountId, t]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // ── Progress helpers ──
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

    const { granted } = await requestStoragePermission();
    if (!granted) {
      console.log("[RibPdf] Storage permission denied, blocking download");
      return;
    }

    setIsDownloading(true);
    setIsDownloadDone(false);
    startSmoothProgress();

    try {
      const base64 = await getAccountRibPdfBase64(String(accountId), "PDF");
      const uri = await savePdfToDownloads(base64, `rib_${accountId}.pdf`);

      stopProgressTimer();
      setProgress(1);
      setIsDownloadDone(true);
      await showComplete(
        t("ribPdf.savedTitle"),
        t("ribPdf.savedDesc"),
        uri,
        "application/pdf",
      );
    } catch {
      stopProgressTimer();
      setProgress(0);

      showMessageError("ribPdf.downloadError");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
      }, 400);
    }
  }, [
    pdfUri,
    accountId,
    isDownloading,
    startSmoothProgress,
    stopProgressTimer,
    t,
  ]);
  // ── Share ──
  const handleShare = useCallback(async () => {
    if (!pdfUri) return;

    setIsShareLoading(true);
    try {
      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageInfo("ribPdf.shareUnavailable", "");
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: t("ribPdf.shareDialogTitle"),
        UTI: "com.adobe.pdf",
      });
    } catch (e) {
      console.log("share error:", e);
      showMessageError("ribPdf.shareError");
    } finally {
      setIsShareLoading(false);
    }
  }, [pdfUri, t]);

  const progressPct = Math.round(progress * 100);
  const buttonsDisabled = !pdfUri || isLoading || !!error;

  return (
    <>
      <Stack.Screen
        options={{
          title: t("ribPdf.title"),
        }}
      />

      <View style={styles.content}>
        {isLoading && <TransferReceiptPdfSkeleton compactTop />}

        {error && (
          <ApiErrorState
            descriptionTKey="pdf.rib.downloadErrorMessage"
            onRetry={loadPdf}
          />
        )}

        {!isLoading && !error && pdfUri && (
          <Pdf
            source={{ uri: pdfUri }}
            style={styles.pdf}
            trustAllCerts={false}
            onLoadComplete={(numberOfPages) => {
              console.log("RIB PDF loaded pages:", numberOfPages);
            }}
            onError={(e) => {
              console.log("RIB PDF render error:", e);
              showMessageError("ribPdf.renderError");
            }}
          />
        )}

        {/* Bottom section: progress + buttons */}
        {!isLoading && !error && pdfUri && (
          <View
            style={[
              styles.bottomBar,
              { paddingBottom: Math.max(insets.bottom, Spacing.md) },
            ]}
          >
            {/* Progress bar */}
            {isDownloading && (
              <View style={styles.progressWrap}>
                <View style={styles.progressTrack}>
                  <View
                    style={[styles.progressFill, { width: `${progressPct}%` }]}
                  />
                </View>
                <TText style={styles.progressText}>
                  {t("ribPdf.downloading")} {progressPct}%
                </TText>
              </View>
            )}

            {/* Buttons row */}
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
                    ? t("ribPdf.downloaded")
                    : t("ribPdf.download")}
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
                  {t("ribPdf.share")}
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

  retryButton: { minWidth: 120 },
  pdf: {
    flex: 1,
    backgroundColor: BankingColors.white,
  },

  // ── Bottom bar ──
  bottomBar: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: BankingColors.white,
    borderTopWidth: 1,
    borderTopColor: "#F0F3F8",
    ...Shadow.sm,
  },

  // ── Progress ──
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

  // ── Buttons ──
  btnRow: {
    flexDirection: "row",
    gap: 12,
  },

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

  shareBtn: {
    backgroundColor: BankingColors.primary,
  },

  actionBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },
  downloadBtnText: {
    color: BankingColors.primary,
  },
  downloadDoneBtnText: {
    color: BankingColors.white,
  },
  shareBtnText: {
    color: BankingColors.white,
  },

  disabledBtn: {
    opacity: 0.5,
  },
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
});
