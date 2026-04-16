import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect } from "react";
import {
  Modal,
  View,
  StyleSheet,
  ScrollView,
  Animated,
  TouchableOpacity,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent } from "react-native";
import { useTranslation } from "react-i18next";
import { router } from "expo-router";
import { ChevronDown, ChevronUp, Eye, Share2 } from "lucide-react-native";

import { BankingColors,
  BorderRadius,
  FontSize,
  Spacing, FontFamily } from "@/constants";
import TText from "@/components/TText";
import CustomButton from "@/components/CustomButton";

import type { UITransfer } from "../types";
import { formatCurrency, formatDateJJMMYYYY, getStatusText } from "../utils";

import { getTransferPdfBase64 } from "@/services/account.api";
import {
  savePdfToDownloads,
  savePdfBase64ToAppDir } from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const MAX_SCROLL_HEIGHT = SCREEN_HEIGHT * 0.5;

type Props = {
  visible: boolean;
  transfer: UITransfer | null;
  onClose: () => void;
};

const isAfterToday = (iso?: string) => {
  if (!iso) return false;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;

  const today = new Date();
  const a = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const b = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  ).getTime();
  return a > b;
};

function DetailRow({
  label,
  value,
  subValue }: {
  label: string;
  value?: string;
  subValue?: string;
}) {
  const displayValue = value && value.trim() !== "" ? value : "-";
  const isLong = displayValue.length > 30;

  return (
    <View style={styles.row}>
      <TText style={styles.label} numberOfLines={2}>
        {label}
      </TText>

      <View style={styles.valueCol}>
        <TText
          style={[styles.value, isLong && styles.valueCentered]}
          numberOfLines={4}
        >
          {displayValue}
        </TText>

        {!!subValue && (
          <TText
            style={styles.subValueOneLine}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {subValue}
          </TText>
        )}
      </View>
    </View>
  );
}

export default function TransferDetailModal({
  visible,
  transfer,
  onClose }: Props) {
  const { t } = useTranslation();
  const { showComplete } = useDownloadNotification();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [savedPdfUri, setSavedPdfUri] = useState<string | null>(null);

  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Scroll indicators (up & down) ──
  const scrollViewRef = useRef<ScrollView>(null);
  const [showScrollDown, setShowScrollDown] = useState(false);
  const [showScrollUp, setShowScrollUp] = useState(false);
  const scrollDownOpacity = useRef(new Animated.Value(0)).current;
  const scrollUpOpacity = useRef(new Animated.Value(0)).current;
  const scrollViewHeight = useRef(0);
  const contentHeight = useRef(0);

  // ── Dynamic scroll height based on content ──
  const [measuredContentHeight, setMeasuredContentHeight] = useState(0);
  const dynamicScrollHeight = useMemo(() => {
    if (measuredContentHeight <= 0) return undefined;
    return Math.min(measuredContentHeight, MAX_SCROLL_HEIGHT);
  }, [measuredContentHeight]);

  const updateScrollIndicators = useCallback(
    (offsetY: number, layoutH: number, contentH: number) => {
      const isScrollable = contentH > layoutH + 10;
      if (!isScrollable) {
        setShowScrollDown(false);
        setShowScrollUp(false);
        return;
      }
      setShowScrollUp(offsetY > 20);
      setShowScrollDown(offsetY < contentH - layoutH - 20);
    },
    [],
  );

  const handleLayout = useCallback(
    (e: { nativeEvent: { layout: { height: number } } }) => {
      scrollViewHeight.current = e.nativeEvent.layout.height;
      updateScrollIndicators(
        0,
        scrollViewHeight.current,
        contentHeight.current,
      );
    },
    [updateScrollIndicators],
  );

  const handleContentSizeChange = useCallback(
    (_w: number, h: number) => {
      contentHeight.current = h;
      setMeasuredContentHeight(h);
      updateScrollIndicators(0, scrollViewHeight.current, h);
    },
    [updateScrollIndicators],
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent;
      updateScrollIndicators(
        contentOffset.y,
        layoutMeasurement.height,
        contentSize.height,
      );
    },
    [updateScrollIndicators],
  );

  // Animate indicator opacities
  useEffect(() => {
    Animated.timing(scrollDownOpacity, {
      toValue: showScrollDown ? 1 : 0,
      duration: 200,
      useNativeDriver: true }).start();
  }, [showScrollDown, scrollDownOpacity]);

  useEffect(() => {
    Animated.timing(scrollUpOpacity, {
      toValue: showScrollUp ? 1 : 0,
      duration: 200,
      useNativeDriver: true }).start();
  }, [showScrollUp, scrollUpOpacity]);

  const scrollToDirection = useCallback((direction: "up" | "down") => {
    if (!scrollViewRef.current) return;
    if (direction === "up") {
      scrollViewRef.current.scrollTo({ y: 0, animated: true });
    } else {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, []);

  const isPermanent = transfer?.transferTypeUi === "permanent";

  const isDeferred = useMemo(() => {
    if (!transfer) return false;
    if (isPermanent) return false;
    return isAfterToday(transfer.executionDateISO);
  }, [transfer, isPermanent]);

  const isExecuted = transfer?.status === "EXECUTED";

  const typeLabel = useMemo(() => {
    if (!transfer) return "-";
    if (isPermanent) return t("transferHistory.type.permanent", "Permanent");
    if (isDeferred) return t("transferHistory.type.deferred", "Différé");
    return t("transferHistory.type.immediate", "Immédiat");
  }, [transfer, isPermanent, isDeferred, t]);

  const frequencyLabel = useMemo(() => {
    const f = transfer?.frequency?.trim();
    if (!f) return "-";

    if (f === "MONTHLY")
      return t("transferHistory.frequency.MONTHLY", "Mensuelle");
    if (f === "ANNUAL")
      return t("transferHistory.frequency.ANNUAL", "Annuelle");

    return t(`transferHistory.frequency.${f}`, f);
  }, [transfer?.frequency, t]);

  useEffect(() => {
    if (visible) {
      setIsDownloading(false);
      setProgress(0);
      setSavedPdfUri(null);
      setShowScrollDown(false);
      setShowScrollUp(false);
      setMeasuredContentHeight(0);
    } else if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
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
    if (!transfer?.id || isDownloading) return;

    const { granted } = await requestStoragePermission();
    if (!granted) {
      console.log(
        "[TransferDetail] Storage permission denied, blocking download",
      );
      return;
    }

    setIsDownloading(true);
    startSmoothProgress();

    try {
      const base64 = await getTransferPdfBase64(transfer.id, "PDF");

      const downloadUri = await savePdfToDownloads(
        base64,
        `transfer_${transfer.id}.pdf`,
      );

      const appUri = await savePdfBase64ToAppDir(
        base64,
        `transfer_${transfer.id}.pdf`,
      );

      stopProgressTimer();
      setProgress(1);
      setSavedPdfUri(appUri);

      showMessageSuccess("transferHistory.download.savedTitle");
      await showComplete(
        t("transferHistory.download.savedTitle", "Reçu de virement enregistré"),
        t(
          "transferHistory.download.savedDesc",
          "Le reçu a été enregistré dans vos téléchargements.",
        ),
        downloadUri,
      );
    } catch {
      stopProgressTimer();
      setProgress(0);
      showMessageError("pdf.downloadErrorMessage");
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setProgress(0);
      }, 400);
    }
  }, [
    transfer?.id,
    isDownloading,
    startSmoothProgress,
    stopProgressTimer,
    t,
    showComplete,
    showMessageSuccess,
    showMessageError,
  ]);

  const handleShareReceipt = useCallback(async () => {
    if (!savedPdfUri || isDownloading) return;

    const available = await Sharing.isAvailableAsync();
    if (!available) return;

    await Sharing.shareAsync(savedPdfUri, {
      mimeType: "application/pdf",
      dialogTitle: t("transferHistory.share.dialogTitle"),
      UTI: "com.adobe.pdf" });
  }, [savedPdfUri, isDownloading, t]);

  const handleViewPdf = useCallback(() => {
    console.log("🚀 ~ TransferDetailModal ~ transfer:", transfer);
    if (!transfer || isDownloading) return;
    onClose();
    router.push({
      pathname: "/(root)/(tabs)/(home)/transfer-view-pdf",
      params: { transferId: transfer.id } });
  }, [transfer, onClose, isDownloading]);

  const progressPct = Math.round(progress * 100);

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
            {t("transferHistory.details.title")}
          </TText>

          {/* ── Scrollable content area ── */}
          <View
            style={[
              styles.scrollWrapper,
              dynamicScrollHeight !== undefined && {
                height: dynamicScrollHeight },
            ]}
          >
            {/* Scroll Up Indicator */}
            <Animated.View
              style={[
                styles.scrollIndicator,
                styles.scrollUpIndicator,
                { opacity: scrollUpOpacity },
              ]}
              pointerEvents={showScrollUp ? "auto" : "none"}
            >
              <TouchableOpacity
                onPress={() => scrollToDirection("up")}
                style={styles.scrollIndicatorTouchable}
                activeOpacity={0.7}
              >
                <ChevronUp size={16} color={BankingColors.primary} />
              </TouchableOpacity>
            </Animated.View>

            <ScrollView
              ref={scrollViewRef}
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              onLayout={handleLayout}
              onContentSizeChange={handleContentSizeChange}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            >
              <DetailRow
                label={t("transferHistory.details.reference", "Référence")}
                value={transfer?.bmcReference ?? "-"}
              />

              <DetailRow
                label={t("transferHistory.details.type", "Type du virement")}
                value={typeLabel}
              />

              <DetailRow
                label={t("transferHistory.details.debtor", "Compte source")}
                value={transfer?.debtorDisplay}
                subValue={transfer?.debtorAccountRib}
              />

              <DetailRow
                label={t(
                  "transferHistory.details.creditor",
                  "Compte bénéficiaire",
                )}
                value={
                  transfer?.beneficiaryFullName ||
                  transfer?.beneficiaryDisplay ||
                  transfer?.creditorDisplay
                }
                subValue={transfer?.creditorAccountRib}
              />

              <DetailRow
                label={t("transferHistory.details.amount", "Montant")}
                value={
                  transfer
                    ? formatCurrency(transfer.amount, transfer.currency)
                    : "-"
                }
              />

              <DetailRow
                label={
                  isPermanent
                    ? t(
                        "transferHistory.details.startExecutionDate",
                        "Date de début d'exécution",
                      )
                    : t(
                        "transferHistory.details.executionDate",
                        "Date d'exécution",
                      )
                }
                value={
                  transfer?.executionDateISO
                    ? formatDateJJMMYYYY(transfer.executionDateISO)
                    : "-"
                }
              />

              <DetailRow
                label={t("transferHistory.details.motif", "Motif du virement")}
                value={transfer?.motif}
              />

              {isPermanent && (
                <>
                  <DetailRow
                    label={t("transferHistory.details.frequency", "Fréquence")}
                    value={frequencyLabel}
                  />

                  <DetailRow
                    label={t(
                      "transferHistory.details.createdAt",
                      "Date de création",
                    )}
                    value={
                      transfer?.createdAtISO
                        ? formatDateJJMMYYYY(transfer.createdAtISO)
                        : "-"
                    }
                  />

                  {!!transfer?.endExecutionDateISO && (
                    <DetailRow
                      label={t(
                        "transferHistory.details.endExecutionDate",
                        "Date de fin d'exécution",
                      )}
                      value={formatDateJJMMYYYY(transfer.endExecutionDateISO)}
                    />
                  )}

                  <DetailRow
                    label={t("transferHistory.details.status", "Statut")}
                    value={transfer ? t(getStatusText(transfer.status)) : "-"}
                  />
                </>
              )}

              {isDeferred && (
                <DetailRow
                  label={t(
                    "transferHistory.details.createdAt",
                    "Date de création",
                  )}
                  value={
                    transfer?.createdAtISO
                      ? formatDateJJMMYYYY(transfer.createdAtISO)
                      : "-"
                  }
                />
              )}

              {!isPermanent && (
                <DetailRow
                  label={t("transferHistory.details.status", "Statut")}
                  value={transfer ? t(getStatusText(transfer.status)) : "-"}
                />
              )}
            </ScrollView>

            {/* Scroll Down Indicator */}
            <Animated.View
              style={[
                styles.scrollIndicator,
                styles.scrollDownIndicator,
                { opacity: scrollDownOpacity },
              ]}
              pointerEvents={showScrollDown ? "auto" : "none"}
            >
              <TouchableOpacity
                onPress={() => scrollToDirection("down")}
                style={styles.scrollIndicatorTouchable}
                activeOpacity={0.7}
              >
                <ChevronDown size={16} color={BankingColors.primary} />
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* ── Progress bar ── */}
          {isDownloading && (
            <View style={styles.progressWrap}>
              <View style={styles.progressTrack}>
                <View
                  style={[styles.progressFill, { width: `${progressPct}%` }]}
                />
              </View>
              <TText style={styles.progressText}>
                {t("transferHistory.download.loading", "Downloading…")}{" "}
                {progressPct}%
              </TText>
            </View>
          )}

          {/* ── Action buttons ── */}
          {isExecuted && (
            <View style={styles.actionRow}>
              <View style={styles.btnCol}>
                {!savedPdfUri ? (
                  <CustomButton
                    tKey="transferHistory.details.download"
                    variant="secondary"
                    onPress={handleDownload}
                    loading={isDownloading}
                    disabled={!transfer || isDownloading}
                    style={styles.secondaryBtn}
                  />
                ) : (
                  <CustomButton
                    tKey="transferHistory.details.shareReceipt"
                    variant="secondary"
                    onPress={handleShareReceipt}
                    icon={Share2}
                    disabled={isDownloading}
                    style={styles.secondaryBtn}
                  />
                )}
              </View>

              <View style={styles.btnCol}>
                <CustomButton
                  tKey="transferHistory.details.view"
                  variant="secondary"
                  onPress={handleViewPdf}
                  icon={Eye}
                  disabled={!transfer || isDownloading}
                  style={styles.secondaryBtn}
                />
              </View>
            </View>
          )}

          {/* ── OK button ── */}
          <View style={styles.okWrap}>
            <CustomButton
              tKey="common.ok"
              onPress={onClose}
              disabled={isDownloading}
              style={styles.okBtn}
            />
          </View>
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
    // No maxHeight — card wraps content dynamically
  },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    textAlign: "center",
    marginBottom: Spacing.lg },

  // ── Scroll area ──
  scrollWrapper: {
    // height is set dynamically via inline style
    // capped at MAX_SCROLL_HEIGHT (50% of screen)
  },
  scroll: {
    flexGrow: 0 },
  scrollContent: {
    paddingBottom: Spacing.sm },

  // ── Scroll indicators ──
  scrollIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: "center" },
  scrollUpIndicator: {
    top: 0 },
  scrollDownIndicator: {
    bottom: 0 },
  scrollIndicatorTouchable: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.white,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: BankingColors.borderPale },

  // ── Detail rows ──
  row: {
    flexDirection: "row",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale },
  label: {
    width: "34%",
    paddingRight: 12,
    fontSize: 13,
    color: BankingColors.textLabel },
  valueCol: {
    width: "66%",
    alignItems: "flex-end",
    minWidth: 0 },
  value: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "right" },
  subValueOneLine: {
    marginTop: 4,
    fontSize: 12,
    color: BankingColors.textSecondary,
    textAlign: "right",
    fontVariant: ["tabular-nums"],
    fontFamily: "monospace",
    maxWidth: "100%" },

  // ── Progress ──
  progressWrap: { marginTop: Spacing.md },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: BankingColors.borderPale,
    overflow: "hidden" },
  progressFill: {
    height: "100%",
    backgroundColor: BankingColors.primary },
  progressText: {
    marginTop: 6,
    fontSize: 12,
    color: BankingColors.textSecondary,
    textAlign: "center" },

  // ── Buttons ──
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: Spacing.lg },
  btnCol: { flex: 1 },
  secondaryBtn: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.lg },

  okWrap: { marginTop: Spacing.md },
  okBtn: {
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.lg },
  valueCentered: {
    textAlign: "justify" } });
