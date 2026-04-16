import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  Platform,
} from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors, gradientColors } from "@/constants/banking-colors";
import {
  ChevronLeft,
  FileText,
  Download,
  MessageSquare,
  Copy,
  X,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Clipboard from "expo-clipboard";
import { getCurrencyByNumeric } from "@/utils/currency-helper";
import { formatBalance } from "@/utils/account-formatters";
import { BASE_URL } from "@/constants/base-url";
import { requestStoragePermission } from "@/utils/mediaPermission";
import useShowMessage from "@/hooks/useShowMessage";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { FontFamily } from "@/constants";

export default function SchoolingTransferDetailScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const [swiftModalVisible, setSwiftModalVisible] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const transfer = {
    id: params.id as string,
    schoolingFileId: params.schoolingFileId as string,
    transferMode: params.transferMode as string,
    transferType: params.transferType as string,
    amount: parseFloat(params.amount as string) || 0,
    currency: params.currency as string,
    status: params.status as string,
    comment: params.comment as string,
    executionDate: params.executionDate as string,
    feeType: params.feeType as string,
    attachment: params.attachment as string,
    studentName: params.studentName as string,
    fileRef: params.fileRef as string,
    swiftMessage: params.swiftMessage as string,
    swiftStatus: params.swiftStatus as string,
  };
  console.log(
    "🚀 ~ SchoolingTransferDetailScreen ~ transfer.comment:",
    transfer.comment,
  );

  const formatCurrency = (amount: number, currency: string) => {
    return formatBalance(amount, currency);
  };

  // const formatDate = (dateStr: string) => {
  //   if (!dateStr) return "-";
  //   const date = new Date(dateStr);
  //   return date.toLocaleDateString(undefined, {
  //     day: "2-digit",
  //     month: "2-digit",
  //     year: "numeric" });
  // };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return "#10B981";
      case "INIT":
        return "#F59E0B";
      case "REJECTED":
        return "#EF4444";
      default:
        return BankingColors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return <CheckCircle size={20} color="#10B981" />;
      case "INIT":
        return <Clock size={20} color="#F59E0B" />;
      case "REJECTED":
        return <XCircle size={20} color="#EF4444" />;
      default:
        return <Clock size={20} color={BankingColors.textSecondary} />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "EXECUTED":
        return t("schoolingTransferDetail.statusExecuted");
      case "INIT":
        return t("schoolingTransferDetail.statusInit");
      case "REJECTED":
        return t("schoolingTransferDetail.statusRejected");
      default:
        return status;
    }
  };

  const handleDownloadDocument = async () => {
    if (!transfer.attachment) {
      showMessageError(
        t("common.error"),
        t("schoolingTransferDetail.noDocument"),
      );
      return;
    }

    if (Platform.OS !== "web") {
      const { granted } = await requestStoragePermission();
      if (!granted) {
        console.log(
          "[SchoolingTransferDetail] Storage permission denied, blocking download",
        );
        return;
      }
    }

    setIsDownloading(true);
    try {
      const fileUrl = transfer.attachment.startsWith("http")
        ? transfer.attachment
        : `${BASE_URL}${transfer.attachment}`;

      // ✅ Web: open new tab safely (no TS "window" issues)
      if (Platform.OS === "web") {
        (globalThis as any)?.open?.(fileUrl, "_blank");
        showMessageSuccess(
          t("common.success"),
          t("schoolingTransferDetail.documentOpened"),
        );
        return;
      }

      // ✅ Native: download using legacy FS (no deprecation crash)
      const fileName =
        transfer.attachment
          .split("/")
          .pop()
          ?.replace(/[^a-zA-Z0-9._-]/g, "_") || "document.pdf";

      const fileUri = `${FileSystem.documentDirectory}${fileName}`;

      const downloadResult = await FileSystem.downloadAsync(fileUrl, fileUri);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status ${downloadResult.status}`);
      }

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(downloadResult.uri, {
          mimeType: "application/pdf",
          dialogTitle: fileName,
        });
      } else {
        showMessageSuccess(
          t("common.success"),
          t("schoolingTransferDetail.documentDownloaded"),
        );
      }
    } catch (error) {
      console.log("[SchoolingTransferDetail] Download error:", error);
      showMessageError(
        t("common.error"),
        t("schoolingTransferDetail.downloadError"),
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopySwiftMessage = async () => {
    if (transfer.swiftMessage) {
      await Clipboard.setStringAsync(transfer.swiftMessage);
      showMessageSuccess(
        t("common.success"),
        t("schoolingTransferDetail.swiftCopied"),
      );
    }
  };

  const renderHeader = () => (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.customHeader, { paddingTop: insets.top + 10 }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <TText style={styles.headerTitle}>
          {t("schoolingTransferDetail.title")}
        </TText>
        <View style={styles.backButton} />
      </View>
    </LinearGradient>
  );

  const renderInfoRow = (
    label: string,
    value: string | undefined,
    showDivider = true,
  ) => (
    <>
      <View style={styles.infoRow}>
        <TText style={styles.infoLabel}>{label}</TText>
        <TText style={styles.infoValue}>{value || "-"}</TText>
      </View>
      {showDivider && <View style={styles.divider} />}
    </>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: true, header: renderHeader }} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            {getStatusIcon(transfer.status)}
            <TText
              style={[
                styles.statusText,
                { color: getStatusColor(transfer.status) },
              ]}
            >
              {getStatusLabel(transfer.status)}
            </TText>
          </View>
          <TText style={styles.amountText}>
            {formatCurrency(transfer.amount, transfer.currency)}
          </TText>
          <TText style={styles.dateText}>{transfer.executionDate}</TText>
        </View>

        <View style={styles.section}>
          <TText style={styles.sectionTitle}>
            {t("schoolingTransferDetail.transferInfo")}
          </TText>
          <View style={styles.card}>
            {renderInfoRow(
              t("schoolingTransferDetail.referenceTransfer"),
              transfer.id,
            )}
            {renderInfoRow(
              t("schoolingTransferDetail.referenceFolder"),
              transfer.fileRef,
            )}
            {renderInfoRow(
              t("schoolingTransferDetail.type"),
              transfer.transferType,
            )}
            {renderInfoRow(
              t("schoolingTransferDetail.studentName"),
              transfer.studentName,
            )}
            {renderInfoRow(
              t("schoolingTransferDetail.amount"),
              formatCurrency(transfer.amount, transfer.currency),
              false,
            )}
          </View>
        </View>

        {transfer.comment && (
          <View style={styles.section}>
            <TText style={styles.sectionTitle}>
              {t("schoolingTransferDetail.comment")}
            </TText>
            <View style={styles.card}>
              <TText style={styles.commentText}>{transfer.comment}</TText>
            </View>
          </View>
        )}

        {transfer.attachment && (
          <View style={styles.section}>
            <TText style={styles.sectionTitle}>
              {t("schoolingTransferDetail.document")}
            </TText>
            <TouchableOpacity
              style={styles.documentCard}
              onPress={handleDownloadDocument}
              disabled={isDownloading}
              activeOpacity={0.7}
            >
              <View style={styles.documentIconContainer}>
                <FileText size={24} color={BankingColors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <TText style={styles.documentName}>
                  {transfer.attachment.split("/").pop() ||
                    t("schoolingTransferDetail.attachedDocument")}
                </TText>
                <TText style={styles.documentAction}>
                  {isDownloading
                    ? t("common.loading")
                    : t("schoolingTransferDetail.tapToDownload")}
                </TText>
              </View>
              <Download size={20} color={BankingColors.primary} />
            </TouchableOpacity>
          </View>
        )}

        {(transfer.swiftStatus || transfer.swiftMessage) && (
          <View style={styles.section}>
            <TText style={styles.sectionTitle}>
              {t("schoolingTransferDetail.swiftInfo")}
            </TText>
            <View style={styles.card}>
              {transfer.swiftStatus && (
                <>
                  <View style={styles.infoRow}>
                    <TText style={styles.infoLabel}>
                      {t("schoolingTransferDetail.swiftStatus")}
                    </TText>
                    <View style={styles.swiftStatusBadge}>
                      <TText style={styles.swiftStatusText}>
                        {transfer.swiftStatus}
                      </TText>
                    </View>
                  </View>
                  {transfer.swiftMessage && <View style={styles.divider} />}
                </>
              )}
              {transfer.swiftMessage && (
                <TouchableOpacity
                  style={styles.swiftMessageRow}
                  onPress={() => setSwiftModalVisible(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.swiftMessageLeft}>
                    <MessageSquare size={18} color={BankingColors.primary} />
                    <TText style={styles.swiftMessageLabel}>
                      {t("schoolingTransferDetail.swiftMessage")}
                    </TText>
                  </View>
                  <TText style={styles.viewButton}>
                    {t("schoolingTransferDetail.view")}
                  </TText>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={swiftModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSwiftModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <TText style={styles.modalTitle}>
                {t("schoolingTransferDetail.swiftMessage")}
              </TText>
              <TouchableOpacity
                onPress={() => setSwiftModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <X size={24} color={BankingColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <TText style={styles.swiftMessageText}>
                {transfer.swiftMessage}
              </TText>
            </ScrollView>

            <TouchableOpacity
              style={styles.copyButton}
              onPress={handleCopySwiftMessage}
              activeOpacity={0.7}
            >
              <Copy size={18} color="#FFFFFF" />
              <TText style={styles.copyButtonText}>
                {t("schoolingTransferDetail.copy")}
              </TText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  customHeader: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  statusCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: 16,
    padding: 24,
    alignItems: "center" as const,
    marginBottom: 20,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
  },
  amountText: {
    fontSize: 28,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: BankingColors.textSecondary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 16,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: BankingColors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    textAlign: "right" as const,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: BankingColors.border,
  },
  commentText: {
    fontSize: 14,
    color: BankingColors.text,
    lineHeight: 20,
  },
  documentCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  documentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: BankingColors.primary + "15",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    marginBottom: 2,
  },
  documentAction: {
    fontSize: 12,
    color: BankingColors.primary,
  },
  swiftStatusBadge: {
    backgroundColor: BankingColors.primary + "15",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  swiftStatusText: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  swiftMessageRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 12,
  },
  swiftMessageLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  swiftMessageLabel: {
    fontSize: 14,
    color: BankingColors.text,
  },
  viewButton: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  modalContent: {
    backgroundColor: BankingColors.surface,
    borderRadius: 16,
    width: "100%",
    maxHeight: "70%",
    overflow: "hidden" as const,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
    maxHeight: 300,
  },
  swiftMessageText: {
    fontSize: 13,
    color: BankingColors.text,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    lineHeight: 20,
  },
  copyButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: BankingColors.primary,
    margin: 16,
    marginTop: 0,
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  copyButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
});
