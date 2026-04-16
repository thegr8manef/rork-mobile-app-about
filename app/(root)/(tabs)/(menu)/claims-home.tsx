import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  LayoutAnimation,
  Platform,
  UIManager } from "react-native";
import { router } from "expo-router";
import { useClaims } from "@/hooks/use-claims";
import {
  AlertTriangle,
  Wrench,
  FileText,
  ChevronRight,
  Headphones,
  Phone,
  Mail,
  ChevronDown,
  Clock3 } from "lucide-react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { LinearGradient } from "expo-linear-gradient";

import ApiErrorState from "@/components/Apierrorstate";
import ClaimHomeSkeleton from "@/components/ClaimSkeleton";

type ClaimType = "RECLAMATION" | "SERVICE" | "TECHNICAL";

interface ClaimTypeConfig {
  id: ClaimType;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
  borderColor: string;
  categoryId: string;
  type: string;
}

const CLAIM_TYPES: ClaimTypeConfig[] = [
  {
    id: "TECHNICAL",
    titleKey: "claimsHome.technicalProblem.title",
    descriptionKey: "claimsHome.technicalProblem.description",
    icon: Wrench,
    color: "#E53935",
    bgColor: "#FFEBEE",
    borderColor: "#FFCDD2",
    categoryId: "106",
    type: "3" },
  {
    id: "RECLAMATION",
    titleKey: "claimsHome.complaint.title",
    descriptionKey: "claimsHome.complaint.description",
    icon: AlertTriangle,
    color: "#FF9800",
    bgColor: "#FFF3E0",
    borderColor: "#FFE0B2",
    categoryId: "",
    type: "1" },
  {
    id: "SERVICE",
    titleKey: "claimsHome.serviceRequest.title",
    descriptionKey: "claimsHome.serviceRequest.description",
    icon: FileText,
    color: "#43A047",
    bgColor: "#E8F5E9",
    borderColor: "#C8E6C9",
    categoryId: "105",
    type: "2" },
];

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ClaimsHomeScreen() {
  const { t } = useTranslation();
  const [isHelpExpanded, setIsHelpExpanded] = useState(false);

  const { data, isLoading, isFetching, isError, refetch } = useClaims({
    limit: 100 });

  const claims = useMemo(() => {
    return data?.pages.flatMap((page) => page.data).filter(Boolean) || [];
  }, [data]);

  const pendingCounts = useMemo(() => {
    const pending = claims.filter((c) => c.status === "PENDING");

    return {
      RECLAMATION: pending.filter((c) => {
        const cat = Number(c.category);

        const isReclamationCategory =
          Number.isFinite(cat) && cat >= 101 && cat <= 104;
        const isReclamationCategoryNull = c.category === null;
        const label = (c.categoryLabel ?? "").toLowerCase();
        const keywords = ["réclamation", "banque", "paiement", "financement"];
        const isReclamationLabel = keywords.some((k) => label.includes(k));

        return (
          isReclamationCategory ||
          isReclamationLabel ||
          isReclamationCategoryNull
        );
      }).length,

      SERVICE: pending.filter(
        (c) =>
          c.category === "105" ||
          c.category === "3" ||
          c.categoryLabel?.toLowerCase().includes("information")
      ).length,

      TECHNICAL: pending.filter(
        (c) =>
          c.category === "106" ||
          c.category === "1" ||
          c.categoryLabel?.toLowerCase().includes("technique")
      ).length,

      total: pending.length };
  }, [claims]);

  const handleClaimTypePress = (claimType: ClaimTypeConfig) => {
    router.navigate({
      pathname: "/create-claim",
      params: {
        categoryId: claimType.categoryId,
        type: claimType.type,
        claimTypeId: claimType.id } } as any);
  };

  const handleViewAllPress = () => {
    router.navigate("/claims" as any);
  };

  const handleCallSupport = () => {
    Linking.openURL("tel:71111345");
  };

  const handleEmailSupport = () => {
    Linking.openURL("mailto:relation.client@attijaribank.com.tn");
  };

  const toggleHelp = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsHelpExpanded((v) => !v);
  };

  if (isLoading || (isFetching && claims.length === 0)) {
    return <ClaimHomeSkeleton />;
  }

  if (isError) {
    return (
      <ApiErrorState
        title={t("common.error")}
        description={
          t("claimsHome.loadingError") || "Impossible de charger vos demandes."
        }
        onRetry={refetch}
      />
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.summarySection}>
        <View style={styles.summaryHeader}>
          <TText tKey="claimsHome.myRequests" style={styles.summaryTitle} />
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={handleViewAllPress}
            activeOpacity={0.7}
          >
            <TText tKey="claimsHome.viewAll" style={styles.viewAllText} />
            <ChevronRight size={16} color={BankingColors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.countersRow}>
          <View style={[styles.counterCard, { borderLeftColor: "#FF9800" }]}>
            <TText tKey="claimsHome.complaints" style={styles.counterLabel} />
            <TText style={[styles.counterValue, { color: "#FF9800" }]}>
              {pendingCounts.RECLAMATION}
            </TText>
          </View>

          <View style={[styles.counterCard, { borderLeftColor: "#43A047" }]}>
            <TText tKey="claimsHome.services" style={styles.counterLabel} />
            <TText style={[styles.counterValue, { color: "#43A047" }]}>
              {pendingCounts.SERVICE}
            </TText>
          </View>

          <View style={[styles.counterCard, { borderLeftColor: "#E53935" }]}>
            <TText
              tKey="claimsHome.technicalProblems"
              style={styles.counterLabel}
            />
            <TText style={[styles.counterValue, { color: "#E53935" }]}>
              {pendingCounts.TECHNICAL}
            </TText>
          </View>
        </View>
      </View>

      <View style={styles.typesSection}>
        {CLAIM_TYPES.map((type) => {
          const IconComponent = type.icon;

          return (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeCard,
                { borderLeftColor: type.color, borderLeftWidth: 4 },
              ]}
              onPress={() => handleClaimTypePress(type)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.typeIconContainer,
                  { backgroundColor: type.bgColor },
                ]}
              >
                <IconComponent size={24} color={type.color} />
              </View>

              <View style={styles.typeContent}>
                <TText tKey={type.titleKey} style={styles.typeTitle} />
                <TText
                  tKey={type.descriptionKey}
                  style={styles.typeDescription}
                  numberOfLines={2}
                />
              </View>

              <View
                style={[
                  styles.arrowContainer,
                  { backgroundColor: type.bgColor },
                ]}
              >
                <ChevronRight size={20} color={type.color} />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.assistanceSection}>
        <LinearGradient
          colors={[BankingColors.primary + "12", "#FFFFFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.assistanceGradient}
        >
          <TouchableOpacity
            style={styles.assistanceHeader}
            onPress={toggleHelp}
            activeOpacity={0.85}
          >
            <View style={styles.assistanceIconContainer}>
              <Headphones size={22} color={BankingColors.primary} />
            </View>

            <View style={styles.assistanceHeaderContent}>
              <TText
                tKey="claimsHome.needHelp"
                style={styles.assistanceTitle}
              />
              <TText tKey="common.support" style={styles.assistanceSubtitle} />
            </View>

            <View style={styles.expandChevronWrap}>
              <ChevronDown
                size={18}
                color={BankingColors.primary}
                style={{
                  transform: [{ rotate: isHelpExpanded ? "180deg" : "0deg" }] }}
              />
            </View>
          </TouchableOpacity>

          {!isHelpExpanded ? (
            <TText
              tKey="claimsHome.helpDescription.partOne"
              style={styles.assistanceDescriptionCollapsed}
              numberOfLines={2}
            />
          ) : (
            <View style={styles.expandedContent}>
              <TText
                tKey="claimsHome.helpDescription.partOne"
                style={styles.assistanceDescription}
              />

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
                    <TText style={styles.actionTitle} tKey="claims.contactPhone" />
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

              <View style={styles.divider} />

              <View style={styles.workHoursCard}>
                <View style={styles.workHoursHeader}>
                  <View style={styles.workHoursIconWrap}>
                    <Clock3 size={18} color={BankingColors.primary} />
                  </View>
                  <TText
                    tKey="claimsHome.workHours.title"
                    style={styles.workHoursTitle}
                  />
                </View>

                <View style={styles.workHourItem}>
                  <TText
                    tKey="claimsHome.workHours.doubleSessionLabel"
                    style={styles.workHourLabel}
                  />
                  <TText
                    tKey="claimsHome.workHours.doubleSessionValue"
                    style={styles.workHourText}
                  />
                </View>

                <View style={styles.workHourItem}>
                  <TText
                    tKey="claimsHome.workHours.singleSessionLabel"
                    style={styles.workHourLabel}
                  />
                  <TText
                    tKey="claimsHome.workHours.singleSessionValue"
                    style={styles.workHourText}
                  />
                </View>

                <View style={styles.workHourItem}>
                  <TText
                    tKey="claimsHome.workHours.ramadanLabel"
                    style={styles.workHourLabel}
                  />
                  <TText
                    tKey="claimsHome.workHours.ramadanValue"
                    style={styles.workHourText}
                  />
                </View>
              </View>

              <View style={styles.divider} />

              <TText
                tKey="claimsHome.helpDescription.partTwo"
                style={styles.assistanceDescription}
              />

              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <TText
                    tKey="claimsHome.helpDescription.partThree"
                    style={styles.infoText}
                  />
                </View>
                <View style={styles.infoRow}>
                  <TText
                    tKey="claimsHome.helpDescription.partFour"
                    style={styles.infoText}
                  />
                </View>
                <View style={styles.infoRow}>
                  <TText
                    tKey="claimsHome.helpDescription.partFive"
                    style={styles.infoText}
                  />
                </View>
                <View style={styles.infoRow}>
                  <TText
                    tKey="claimsHome.helpDescription.partSix"
                    style={styles.infoText}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.collapseButton}
                onPress={toggleHelp}
                activeOpacity={0.85}
              >
                <TText tKey="claimsHome.reduce" style={styles.collapseText} />
                <ChevronDown
                  size={16}
                  color={BankingColors.primary}
                  style={{ transform: [{ rotate: "180deg" }] }}
                />
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background },

  contentContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.massive },

  summarySection: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.card },

  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg },

  summaryTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textDark },

  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4 },

  viewAllText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },

  countersRow: {
    flexDirection: "row",
    gap: Spacing.md },

  counterCard: {
    flex: 1,
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    borderLeftWidth: 3,
    minHeight: 96,
    justifyContent: "space-between" },

  counterLabel: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },

  counterValue: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold },

  typesSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg },

  typeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    ...Shadow.card },

  typeIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md },

  typeContent: {
    flex: 1,
    marginRight: Spacing.md },

  typeTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textDark,
    marginBottom: 4 },

  typeDescription: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center" },

  assistanceSection: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: BankingColors.white,
    ...Shadow.card },

  assistanceGradient: {
    padding: Spacing.lg },

  assistanceHeader: {
    flexDirection: "row",
    alignItems: "center" },

  assistanceHeaderContent: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: "center" },

  assistanceIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: BankingColors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary + "25" },

  assistanceTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.textDark },

  assistanceSubtitle: {
    marginTop: 2,
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary },

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
    top:-4
  },

  assistanceDescriptionCollapsed: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20,
    marginTop: Spacing.md },

  expandedContent: {
    marginTop: Spacing.md },

  assistanceDescription: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg },

  actionsRow: {
    gap: Spacing.md },

  actionTextWrap: {
    flex: 1 },

  primaryAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    ...Shadow.button,
    minHeight: 70 },

  actionIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF30",
    alignItems: "center",
    justifyContent: "center" },

  actionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },

  actionSubtitle: {
    marginTop: 2,
    fontSize: FontSize.xs,
    color: "#FFFFFFCC" },

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
    minHeight: 74 },

  secondaryIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "14",
    alignItems: "center",
    justifyContent: "center" },

  secondaryTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textDark },

  secondarySubtitle: {
    marginTop: 4,
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    lineHeight: 18 },

  divider: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
    opacity: 0.85 },

  workHoursCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.md },

  workHoursHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md },

  workHoursIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.primary + "12",
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.sm },

  workHoursTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.textDark },

  workHourItem: {
    marginBottom: Spacing.md },

  workHourLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textDark,
    marginBottom: 4 },

  workHourText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  infoCard: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: Spacing.md,
    gap: 8 },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start" },

  infoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: 20 },

  collapseButton: {
    marginTop: Spacing.lg,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: BankingColors.primary + "10",
    borderWidth: 1,
    borderColor: BankingColors.primary + "22" },

  collapseText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary } });