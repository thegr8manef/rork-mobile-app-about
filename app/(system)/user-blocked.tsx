import React, { useRef, useState } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import {
  ShieldX,
  Phone,
  ArrowLeft,
  Headphones,
  ChevronRight,
  ChevronDown,
  Mail,
  Clock3,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily, LineHeight } from "@/constants/typography";
import { BorderRadius, Shadow } from "@/constants";
import TText from "@/components/TText";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function UserBlockedScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const workHoursY = useRef<number>(0);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded((v) => {
      if (!v) {
        // opening — scroll to work hours after animation
        setTimeout(() => {
          scrollRef.current?.scrollTo({ y: workHoursY.current, animated: true });
        }, 320);
      }
      return !v;
    });
  };

  const handleCallSupport = () => Linking.openURL("tel:71111345");
  const handleEmailSupport = () =>
    Linking.openURL("mailto:relation.client@attijaribank.com.tn");
  const handleBackToLogin = () => router.replace("/(auth)/login");

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[BankingColors.error + "10", BankingColors.background]}
        style={styles.gradientBackground}
      />

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Icon */}
        <View style={styles.iconContainer}>
          <View style={styles.iconCircle}>
            <ShieldX size={36} color={BankingColors.error} strokeWidth={1.8} />
          </View>
        </View>

        {/* Title + subtitle */}
        <TText tKey="system.blockedTitle" style={styles.title} />
        <TText tKey="system.blockedSubtitle" style={styles.subtitle} />

        {/* Message card */}
        <View style={styles.messageCard}>
          <TText tKey="system.blockedMessage" style={styles.messageText} />
        </View>

        {/* ── Assistance card (collapsible) ── */}
        <View style={styles.assistanceSection}>
          <LinearGradient
            colors={[BankingColors.primary + "12", "#FFFFFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.assistanceGradient}
          >
            {/* Header — tap to collapse/expand */}
            <TouchableOpacity
              style={styles.assistanceHeader}
              onPress={toggleExpand}
              activeOpacity={0.85}
            >
              <View style={styles.assistanceIconContainer}>
                <Headphones size={22} color={BankingColors.primary} />
              </View>
              <View style={styles.assistanceHeaderContent}>
                <TText tKey="claimsHome.needHelp" style={styles.assistanceTitle} />
                <TText tKey="common.support" style={styles.assistanceSubtitle} />
              </View>
              <View style={styles.expandChevronWrap}>
                <ChevronDown
                  size={16}
                  color={BankingColors.primary}
                  style={{ transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] }}
                />
              </View>
            </TouchableOpacity>

            {/* Description */}
            <TText
              tKey="claimsHome.helpDescription.partOne"
              style={styles.assistanceDescription}
              numberOfLines={isExpanded ? undefined : 2}
            />

            {/* Actions — always visible */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={handleCallSupport}
                activeOpacity={0.85}
              >
                <View style={styles.actionIconCircle}>
                  <Phone size={18} color={BankingColors.white} />
                </View>
                <View style={styles.actionTextWrap}>
                  <TText tKey="claims.contactPhone" style={styles.actionTitle} />
                  <TText tKey="common.call" style={styles.actionSubtitle} />
                </View>
                <ChevronRight size={18} color={BankingColors.white} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryAction}
                onPress={handleEmailSupport}
                activeOpacity={0.85}
              >
                <View style={styles.secondaryIconCircle}>
                  <Mail size={18} color={BankingColors.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <TText tKey="common.email" style={styles.secondaryTitle} />
                  <TText style={styles.secondarySubtitle}>
                    relation.client@attijaribank.com.tn
                  </TText>
                </View>
                <ChevronRight size={18} color={BankingColors.primary} />
              </TouchableOpacity>
            </View>

            {/* Work hours — only when expanded */}
            {isExpanded && (
              <>
                <View
                  style={styles.divider}
                  onLayout={(e) => { workHoursY.current = e.nativeEvent.layout.y; }}
                />

                <View style={styles.workHoursCard}>
                  <View style={styles.workHoursHeader}>
                    <View style={styles.workHoursIconWrap}>
                      <Clock3 size={18} color={BankingColors.primary} />
                    </View>
                    <TText tKey="claimsHome.workHours.title" style={styles.workHoursTitle} />
                  </View>

                  <View style={styles.workHourItem}>
                    <TText tKey="claimsHome.workHours.doubleSessionLabel" style={styles.workHourLabel} />
                    <TText tKey="claimsHome.workHours.doubleSessionValue" style={styles.workHourText} />
                  </View>

                  <View style={styles.workHourItem}>
                    <TText tKey="claimsHome.workHours.singleSessionLabel" style={styles.workHourLabel} />
                    <TText tKey="claimsHome.workHours.singleSessionValue" style={styles.workHourText} />
                  </View>

                  <View style={styles.workHourItem}>
                    <TText tKey="claimsHome.workHours.ramadanLabel" style={styles.workHourLabel} />
                    <TText tKey="claimsHome.workHours.ramadanValue" style={styles.workHourText} />
                  </View>
                </View>

                {/* Collapse button */}
                <TouchableOpacity
                  style={styles.collapseButton}
                  onPress={toggleExpand}
                  activeOpacity={0.85}
                >
                  <TText tKey="claimsHome.reduce" style={styles.collapseText} />
                  <ChevronDown
                    size={16}
                    color={BankingColors.primary}
                    style={{ transform: [{ rotate: "180deg" }] }}
                  />
                </TouchableOpacity>
              </>
            )}
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToLogin}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={BankingColors.primary} />
          <TText tKey="system.returnToLogin" style={styles.secondaryButtonText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  gradientBackground: { position: "absolute", top: 0, left: 0, right: 0, height: 280 },
  scrollContent: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },

  iconContainer: { alignItems: "center", marginBottom: Spacing.md },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BankingColors.error + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: BankingColors.error + "25",
  },

  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: FontSize.md * LineHeight.relaxed,
  },

  messageCard: {
    backgroundColor: BankingColors.error + "08",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: BankingColors.error + "20",
  },
  messageText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.base * LineHeight.relaxed,
    textAlign: "center",
  },

  assistanceSection: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: BankingColors.white,
    marginBottom: Spacing.xl,
    ...Shadow.card,
  },
  assistanceGradient: { padding: Spacing.lg, gap: Spacing.md },

  assistanceHeader: { flexDirection: "row", alignItems: "center" },
  assistanceIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary + "25",
  },
  assistanceHeaderContent: { flex: 1, marginLeft: Spacing.md },
  assistanceTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
  },
  assistanceSubtitle: {
    marginTop: 2,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
  },
  expandChevronWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BankingColors.primary + "12",
    borderWidth: 1,
    borderColor: BankingColors.primary + "22",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.md,
  },

  assistanceDescription: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
    lineHeight: FontSize.sm * LineHeight.relaxed,
  },

  actionsRow: { gap: Spacing.md },
  actionTextWrap: { flex: 1 },

  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    minHeight: 70,
    ...Shadow.button,
  },
  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF30",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  actionSubtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.regular,
    color: "#FFFFFFCC",
  },

  secondaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: 74,
  },
  secondaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  secondarySubtitle: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    lineHeight: 18,
  },

  divider: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    opacity: 0.85,
  },

  workHoursCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.md,
  },
  workHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  workHoursIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm,
  },
  workHoursTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
  },
  workHourItem: { marginBottom: Spacing.md },
  workHourLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: 4,
  },
  workHourText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20,
  },

  collapseButton: {
    marginTop: Spacing.sm,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BankingColors.primary + "12",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  collapseText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },

  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: BankingColors.background,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
  },
  secondaryButton: {
    backgroundColor: BankingColors.surface,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  secondaryButtonText: {
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold,
    fontSize: FontSize.base,
  },
});
