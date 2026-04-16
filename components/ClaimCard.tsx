import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Claim } from "@/types/claim.type";
import {
  AlertCircle,
  CreditCard,
  User,
  ShieldAlert,
  DollarSign,
  Settings,
  HelpCircle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
} from "lucide-react-native";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  AvatarSize,
  FontFamily,
} from "@/constants";
import TText from "./TText";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface ClaimCardProps {
  claim: Claim;
  accountNumber: string;
  onPress: () => void;
}

const getIconComponent = (iconName: string) => {
  const iconMap: Record<string, React.ComponentType<any>> = {
    "alert-circle": AlertCircle,
    "credit-card": CreditCard,
    user: User,
    "shield-alert": ShieldAlert,
    "dollar-sign": DollarSign,
    settings: Settings,
    "help-circle": HelpCircle,
  };
  return iconMap[iconName] || HelpCircle;
};

const getStatusColor = (status: Claim["status"]) => {
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

const getStatusIcon = (status: Claim["status"]) => {
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

const getStatusText = (status: Claim["status"]) => {
  switch (status) {
    case "PENDING":
      return "En attente";
    case "EXECUTED":
      return "Exécutée";
    case "REJECTED":
      return "Rejetée";
    default:
      return status;
  }
};

export default function ClaimCard({
  claim,
  onPress,
  accountNumber,
}: ClaimCardProps) {
  const IconComponent = HelpCircle;
  const StatusIcon = getStatusIcon(claim.status);
  const statusColor = getStatusColor(claim.status);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else {
      return date.toLocaleDateString(selectedLanguage ?? undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    }
  };
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: BankingColors.primary + "15" },
          ]}
        >
          <IconComponent size={IconSize.lg} color={BankingColors.primary} />
        </View>
        <View style={styles.headerContent}>
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {claim.claimSubject}
            </Text>
          </View>
          <Text style={styles.type}>
            {claim.categoryLabel ?? claim.subCategoryLabel ?? "-"}
          </Text>
          <TText style={styles.type}>
            <TText tKey="claim.details.account" />:{" "}
            <TText style={styles.type}>{accountNumber || "-"}</TText>
          </TText>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>
        {claim.description}
      </Text>

      <View style={styles.footer}>
        <View style={styles.statusContainer}>
          {/* <StatusIcon size={IconSize.sm} color={statusColor} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {getStatusText(claim.status)}
          </Text> */}
        </View>
        <View style={styles.metaContainer}>
          {claim.attachments.length > 0 && (
            <View style={styles.documentBadge}>
              <FileText size={IconSize.sm} color={BankingColors.textSlate} />
              <Text style={styles.documentCount}>
                {claim.attachments.length}
              </Text>
            </View>
          )}
          <Text style={styles.date}>{formatDate(claim.lastUpdate)}</Text>
        </View>
      </View>

      {claim.abtResponse && (
        <View
          style={[
            styles.responseBadge,
            { backgroundColor: statusColor + "10" },
          ]}
        >
          <Text style={[styles.responseText, { color: statusColor }]}>
            {claim.abtResponse}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: AvatarSize.lg,
    height: AvatarSize.lg,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textDark,
    flex: 1,
  },
  type: {
    fontSize: FontSize.sm,
    color: BankingColors.textSlate,
  },
  priorityBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  priorityText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
  },
  description: {
    fontSize: FontSize.base,
    color: BankingColors.textMedium,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  documentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  documentCount: {
    fontSize: FontSize.sm,
    color: BankingColors.textSlate,
    fontFamily: FontFamily.medium,
  },
  date: {
    fontSize: FontSize.sm,
    color: BankingColors.textSlate,
  },
  responseBadge: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignSelf: "flex-start",
  },
  responseText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
  },
});
