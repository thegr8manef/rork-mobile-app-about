import React from "react";
import { View, StyleSheet, TouchableOpacity, Switch } from "react-native";
import TText from "@/components/TText";
import { AlertConfig } from "@/types/notifications";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing, FontFamily } from "@/constants";
import { formatBalance } from "@/utils/account-formatters";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";
import { se } from "date-fns/locale";

interface AlertCardProps {
  alert: AlertConfig;
  accountName: string;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({
  alert,
  accountName,
  onToggle,
  onEdit,
  onDelete,
}) => {
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TText
            style={styles.name}
            tKey={
              alert.type === "overMvtD"
                ? "notifications.debitMovement"
                : "notifications.creditMovement"
            }
          />
          <Switch
            value={alert.enabled ?? false}
            onValueChange={onToggle}
            trackColor={{
              false: "#ccc",
              true: BankingColors.primaryLight,
            }}
            thumbColor={alert.enabled ? BankingColors.primary : "#f4f3f4"}
          />
        </View>
      </View>

      <View style={styles.details}>
        <View style={styles.detailRow}>
          <TText style={styles.label} tKey="notifications.account" />
          <TText style={styles.value} tKey={accountName} />
        </View>
        {alert.minAmount !== undefined && alert.minAmount > 0 && (
          <View style={styles.detailRow}>
            <TText style={styles.label} tKey="notifications.minAmount" />
            <TText style={styles.value}>
              {formatBalance(alert.minAmount, "TND")}
            </TText>
          </View>
        )}
        {alert.maxAmount !== undefined && alert.maxAmount > 0 && (
          <View style={styles.detailRow}>
            <TText style={styles.label} tKey="notifications.maxAmount" />
            <TText style={styles.value}>
              {formatBalance(alert.maxAmount, "TND")}
            </TText>
          </View>
        )}
        {alert.endDate && (
          <View style={styles.detailRow}>
            <TText style={styles.label} tKey="notifications.deadline" />
            <TText style={styles.value}>
              {new Date(alert.endDate).toLocaleDateString(
                selectedLanguage ?? undefined,
              )}
            </TText>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <TText style={styles.editButtonText} tKey="notifications.modify" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <TText style={styles.deleteButtonText} tKey="notifications.remove" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: "#1a1a1a",
    flex: 1,
  },
  details: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  label: {
    fontSize: 14,
    color: "#666",
  },
  value: {
    fontSize: Spacing.md,
    fontFamily: FontFamily.medium,
    color: "#1a1a1a",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BankingColors.primary,
    alignItems: "center",
  },
  editButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.primary,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    alignItems: "center",
  },
  deleteButtonText: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: "#666",
  },
});
