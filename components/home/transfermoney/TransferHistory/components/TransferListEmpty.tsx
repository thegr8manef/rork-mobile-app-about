import React from "react";
import { View, StyleSheet } from "react-native";
import { Inbox, AlertTriangle } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import TText from "@/components/TText";

export default function EmptyState({ unavailable }: { unavailable?: boolean }) {
  if (unavailable) {
    return (
      <View style={styles.container}>
        <View style={styles.unavailableIconWrap}>
          <AlertTriangle size={28} color={BankingColors.warning} />
        </View>
        <TText tKey="common.serviceUnavailableTitle" style={styles.unavailableTitle} />
        <TText tKey="common.serviceUnavailableDesc" style={styles.unavailableSubtitle} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Inbox size={26} color={BankingColors.textSecondary} />
      </View>
      <TText tKey="transferHistory.empty" style={styles.text} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 70, alignItems: "center", paddingHorizontal: 32 },

  iconWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  text: {
    fontSize: 16,
    color: BankingColors.textSecondary,
    textAlign: "center",
  },

  unavailableIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BankingColors.warningLighter,
    borderWidth: 1,
    borderColor: BankingColors.warningLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  unavailableTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: BankingColors.warningDark,
    textAlign: "center",
    marginBottom: 8,
  },
  unavailableSubtitle: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
