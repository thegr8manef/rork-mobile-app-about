import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SchoolingFolder } from "@/types/banking";
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
import { GraduationCap, Calendar } from "lucide-react-native";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface SchoolingFolderCardProps {
  folder: SchoolingFolder;
  onPress: () => void;
}

export default function SchoolingFolderCard({
  folder,
  onPress,
}: SchoolingFolderCardProps) {
  const progressPercentage =
    ((folder.totalAmount - folder.remainingAmount) / folder.totalAmount) * 100;

  const getStatusColor = () => {
    switch (folder.status) {
      case "active":
        return BankingColors.success;
      case "completed":
        return BankingColors.textSecondary;
      case "inactive":
        return BankingColors.error;
      default:
        return BankingColors.textSecondary;
    }
  };

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "No payments yet";
    const date = new Date(dateString);
    return date.toLocaleDateString(selectedLanguage ?? undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
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
            { backgroundColor: BankingColors.primary + "20" },
          ]}
        >
          <GraduationCap size={IconSize.lg} color={BankingColors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.schoolName} numberOfLines={1}>
            {folder.schoolName}
          </Text>
          <Text style={styles.studentName} numberOfLines={1}>
            {folder.studentName}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor() + "20" },
          ]}
        >
          <Text style={[styles.statusText, { color: getStatusColor() }]}>
            {folder.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.gradeRow}>
        <Text style={styles.gradeLabel}>Grade: {folder.grade}</Text>
        <Text style={styles.yearLabel}>{folder.academicYear}</Text>
      </View>

      <View style={styles.amountSection}>
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Remaining</Text>
          <Text style={styles.remainingAmount}>
            {formatBalance(folder.remainingAmount, folder.currency)}
          </Text>
        </View>
        <View style={styles.amountRow}>
          <Text style={styles.totalLabel}>
            Total: {formatBalance(folder.totalAmount, folder.currency)}
          </Text>
        </View>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${progressPercentage}%`,
                backgroundColor:
                  folder.status === "completed"
                    ? BankingColors.success
                    : BankingColors.primary,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {progressPercentage ? progressPercentage.toFixed(0) : "0"}% paid
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Calendar size={IconSize.sm} color={BankingColors.textSecondary} />
          <Text style={styles.footerText}>
            Last payment: {formatDate(folder.lastPaymentDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  iconContainer: {
    width: AvatarSize.lg,
    height: AvatarSize.lg,
    borderRadius: AvatarSize.lg / 2,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  schoolName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  studentName: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold,
  },
  gradeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  gradeLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.semibold,
  },
  yearLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  amountSection: {
    marginBottom: Spacing.md,
  },
  amountRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xs,
  },
  amountLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  remainingAmount: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  totalLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  progressContainer: {
    marginBottom: Spacing.md,
  },
  progressBar: {
    height: Spacing.sm,
    backgroundColor: BankingColors.border,
    borderRadius: BorderRadius.xs,
    overflow: "hidden",
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: "100%",
    borderRadius: BorderRadius.xs,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  footerText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
});
