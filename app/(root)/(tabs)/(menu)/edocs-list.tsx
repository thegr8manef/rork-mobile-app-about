// app/(root)/(tabs)/(menu)/edocs-list.tsx  (EDocsListScreen)

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
  Platform,
  Animated,
} from "react-native";
import { Stack, useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  FontFamily,
} from "@/constants";
import {
  FileText,
  Download,
  Calendar,
  Building2,
  RefreshCw,
  FolderOpen,
  Share2,
} from "lucide-react-native";
import DocumentSkeleton from "@/components/DocumentSkeleton";
import TText from "@/components/TText";
import { FlashList } from "@shopify/flash-list";
import {
  useGetAccountDocuments,
  useDownloadAccountDocument,
} from "@/hooks/use-edocs";
import ScreenState from "@/components/ScreenState";
import type { DocumentType, DocumentResult } from "@/services/edocs.api";
import { useTranslation } from "react-i18next";

import {
  savePdfToDownloads,
  savePdfBase64ToAppDir,
} from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import useShowMessage from "@/hooks/useShowMessage";
import { requestStoragePermission } from "@/utils/mediaPermission";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

const DOC_TYPE_LABELS: Record<DocumentType, string> = {
  RELEVE_COMPTE: "edocs.docTypes.RELEVE_COMPTE",
  RELEVE_ANNUEL_COMMISSIONS: "edocs.docTypes.RELEVE_ANNUEL_COMMISSIONS",
  AVIS_DEBIT: "edocs.docTypes.AVIS_DEBIT",
  AVIS_CREDIT: "edocs.docTypes.AVIS_CREDIT",
};

type DocDownloadState = {
  progress: number;
  isDownloading: boolean;
  savedUri: string | null;
};

const BUTTON_SIZE = 48;
const BUTTON_RADIUS = BorderRadius.md;

// ─── SPEED CONFIG ────────────────────────────────────────────────────────────
const PROGRESS_STEP = 0.07;
const PROGRESS_INTERVAL = 250;
const PROGRESS_CAP = 0.9;
const FILL_ANIM_DURATION = 300;
const WAVE_HALF_CYCLE = 1200;
const WAVE_AMPLITUDE = 3;
const COMPLETE_DELAY = 500;

// ────────────────────────────────────────────────────────────────────────────
// WaveFillButton
// ────────────────────────────────────────────────────────────────────────────
function WaveFillButton({ progress }: { progress: number }) {
  const fillAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fillAnim, {
      toValue: progress,
      duration: FILL_ANIM_DURATION,
      useNativeDriver: false,
    }).start();
  }, [progress, fillAnim]);

  useEffect(() => {
    const wave = Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, {
          toValue: 1,
          duration: WAVE_HALF_CYCLE,
          useNativeDriver: false,
        }),
        Animated.timing(waveAnim, {
          toValue: 0,
          duration: WAVE_HALF_CYCLE,
          useNativeDriver: false,
        }),
      ]),
    );
    wave.start();
    return () => wave.stop();
  }, [waveAnim]);

  const progressPct = Math.round(progress * 100);

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, BUTTON_SIZE],
    extrapolate: "clamp",
  });

  const waveOffset = waveAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, WAVE_AMPLITUDE, 0],
  });

  const fillTop = Animated.subtract(
    BUTTON_SIZE,
    Animated.add(fillHeight, waveOffset),
  );

  return (
    <View style={btnStyles.container}>
      <View style={btnStyles.background} />

      <Animated.View
        style={[
          btnStyles.fill,
          {
            top: fillTop,
            height: Animated.add(fillHeight, waveOffset),
          },
        ]}
      />

      <View style={btnStyles.border} />

      <View style={btnStyles.textLayer} pointerEvents="none">
        <TText style={btnStyles.pctTextPrimary}>{progressPct}%</TText>
      </View>

      <Animated.View
        style={[
          btnStyles.textClipLayer,
          {
            top: fillTop,
            height: Animated.add(fillHeight, waveOffset),
          },
        ]}
        pointerEvents="none"
      >
        <Animated.View
          style={{
            position: "absolute",
            width: BUTTON_SIZE,
            height: BUTTON_SIZE,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TText style={btnStyles.pctTextWhite}>{progressPct}%</TText>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const btnStyles = StyleSheet.create({
  container: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    overflow: "hidden",
    position: "relative",
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BankingColors.primary + "10",
    borderRadius: BUTTON_RADIUS,
  },
  fill: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: BankingColors.primary,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BUTTON_RADIUS,
    borderWidth: 1.5,
    borderColor: BankingColors.primary + "60",
  },
  textLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  pctTextPrimary: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },
  textClipLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    overflow: "hidden",
  },
  pctTextWhite: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
});

// ────────────────────────────────────────────────────────────────────────────
// DownloadActionButton — 3 states, all 48×48
// ────────────────────────────────────────────────────────────────────────────
function DownloadActionButton({
  isDownloading,
  progress,
  savedUri,
  onDownload,
  onShare,
}: {
  isDownloading: boolean;
  progress: number;
  savedUri: string | null;
  onDownload: () => void;
  onShare: () => void;
}) {
  if (savedUri) {
    return (
      <TouchableOpacity
        style={[styles.actionButton, styles.shareButtonStyle]}
        onPress={onShare}
        activeOpacity={0.8}
      >
        <Share2 size={20} color={BankingColors.primary} />
      </TouchableOpacity>
    );
  }

  if (isDownloading) {
    return <WaveFillButton progress={progress} />;
  }

  return (
    <TouchableOpacity
      style={[styles.actionButton, styles.downloadButtonStyle]}
      onPress={onDownload}
      activeOpacity={0.8}
    >
      <Download size={20} color={BankingColors.white} />
    </TouchableOpacity>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Screen
// ────────────────────────────────────────────────────────────────────────────
export default function EDocsListScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const { showComplete } = useDownloadNotification();

  const accountId = params.accountId as string;
  const accountName = params.accountName as string;
  const docType = params.docType as DocumentType;

  const startDate =
    typeof params.startDate === "string" ? params.startDate : undefined;
  const endDate =
    typeof params.endDate === "string" ? params.endDate : undefined;

  const [downloadStates, setDownloadStates] = useState<
    Record<string, DocDownloadState>
  >({});
  const progressTimers = useRef<Record<string, ReturnType<typeof setInterval>>>(
    {},
  );

  const apiParams = useMemo(
    () => ({
      accountId,
      documentType: docType,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
    }),
    [accountId, docType, startDate, endDate],
  );

  const {
    data: documentsResponse,
    isLoading,
    isFetching,
    refetch,
    error,
  } = useGetAccountDocuments(apiParams);

  useRefetchOnFocus([{ queryKey: ["edocs"], staleTime: 0 }]);

  const documents = documentsResponse?.data ?? [];
  const totalCount = documentsResponse?.count ?? 0;

  const { mutateAsync: downloadDocument } = useDownloadAccountDocument();

  const updateDocState = useCallback(
    (docId: string, patch: Partial<DocDownloadState>) => {
      setDownloadStates((prev) => ({
        ...prev,
        [docId]: {
          ...(prev[docId] ?? {
            progress: 0,
            isDownloading: false,
            savedUri: null,
          }),
          ...patch,
        },
      }));
    },
    [],
  );

  const stopProgressTimer = useCallback((docId: string) => {
    if (progressTimers.current[docId]) {
      clearInterval(progressTimers.current[docId]);
      delete progressTimers.current[docId];
    }
  }, []);

  const startSmoothProgress = useCallback(
    (docId: string) => {
      stopProgressTimer(docId);
      updateDocState(docId, {
        progress: 0,
        isDownloading: true,
        savedUri: null,
      });

      progressTimers.current[docId] = setInterval(() => {
        setDownloadStates((prev) => {
          const current = prev[docId];
          if (!current) return prev;
          const next =
            current.progress < PROGRESS_CAP
              ? Math.min(PROGRESS_CAP, current.progress + PROGRESS_STEP)
              : current.progress;
          return { ...prev, [docId]: { ...current, progress: next } };
        });
      }, PROGRESS_INTERVAL);
    },
    [stopProgressTimer, updateDocState],
  );

  function normalizeBase64(input: string) {
    const idx = input.indexOf("base64,");
    return idx >= 0 ? input.slice(idx + "base64,".length) : input;
  }

  const handleDownload = useCallback(
    async (doc: DocumentResult) => {
      const docId = doc.id;
      const currentState = downloadStates[docId];
      if (currentState?.isDownloading) return;

      if (Platform.OS !== "web") {
        const { granted } = await requestStoragePermission();
        if (!granted) return;
      }

      startSmoothProgress(docId);

      try {
        const rawBase64 = await downloadDocument({ docId: doc.id });
        const base64Data = normalizeBase64(rawBase64);

        if (Platform.OS === "web") {
          const docObj = (globalThis as any).document as Document | undefined;
          if (!docObj) {
            showMessageError(t("common.error"), t("edocs.downloadModal.error"));
            return;
          }
          // @ts-ignore
          const link = docObj.createElement("a");
          link.href = `data:application/pdf;base64,${base64Data}`;
          link.download = `${doc.name}.pdf`;
          link.click();

          stopProgressTimer(docId);
          updateDocState(docId, { progress: 1 });
          setTimeout(() => {
            updateDocState(docId, { isDownloading: false });
            showMessageSuccess(
              t("common.success"),
              t("edocs.downloadModal.success"),
            );
          }, COMPLETE_DELAY);
          return;
        }

        const safeName = doc.name.replace(/[^a-zA-Z0-9]/g, "_");
        const fileName = `${safeName}.pdf`;

        const downloadUri = await savePdfToDownloads(base64Data, fileName);
        const appUri = await savePdfBase64ToAppDir(base64Data, fileName);

        stopProgressTimer(docId);

        updateDocState(docId, { progress: 1 });

        setTimeout(async () => {
          updateDocState(docId, { isDownloading: false, savedUri: appUri });

          await showComplete(
            t("edocs.download.savedTitle", "Document enregistré"),
            t(
              "edocs.download.savedDesc",
              "Le document a été enregistré dans vos téléchargements.",
            ),
            downloadUri,
          );
        }, COMPLETE_DELAY);
      } catch (e) {
        console.log("[EDocsListScreen] Download error:", e);
        stopProgressTimer(docId);
        updateDocState(docId, {
          progress: 0,
          isDownloading: false,
          savedUri: null,
        });
        showMessageError(t("common.error"), t("edocs.downloadModal.error"));
      }
    },
    [
      downloadStates,
      startSmoothProgress,
      stopProgressTimer,
      updateDocState,
      downloadDocument,
      showComplete,
      showMessageError,
      showMessageSuccess,
      t,
    ],
  );

  const handleShare = useCallback(
    async (doc: DocumentResult) => {
      const state = downloadStates[doc.id];
      if (!state?.savedUri) return;

      const available = await Sharing.isAvailableAsync();
      if (!available) return;

      await Sharing.shareAsync(state.savedUri, {
        mimeType: "application/pdf",
        dialogTitle: t("edocs.share.dialogTitle", "Partager le document"),
        UTI: "com.adobe.pdf",
      });
    },
    [downloadStates, t],
  );
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDisplayDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

  const formatPeriod = () => {
    if (!startDate && !endDate) return t("edocs.list.allDates");
    if (startDate && !endDate) {
      const start = new Date(startDate).toLocaleDateString(
        selectedLanguage ?? undefined,
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
      return `${t("edocs.list.from")} ${start}`;
    }
    if (!startDate && endDate) {
      const end = new Date(endDate).toLocaleDateString(
        selectedLanguage ?? undefined,
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        },
      );
      return `${t("edocs.list.until")} ${end}`;
    }
    const start = new Date(startDate!).toLocaleDateString(
      selectedLanguage ?? undefined,
      {
        day: "2-digit",
        month: "short",
      },
    );
    const end = new Date(endDate!).toLocaleDateString(
      selectedLanguage ?? undefined,
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      },
    );
    return `${start} - ${end}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.filterSummary}>
        <View style={styles.filterRow}>
          <View style={styles.filterTag}>
            <Building2 size={14} color={BankingColors.white} />
            <TText style={styles.filterTagText} numberOfLines={1}>
              {accountName}
            </TText>
          </View>
          <View style={styles.filterTag}>
            <FileText size={14} color={BankingColors.white} />
            <TText
              style={styles.filterTagText}
              tKey={DOC_TYPE_LABELS[docType]}
            />
          </View>
        </View>
        <View style={styles.filterRow}>
          <View style={[styles.filterTag, styles.filterTagSecondary]}>
            <Calendar size={14} color={BankingColors.primary} />
            <TText style={styles.filterTagTextSecondary}>
              {formatPeriod()}
            </TText>
          </View>
        </View>
      </View>

      {totalCount > 0 && (
        <View style={styles.resultCountContainer}>
          <TText style={styles.resultCount}>
            {t("edocs.list.countFound", { count: totalCount })}
          </TText>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw
              size={18}
              color={
                isFetching ? BankingColors.textLight : BankingColors.primary
              }
            />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderDocument = ({ item }: { item: DocumentResult }) => {
    const state = downloadStates[item.id];
    const isDownloading = state?.isDownloading ?? false;
    const progress = state?.progress ?? 0;
    const savedUri = state?.savedUri ?? null;

    return (
      <View style={styles.documentCard}>
        <View style={styles.documentIconContainer}>
          <View style={styles.documentIcon}>
            <FileText size={28} color={BankingColors.primary} />
          </View>
          <View style={styles.extensionBadge}>
            <TText style={styles.extensionText}>
              {item.extension.toUpperCase()}
            </TText>
          </View>
        </View>

        <View style={styles.documentInfo}>
          <TText style={styles.documentName} numberOfLines={2}>
            {item.name}
          </TText>

          <View style={styles.documentMeta}>
            <View style={styles.metaItem}>
              <Calendar size={12} color={BankingColors.textSecondary} />
              <TText style={styles.metaText}>
                {formatDisplayDate(item.date)}
              </TText>
            </View>
            <View style={styles.metaItem}>
              <Building2 size={12} color={BankingColors.textSecondary} />
              <TText style={styles.metaText}>{item.accountNumber}</TText>
            </View>
          </View>
        </View>

        <DownloadActionButton
          isDownloading={isDownloading}
          progress={progress}
          savedUri={savedUri}
          onDownload={() => handleDownload(item)}
          onShare={() => handleShare(item)}
        />
      </View>
    );
  };

  const renderEmpty = () => (
    <ScreenState
      variant="empty"
      titleKey="edocs.list.emptyTitle"
      descriptionKey="edocs.list.emptyText"
      onRetry={() =>
        router.navigate({
          pathname: "/(root)/(tabs)/(menu)/edocs" as any,
          params: { reset: "1" },
        })
      }
    />
  );

  const renderError = () => (
    <View style={styles.errorContainer}>
      <TText style={styles.errorTitle} tKey="common.error" />
      <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
        <RefreshCw size={18} color={BankingColors.white} />
        <TText style={styles.retryButtonText} tKey="common.retry" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Stack.Screen
        options={{
          title: t("edocs.list.screenTitle"),
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: BankingColors.white,
          headerShadowVisible: false,
        }}
      />

      {isLoading ? (
        <View style={styles.loadingContainer}>
          {renderHeader()}
          <View style={styles.skeletonWrapper}>
            <DocumentSkeleton count={5} />
          </View>
        </View>
      ) : error ? (
        <View style={styles.content}>
          {renderHeader()}
          {renderError()}
        </View>
      ) : (
        <FlashList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          ListHeaderComponent={renderHeader}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          extraData={downloadStates}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1, padding: Spacing.lg },
  loadingContainer: { flex: 1, padding: Spacing.lg },
  skeletonWrapper: { marginTop: Spacing.lg },
  listContent: { padding: Spacing.lg },
  header: { marginBottom: Spacing.lg },
  filterSummary: { gap: Spacing.sm, marginBottom: Spacing.md },
  filterRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  filterTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs,
  },
  filterTagSecondary: {
    backgroundColor: BankingColors.primary + "15",
    borderWidth: 1,
    borderColor: BankingColors.primary,
  },
  filterTagText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.white,
    maxWidth: 150,
  },
  filterTagTextSecondary: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.primary,
  },
  resultCountContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BankingColors.white,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    ...Shadow.sm,
  },
  resultCount: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },

  documentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  documentIconContainer: { position: "relative" },
  documentIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center",
    alignItems: "center",
  },
  extensionBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    backgroundColor: BankingColors.warning,
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  extensionText: {
    fontSize: 9,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  documentInfo: { flex: 1 },
  documentName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    lineHeight: 20,
  },
  documentMeta: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: { fontSize: FontSize.xs, color: BankingColors.textSecondary },

  actionButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_RADIUS,
    justifyContent: "center",
    alignItems: "center",
  },
  downloadButtonStyle: {
    backgroundColor: BankingColors.primary,
    ...Shadow.button,
  },
  shareButtonStyle: {
    backgroundColor: BankingColors.primary + "15",
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
  },

  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing.xxxl * 2,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptyText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  newSearchButton: {
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    ...Shadow.button,
  },
  newSearchButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  errorContainer: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.error,
    ...Shadow.sm,
  },
  errorTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.error,
    marginBottom: Spacing.sm,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    ...Shadow.button,
  },
  retryButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
});
