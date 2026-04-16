import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity } from "react-native";
import { useLocalSearchParams, Stack } from "expo-router";
import { useTranslation } from "react-i18next";
import { Download, Share2 } from "lucide-react-native";
import Pdf from "react-native-pdf";
import * as Sharing from "expo-sharing";

import { BankingColors, Spacing, BorderRadius, FontSize } from "@/constants";
import ApiErrorState from "@/components/Apierrorstate";

import useShowMessage from "@/hooks/useShowMessage";
import { getTransferPdfBase64 } from "@/services/account.api";
import { savePdfBase64ToAppDir } from "@/utils/savePdfBase64";
import TransferReceiptPdfSkeleton from "@/components/home/TransferReceiptPdfSkeleton/TransferReceiptPdfSkeleton";
import CustomHeader from "@/components/home/Notification/CustomHeader";
// OPTIONAL: if you want "download to downloads" inside this screen too:
// import { savePdfToDownloads } from "@/utils/savePdfBase64";
// import { requestStoragePermission } from "@/utils/mediaPermission";

export default function TransferViewPdfScreen() {
  const { t } = useTranslation();
  const { showMessageSuccess, showMessageError, showMessageInfo } = useShowMessage();
  const { transferId } = useLocalSearchParams<{ transferId: string }>();

  const [pdfUri, setPdfUri] = useState<string | null>(null); // file://...
  const [isLoading, setIsLoading] = useState(true);
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

const loadPdf = useCallback(async () => {
  if (!transferId) {
    console.log("[TransferPDF] ❌ Missing transferId");
    setError(t("transferHistory.pdf.noId", "Missing transfer id"));
    setIsLoading(false);
    return;
  }

  try {
    setIsLoading(true);
    setError(null);

    console.log("[TransferPDF] 🚀 Request starting");
    console.log("[TransferPDF] transferId:", transferId);
    console.log("[TransferPDF] type:", "PDF");

    const base64 = await getTransferPdfBase64(String(transferId), "PDF");

    console.log("[TransferPDF] ✅ API success");
    console.log("[TransferPDF] base64 length:", base64?.length);
    console.log(
      "[TransferPDF] base64 preview:",
      base64?.substring(0, 50),
    );

    const uri = await savePdfBase64ToAppDir(
      base64,
      `transfer_${transferId}.pdf`,
    );

    console.log("[TransferPDF] ✅ File saved");
    console.log("[TransferPDF] uri:", uri);

    setPdfUri(uri);
  } catch (err) {
    console.log("[TransferPDF] ❌ API ERROR:", err);

    setError("transferHistory.pdf.loadError");
  } finally {
    setIsLoading(false);
  }
}, [transferId, t]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // ✅ SHARE
  const handleShare = useCallback(async () => {
    if (!pdfUri || isSharing) return;

    try {
      setIsSharing(true);

      const available = await Sharing.isAvailableAsync();
      if (!available) {
        showMessageInfo("cheques.share.notAvailable", "");
        return;
      }

      await Sharing.shareAsync(pdfUri, {
        mimeType: "application/pdf",
        dialogTitle: t("transferHistory.share.dialogTitle", "Partager le reçu"),
        UTI: "com.adobe.pdf" });
    } catch (e) {
      console.log("[TransferPDF] share error:", e);
      showMessageError("common.tryAgainLater");
    } finally {
      setIsSharing(false);
    }
  }, [pdfUri, isSharing, t]);

  // ✅ DOWNLOAD (simple version: just re-save to app dir already done)
  // If you want public Downloads, tell me and I’ll plug savePdfToDownloads + permission.
  const handleDownload = useCallback(async () => {
    if (!pdfUri || isDownloading) return;

    try {
      setIsDownloading(true);

      // simplest UX: tell user it's already available (since it's local)
      showMessageSuccess("transferHistory.download.savedTitle", "transferHistory.download.savedDesc", 2500);
    } finally {
      setIsDownloading(false);
    }
  }, [pdfUri, isDownloading, t]);

  const headerRight = useMemo(() => {
    const disabled = isLoading || !!error || !pdfUri;

    return (
      <View style={styles.headerRight}>
        {/* Download */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleDownload}
          disabled={disabled || isDownloading}
          activeOpacity={0.7}
          testID="pdf-download-btn"
        >
          {isDownloading ? (
            <ActivityIndicator size="small" color={BankingColors.text} />
          ) : (
            <Download
              size={20}
              color={disabled ? BankingColors.textLight : BankingColors.text}
              strokeWidth={2}
            />
          )}
        </TouchableOpacity>

        {/* Share */}
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleShare}
          disabled={disabled || isSharing}
          activeOpacity={0.7}
          testID="pdf-share-btn"
        >
          {isSharing ? (
            <ActivityIndicator size="small" color={BankingColors.text} />
          ) : (
            <Share2
              size={20}
              color={disabled ? BankingColors.textLight : BankingColors.text}
              strokeWidth={2}
            />
          )}
        </TouchableOpacity>
      </View>
    );
  }, [
    error,
    handleDownload,
    handleShare,
    isDownloading,
    isLoading,
    isSharing,
    pdfUri,
  ]);

  return (
    <>
      <Stack.Screen
        options={{
          header: () => (
            <CustomHeader
              title={t("transferHistory.pdf.title", "Reçu de virement")}
              showBackButton
              rightIcon={<Share2 size={24} color={BankingColors.white} />}
              onRightPress={handleShare}
            />
          ) }}
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
            onLoadComplete={(numberOfPages) => {
              console.log("PDF loaded pages:", numberOfPages);
            }}
            onError={(e) => {
              console.log("PDF render error:", e);
              showMessageError("transferHistory.pdf.renderError");
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, backgroundColor: BankingColors.white },

  headerRight: { flexDirection: "row", alignItems: "center" },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center" },

  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  errorText: {
    fontSize: FontSize.md,
    color: BankingColors.error,
    textAlign: "center",
    marginBottom: Spacing.lg },
  retryButton: { minWidth: 120 },

  pdf: {
    flex: 1,
    backgroundColor: BankingColors.white },

  downloadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BankingColors.white,
    justifyContent: "center",
    alignItems: "center" },
  downloadCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    alignItems: "center",
    minWidth: 200 },
  downloadText: {
    marginTop: Spacing.lg,
    fontSize: FontSize.md,
    color: BankingColors.text } });
