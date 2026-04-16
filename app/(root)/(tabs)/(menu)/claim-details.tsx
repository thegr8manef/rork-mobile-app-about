import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useTranslation } from "react-i18next";
import { router, useLocalSearchParams } from "expo-router";
import { useClaimDetail, useDownloadClaimAttachment } from "@/hooks/use-claims";
import {
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  MessageSquare,
} from "lucide-react-native";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  FontFamily,
} from "@/constants";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";
import useShowMessage from "@/hooks/useShowMessage";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

const getStatusColor = (status: string) => {
  switch (status) {
    case "PENDING":
      return "#FF9500";
    case "EXECUTED":
      return "#34C759";
    case "REJECTED":
      return "#FF3B30";
    default:
      return "#8E8E93";
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "PENDING":
      return Clock;
    case "EXECUTED":
      return CheckCircle;
    case "REJECTED":
      return XCircle;
    default:
      return Clock;
  }
};

export default function ClaimDetailsScreen() {
  const { t } = useTranslation();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const { claimId, accountNumber } = useLocalSearchParams<{
    claimId?: string;
    accountNumber?: string | string[];
  }>();

  const accNum =
    (Array.isArray(accountNumber) ? accountNumber[0] : accountNumber)?.trim() ||
    "-";

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  // ✅ Missing claimId => error friendly state
  if (!claimId) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("claim.details.notFound")}
      />
    );
  }

  // ✅ Query
  const { data: claim, isLoading, isError, refetch } = useClaimDetail(claimId);
  const isService = claim?.categoryLabel.includes("service");
  const downloadAttachment = useDownloadClaimAttachment();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={BankingColors.primary} />
      </View>
    );
  }

  // ✅ Error
  if (isError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={t("claim.details.loadingError") ?? t("common.tryAgain")}
        onRetry={() => refetch()}
      />
    );
  }

  // ✅ Not found / empty
  if (!claim) {
    return (
      <ScreenState
        variant="empty"
        title={t("claim.details.notFound")}
        description={
          t("claim.details.notFoundDescription") ?? t("common.tryAgain")
        }
      />
    );
  }

  const IconComponent = HelpCircle;
  const StatusIcon = getStatusIcon(claim.status);
  const statusColor = getStatusColor(claim.status);

  const handleViewDocument = async (
    attachmentId: string,
    attachmentName: string,
  ) => {
    try {
      await downloadAttachment.mutateAsync({
        claimId: claim.id,
        attachmentId,
      });
      showMessageSuccess(t("claim.details.downloadDocument"), attachmentName);
    } catch (error) {
      console.error("Error downloading document:", error);
      showMessageError(
        t("claim.create.error"),
        t("claim.details.downloadError"),
      );
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: BankingColors.primary + "15" },
            ]}
          >
            <IconComponent size={IconSize.xxxl} color={BankingColors.primary} />
          </View>
          <View style={styles.headerContent}>
            <TText style={styles.title}>{claim.claimSubject ?? "-"}</TText>
            <TText style={styles.type}>
              {claim.categoryLabel ?? claim.subCategoryLabel ?? "-"}
            </TText>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusBadge}>
              <StatusIcon size={IconSize.md} color={statusColor} />
              <TText
                tKey={`claim.status.${String(claim.status).toLowerCase()}`}
                style={[styles.statusText, { color: statusColor }]}
              />
            </View>

            {/* <View
              style={[
                styles.priorityBadge,
                { backgroundColor: BankingColors.primary + "15" },
              ]}
            >
              <TText
                style={[styles.priorityText, { color: BankingColors.primary }]}
              >
                {claim.notificationChannel ?? "-"}
              </TText>
            </View> */}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MessageSquare size={IconSize.md} color={BankingColors.text} />
            <TText
              tKey="claim.details.description"
              style={styles.sectionTitle}
            />
          </View>
          <TText style={styles.description}>{claim.description ?? "-"}</TText>
        </View>

        {claim.abtResponse && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MessageSquare size={IconSize.md} color={BankingColors.text} />
              <TText
                tKey="claim.details.responseAbt"
                style={styles.sectionTitle}
              />
            </View>
            <TText style={styles.description}>{claim.abtResponse}</TText>
          </View>
        )}
        {claim.attachments?.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={IconSize.md} color={BankingColors.text} />
              <TText tKey="claim.details.documents" style={styles.sectionTitle}>
                {` (${claim.attachments.length})`}
              </TText>
            </View>

            {claim.attachments.map((doc: any) => (
              <TouchableOpacity
                key={doc.id}
                style={styles.documentItem}
                onPress={() => handleViewDocument(doc.id, doc.name)}
                activeOpacity={0.7}
                disabled={downloadAttachment.isPending}
              >
                <View style={styles.documentIcon}>
                  <FileText size={IconSize.md} color={BankingColors.primary} />
                </View>
                <View style={styles.documentInfo}>
                  <TText style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </TText>
                  <TText style={styles.documentSize}>
                    {doc.uploadedDate ? formatDate(doc.uploadedDate) : "-"}
                  </TText>
                </View>
                {downloadAttachment.isPending && (
                  <ActivityIndicator
                    size="small"
                    color={BankingColors.primary}
                  />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={IconSize.md} color={BankingColors.text} />
            <TText tKey="claim.details.timeline" style={styles.sectionTitle} />
          </View>

          <View style={styles.timeline}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <TText
                  tKey="claim.details.claimCreated"
                  style={styles.timelineTitle}
                />
                <TText style={styles.timelineDate}>
                  {claim.creationDate ? formatDate(claim.creationDate) : "-"}
                </TText>
              </View>
            </View>

            {!isService && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />

                <View style={styles.timelineContent}>
                  <TText
                    tKey="claim.details.incidentDate"
                    style={styles.timelineTitle}
                  />
                  <TText style={styles.timelineDate}>
                    {claim.incidentDate ? formatDate(claim.incidentDate) : "-"}
                  </TText>
                </View>
              </View>
            )}
            {claim.lastUpdate && claim.lastUpdate !== claim.creationDate && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <TText
                    tKey="claim.details.lastUpdate"
                    style={styles.timelineTitle}
                  />
                  <TText style={styles.timelineDate}>
                    {formatDate(claim.lastUpdate)}
                  </TText>
                </View>
              </View>
            )}
          </View>
        </View>

        <View style={styles.infoCard}>
          {/* <TText style={styles.infoText}>
            <TText tKey="claim.details.reference" />:{" "}
            <TText style={styles.infoValue}>{claim.reference || "-"}</TText>
          </TText> */}

          <TText style={styles.infoText}>
            <TText tKey="claim.details.account" />:{" "}
            <TText style={styles.infoValue}>{accNum || "-"}</TText>
          </TText>

          {/* <TText style={styles.infoText}>
            <TText tKey="claim.details.notification" />:{" "}
            <TText style={styles.infoValue}>
              {claim.notificationCoordinates ?? "-"}
            </TText>
          </TText> */}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.background,
  },
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    ...Shadow.card,
  },
  iconContainer: {
    width: IconSize.huge * 1.33,
    height: IconSize.huge * 1.33,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  type: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  statusCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  priorityText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
  section: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.sm,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  description: {
    fontSize: FontSize.base,
    lineHeight: 22,
    color: BankingColors.text,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  documentIcon: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  documentSize: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  timeline: {
    gap: Spacing.lg,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  timelineDot: {
    width: Spacing.md,
    height: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.primary,
    marginTop: Spacing.xs,
    marginRight: Spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  timelineDate: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  infoCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    gap: Spacing.sm,
    ...Shadow.sm,
  },
  infoText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  infoValue: {
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
});
