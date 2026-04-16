import React, { useMemo } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Text,
  BackHandler,
} from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { useCallback } from "react";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";

type InfoParams = {
  type?: string;
  reason?: string;
  details?: string;
};

export default function AppBlockedInfoScreen() {
  const { type, reason, details } = useLocalSearchParams<InfoParams>();
  const router = useRouter();

  // Block hardware back — user must press the visible back button (which resets state)
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        router.back();
        return true;
      });
      return () => sub.remove();
    }, [router])
  );

  const parsedDetails = useMemo(() => {
    if (!details) return null;
    try {
      return JSON.parse(details);
    } catch {
      return details;
    }
  }, [details]);

  const renderValue = (val: unknown, indent = 0): React.ReactNode => {
    if (val === null || val === undefined) return <Text style={styles.valNull}>null</Text>;
    if (typeof val === "boolean")
      return <Text style={val ? styles.valTrue : styles.valFalse}>{String(val)}</Text>;
    if (typeof val === "number") return <Text style={styles.valNumber}>{String(val)}</Text>;
    if (typeof val === "string") return <Text style={styles.valString}>"{val}"</Text>;
    if (typeof val === "object" && !Array.isArray(val)) {
      return (
        <View style={{ marginLeft: indent * 8 }}>
          {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}: </Text>
              {renderValue(v, indent + 1)}
            </View>
          ))}
        </View>
      );
    }
    if (Array.isArray(val)) {
      return (
        <View style={{ marginLeft: indent * 8 }}>
          {(val as unknown[]).map((item, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailKey}>[{i}] </Text>
              {renderValue(item, indent + 1)}
            </View>
          ))}
        </View>
      );
    }
    return <Text style={styles.valString}>{String(val)}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={22} color={BankingColors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Debug Info</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Type */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THREAT TYPE</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: BankingColors.error + "20", borderColor: BankingColors.error + "40" }]}>
              <Text style={[styles.badgeText, { color: BankingColors.error }]}>{type ?? "—"}</Text>
            </View>
          </View>
        </View>

        {/* Reason */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>REASON</Text>
          <View style={styles.valueCard}>
            <Text style={styles.reasonText}>{reason ?? "—"}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>DETAILS</Text>
          <View style={styles.detailsCard}>
            {parsedDetails != null ? (
              renderValue(parsedDetails)
            ) : (
              <Text style={styles.valNull}>—</Text>
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d1a" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 56,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "#1e1e3a",
    gap: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: BankingColors.primary + "18",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: "#00ff88",
    fontFamily: FontFamily.bold,
    fontSize: FontSize.lg,
    letterSpacing: 0.5,
  },

  content: {
    padding: Spacing.xl,
    paddingBottom: 60,
    gap: Spacing.xl,
  },

  section: { gap: Spacing.sm },
  sectionLabel: {
    color: "#555",
    fontFamily: FontFamily.semibold,
    fontSize: 10,
    letterSpacing: 1.5,
  },

  badgeRow: { flexDirection: "row" },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontFamily: FontFamily.bold,
    fontSize: FontSize.sm,
    letterSpacing: 0.5,
  },

  valueCard: {
    backgroundColor: "#141428",
    borderRadius: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#1e1e3a",
  },
  reasonText: {
    color: "#e0e0e0",
    fontFamily: FontFamily.regular,
    fontSize: FontSize.sm,
    lineHeight: 20,
  },

  detailsCard: {
    backgroundColor: "#141428",
    borderRadius: 10,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#1e1e3a",
    gap: 6,
  },
  detailRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  detailKey: {
    color: "#888",
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.xs,
  },
  valNull: { color: "#555", fontFamily: FontFamily.regular, fontSize: FontSize.xs },
  valTrue: { color: "#00ff88", fontFamily: FontFamily.semibold, fontSize: FontSize.xs },
  valFalse: { color: "#ff4444", fontFamily: FontFamily.semibold, fontSize: FontSize.xs },
  valNumber: { color: "#7eb8ff", fontFamily: FontFamily.semibold, fontSize: FontSize.xs },
  valString: { color: "#f0a050", fontFamily: FontFamily.regular, fontSize: FontSize.xs, flexShrink: 1 },
});
