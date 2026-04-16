import React, { useMemo, useState, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  BackHandler,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Text } from "react-native";
import {
  ShieldX,
  ArrowLeft,
  AlertTriangle,
  ChevronDown,
  ChevronUp } from "lucide-react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import TText from "@/components/TText";
import { useFocusEffect } from "expo-router";

type ThreatParams = {
  type?:
    | "EMULATOR"
    | "ROOTED"
    | "DEV_OPTIONS"
    | "DEBUGGER"
    | "HOOKING"
    | "UNKNOWN_ERROR";
  reason?: string;
};

// ─── Change this to your personal secret code ───────────────────────────────
const DEV_SECRET = "1255";
const ICON_TAPS_REQUIRED = 5;
const TAP_WINDOW_MS = 3000;
// ─────────────────────────────────────────────────────────────────────────────

export default function AppBlockedScreen() {
  const { type, reason, details } = useLocalSearchParams<ThreatParams & { reason?: string; details?: string }>();
  const router = useRouter();

  const [tipsOpen, setTipsOpen] = useState(false);

  // ── Hidden dev detail ──────────────────────────────────────────────────────
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const iconTapCount = useRef(0);
  const iconTapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleIconTap = useCallback(() => {
    iconTapCount.current += 1;
    if (iconTapTimer.current) clearTimeout(iconTapTimer.current);
    if (iconTapCount.current >= ICON_TAPS_REQUIRED) {
      iconTapCount.current = 0;
      setShowPinModal(true);
    } else {
      iconTapTimer.current = setTimeout(() => {
        iconTapCount.current = 0;
      }, TAP_WINDOW_MS);
    }
  }, []);

  const handlePinCheck = useCallback((value: string) => {
    if (value.length < 4) return;
    if (value === DEV_SECRET) {
      setShowPinModal(false);
      setPinInput("");
      setPinError(false);
      router.push({
        pathname: "/(system)/app-blocked-info",
        params: { type, reason, details },
      } as any);
    } else {
      setPinError(true);
      setPinInput("");
    }
  }, [type, reason, details, router]);
  // ──────────────────────────────────────────────────────────────────────────

  const titleKey = "security.appBlocked.title";
  const subtitleKey = useMemo(() => {
    switch (type) {
      case "EMULATOR":
        return "security.appBlocked.subtitle.emulator";
      case "ROOTED":
        return "security.appBlocked.subtitle.rooted";
      case "DEV_OPTIONS":
        return "security.appBlocked.subtitle.devOptions";
      case "DEBUGGER":
        return "security.appBlocked.subtitle.debugger";
      case "HOOKING":
        return "security.appBlocked.subtitle.hooking";

      default:
        return "security.appBlocked.subtitle.generic";
    }
  }, [type]);
  const whyTitleKey = "security.appBlocked.whyTitle";
  const exitKey = "security.appBlocked.exitButton";
  const tipsTitleKey = "security.appBlocked.tipsTitle";

  const messageKey = useMemo(() => {
    if (type === "EMULATOR") return "security.appBlocked.message.emulator";
    if (type === "ROOTED") return "security.appBlocked.message.rooted";
    if (type === "DEV_OPTIONS") return "security.appBlocked.message.devOptions";
    if (type === "DEBUGGER") return "security.appBlocked.message.debugger";
    if (type === "HOOKING") return "security.appBlocked.message.hooking";

    return "security.appBlocked.message.generic";
  }, [type]);

  const reasonsKeys = useMemo(() => {
    const base = [
      "security.appBlocked.reason.base1",
      "security.appBlocked.reason.base2",
    ];

    if (type === "EMULATOR") {
      return [
        "security.appBlocked.reason.emulator1",
        "security.appBlocked.reason.emulator2",
        ...base,
      ];
    }

    if (type === "ROOTED") {
      return [
        "security.appBlocked.reason.rooted1",
        "security.appBlocked.reason.rooted2",
        ...base,
      ];
    }

    if (type === "DEV_OPTIONS") {
      return [
        "security.appBlocked.reason.dev1",
        "security.appBlocked.reason.dev2",
        ...base,
      ];
    }

    return base;
  }, [type]);

  const tipsKeys = useMemo(() => {
    if (type === "DEV_OPTIONS") {
      return [
        "security.appBlocked.tips.dev1",
        "security.appBlocked.tips.dev2",
        "security.appBlocked.tips.dev3",
      ];
    }
    if (type === "EMULATOR") {
      return ["security.appBlocked.tips.emu1", "security.appBlocked.tips.emu2"];
    }
    if (type === "ROOTED") {
      return [
        "security.appBlocked.tips.root1",
        "security.appBlocked.tips.root2",
      ];
    }
    return [];
  }, [type]);

  const toggleTips = useCallback(() => {
    setTipsOpen((v) => !v);
  }, []);

  const handleExitApp = useCallback(() => {
    BackHandler.exitApp();
  }, []);
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => true);
      return () => sub.remove();
    }, []),
  );

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BankingColors.error + "08", BankingColors.background]}
        style={styles.gradientBackground}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleIconTap}
          style={styles.iconContainer}
        >
          <View style={styles.iconCircle}>
            <ShieldX size={64} color={BankingColors.error} strokeWidth={1.8} />
          </View>
        </TouchableOpacity>

        {/* Title / Subtitle */}
        <TText tKey={titleKey} style={styles.title} />
        <TText tKey={subtitleKey} style={styles.subtitle} />

        {/* Main message */}
        <View style={styles.messageCard}>
          <TText tKey={messageKey} style={styles.messageText} />
        </View>
      

        <View style={styles.reasonsCard}>
          <View style={styles.reasonsHeader}>
            <AlertTriangle size={20} color={BankingColors.textPrimary} />
            <TText tKey={whyTitleKey} style={styles.reasonsTitle} />
          </View>

          <View style={styles.reasonsList}>
            {reasonsKeys.slice(0, 4).map((rk) => (
              <View key={rk} style={styles.reasonItem}>
                <View style={styles.reasonDot} />
                <TText tKey={rk} style={styles.reasonText} />
              </View>
            ))}
          </View>
        </View>

        {/* ✅ Collapsible tips (placed ABOVE exit button) */}
        {tipsKeys.length > 0 && (
          <View style={styles.tipsCard}>
            <TouchableOpacity
              onPress={toggleTips}
              activeOpacity={0.85}
              style={styles.tipsToggleRow}
            >
              <View style={styles.tipsHeaderLeft}>
                <AlertTriangle size={20} color={BankingColors.textPrimary} />
                <TText tKey={tipsTitleKey} style={styles.tipsTitle} />
              </View>

              <View style={styles.tipsHeaderRight}>
                {tipsOpen ? (
                  <ChevronUp size={18} color={BankingColors.textSecondary} />
                ) : (
                  <ChevronDown size={18} color={BankingColors.textSecondary} />
                )}
              </View>
            </TouchableOpacity>

            {tipsOpen && (
              <View style={styles.tipsList}>
                {tipsKeys.map((tk) => (
                  <View key={tk} style={styles.tipItem}>
                    <View style={styles.tipDot} />
                    <TText tKey={tk} style={styles.tipText} />
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Exit */}
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleExitApp}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={BankingColors.primary} />
          <TText tKey={exitKey} style={styles.secondaryButtonText} />
        </TouchableOpacity>

      </ScrollView>

      {/* ── Hidden PIN modal ── */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.pinOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.pinBox}>
              <TextInput
                style={[styles.pinInput, pinError && styles.pinInputError]}
                value={pinInput}
                onChangeText={(v) => {
                  const cleaned = v.replace(/[^0-9]/g, "");
                  setPinInput(cleaned);
                  setPinError(false);
                  handlePinCheck(cleaned);
                }}
                secureTextEntry
                keyboardType="number-pad"
                maxLength={4}
                autoFocus
                placeholder="••••"
                placeholderTextColor={BankingColors.textSecondary}
              />
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  gradientBackground: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300 },
  scrollContent: {
    padding: Spacing.xxl,
    paddingTop: Spacing.xxl * 2,
    paddingBottom: 60 },

  iconContainer: { alignItems: "center", marginBottom: Spacing.xl },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: BankingColors.error + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: BankingColors.error + "30" },

  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22 },

  messageCard: {
    backgroundColor: BankingColors.error + "08",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.error + "20" },
  messageText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20,
    textAlign: "center" },

  reasonsCard: {
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border },
  reasonsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md },
  reasonsTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary },
  reasonsList: { gap: Spacing.md },
  reasonItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm },
  reasonDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BankingColors.error,
    marginTop: 7 },
  reasonText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  tipsCard: {
    backgroundColor: BankingColors.surface,
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border },
  tipsToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.sm },
  tipsHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    flex: 1 },
  tipsTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    flexShrink: 1,
    flexWrap: "wrap" },

  tipsHeaderRight: {
    marginLeft: Spacing.sm },

  tipsToggleText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },
  tipsList: { gap: Spacing.md, marginTop: Spacing.md },
  tipItem: { flexDirection: "row", alignItems: "flex-start", gap: Spacing.sm },
  tipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BankingColors.primary,
    marginTop: 7 },
  tipText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  secondaryButton: {
    backgroundColor: BankingColors.surface,
    paddingVertical: Spacing.md + 2,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BankingColors.border },
  secondaryButtonText: {
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base },

  pinOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center" },
  pinBox: {
    backgroundColor: BankingColors.surface,
    borderRadius: 16,
    padding: Spacing.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.border,
    minWidth: 200 },
  pinInput: {
    width: "100%",
    fontSize: FontSize.xl,
    color: BankingColors.textPrimary,
    fontFamily: FontFamily.bold,
    letterSpacing: 12,
    paddingVertical: Spacing.sm,
    textAlign: "center" },
  pinInputError: {
    color: BankingColors.error } });
