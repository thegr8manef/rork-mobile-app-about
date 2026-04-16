import React, { useMemo, useCallback, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  Banknote,
  Target,
  Plus,
  TrendingUp,
  Sparkles,
  Settings2,
  Shield,
  Zap,
  CreditCard,
  Wallet,
  Eye,
  X,
  Globe,
} from "lucide-react-native";
import { BankingColors, Spacing, FontFamily } from "@/constants";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useCards } from "@/hooks/use-card";
import {
  savingPlanQueryKeys,
  useSavingPlans,
  useSavingPlansResignInit,
} from "@/hooks/use-saving-plans";
import useShowMessage from "@/hooks/useShowMessage";
import SavingPlansSkeleton from "@/components/SavingPlansSkeleton";
import { t } from "i18next";
import { SavingPlan } from "@/types/saving-plan.type";
import { BlockingPopup } from "@/components/BlockingPopup";
import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

/* =========================================================
 * Helpers
 * ========================================================= */

const OSROF_URL =
  "https://www.attijaribank.com.tn/fr/jeune/transfert-dargent/osrof-w-khabi";

const parseDdMmYyyy = (ddmmyyyy: string): Date | null => {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(ddmmyyyy ?? "");
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const d = new Date(yyyy, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
};

const isPlanActive = (status?: "MO" | "VA" | "RE" | null) =>
  status === "MO" || status === "VA" || status === null;

const getStatusKey = (status?: "MO" | "VA" | "RE" | null) =>
  isPlanActive(status) ? "savingPlans.active" : "savingPlans.inactive";

const isDueDateReached = (dueDate?: string | null) => {
  const due = dueDate ? parseDdMmYyyy(dueDate) : null;
  if (!due) return false;

  const today = new Date();
  const startOfToday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );
  const startOfDue = new Date(due.getFullYear(), due.getMonth(), due.getDate());

  return startOfToday.getTime() >= startOfDue.getTime();
};

export default function SavingPlansHomeScreen() {
  const insets = useSafeAreaInsets();
  const { showMessageError } = useShowMessage();

  const { data: accountsData, isLoading: accountsLoading } =
    useCustomerAccounts();
  const { data: cardsData, isLoading: cardsLoading } = useCards();
  const { data: savingPlansData, isLoading: plansLoading } = useSavingPlans();

  useRefetchOnFocus([{ queryKey: savingPlanQueryKeys.savingPlans }]);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return t("common.notAvailable");
    const d = parseDdMmYyyy(dateString);
    return d ? d.toLocaleDateString(selectedLanguage ?? undefined) : dateString;
  };
  const accounts = useMemo(
    () => accountsData?.data ?? [],
    [accountsData?.data],
  );
  const cards = useMemo(() => cardsData?.data ?? [], [cardsData?.data]);
  const savingPlansRaw = useMemo(
    () => savingPlansData?.data ?? [],
    [savingPlansData?.data],
  );

  const savingPlans = useMemo(() => {
    const list = [...savingPlansRaw];
    list.sort((a: any, b: any) => {
      const da =
        parseDdMmYyyy(a?.subscriptionDate ?? "")?.getTime() ?? -Infinity;
      const db =
        parseDdMmYyyy(b?.subscriptionDate ?? "")?.getTime() ?? -Infinity;
      return db - da;
    });
    return list;
  }, [savingPlansRaw]);

  const getSourceInfo = useCallback(
    (plan: any) => {
      if (plan.cardId) {
        const card = cards.find((c: any) => c.id === plan.cardId);
        if (card?.pcipan)
          return `**** **** **** ${String(card.pcipan).slice(-4)}`;
        return t("savingPlans.sourceFallbackCard");
      }
      if (plan.accountId) {
        const acc = accounts.find((a: any) => a.id === plan.accountId);
        if (acc?.accountNumber) return String(acc.accountNumber).slice(-8);
        return t("savingPlans.sourceFallbackAccount");
      }
      return t("common.notAvailable");
    },
    [cards, accounts],
  );

  const getSavingsAccountLabel = useCallback(
    (plan: any) => {
      if (!plan?.savingsAccountId) return t("common.notAvailable");
      const acc = accounts.find((a: any) => a.id === plan.savingsAccountId);
      return (
        acc?.accountLabel ||
        acc?.accountTitle ||
        t("savingPlans.savingsAccountFallback")
      );
    },
    [accounts],
  );

  const getSavingsAccountRib = useCallback(
    (plan: any) => {
      if (!plan?.savingsAccountId) return "";
      const acc = accounts.find((a: any) => a.id === plan.savingsAccountId);
      return acc?.accountRib || acc?.accountNumber || "";
    },
    [accounts],
  );

  const getSavingsValueLabel = useCallback((plan: any) => {
    if (plan.savingsType === "PRC") return "savingPlans.savingsTypeLabel.prc";
    return "savingPlans.savingsTypeLabel.mnt";
  }, []);

  const getAmountOrPercent = useCallback((plan: any) => {
    if (plan.savingsType === "PRC") {
      const v = Number(plan.savingsPercentage ?? 0);
      return `${v.toLocaleString("fr-FR")} %`;
    }
    const v = Number(plan.savingsAmount ?? 0);
    return `${v.toLocaleString("fr-FR")} ${t("common.currencyTND")}`;
  }, []);

  const getSourceCardSummary = useCallback(
    (plan: any) => {
      if (!plan?.cardId)
        return {
          label: t("savingPlans.sourceFallbackCard"),
          number: t("common.notAvailable"),
        };

      const card = cards.find((c: any) => c.id === plan.cardId);
      const label =
        card?.product?.description || t("savingPlans.sourceFallbackCard");
      const last4 = String(card?.pcipan ?? "").slice(-4);
      const number = last4
        ? `**** **** **** ${last4}`
        : t("common.notAvailable");
      return { label, number };
    },
    [cards],
  );

  const getSavingsAccountSummary = useCallback(
    (plan: any) => {
      if (!plan?.savingsAccountId)
        return {
          label: t("savingPlans.savingsAccountFallback"),
          rib: t("common.notAvailable"),
        };

      const acc = accounts.find((a: any) => a.id === plan.savingsAccountId);
      const label =
        acc?.accountLabel ||
        acc?.accountTitle ||
        t("savingPlans.savingsAccountFallback");
      const rib =
        acc?.accountRib || acc?.accountNumber || t("common.notAvailable");
      return { label, rib };
    },
    [accounts],
  );

  const activeCount = useMemo(
    () => savingPlans.filter((p: any) => isPlanActive(p.status as any)).length,
    [savingPlans],
  );

  const handleNewSubscription = useCallback(() => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/saving-plans-create",
      params: { mode: "create" },
    });
  }, []);

  const handleEditPlan = useCallback((savingPlanId: string) => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/saving-plans-create",
      params: { planId: savingPlanId, mode: "edit" },
    });
  }, []);

  // Opens the URL inside the in-app WebView — never leaves the app
  const handleLearnMore = useCallback(() => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/webview",
      params: {
        url: OSROF_URL,
        title: "Osrof w khabbi",
        showHeader: "1",
        closeBehavior: "back",
        loadingTextKey: "common.loading",
        returnTo: "/(root)/(tabs)/(menu)/saving-plans",
      },
    });
  }, []);

  const [resignPopupVisible, setResignPopupVisible] = useState(false);
  const [resignPlan, setResignPlan] = useState<SavingPlan | null>(null);
  const [resignLoading, setResignLoading] = useState(false);

  const resignPlanId = resignPlan?.savingsPlanId
    ? String(resignPlan.savingsPlanId)
    : "";
  const resignInitMutation = useSavingPlansResignInit(resignPlanId);

  const openResignPopup = useCallback((plan: SavingPlan) => {
    setResignPlan(plan);
    setResignPopupVisible(true);
  }, []);

  const closeResignPopup = useCallback(() => {
    if (resignLoading) return;
    setResignPopupVisible(false);
    setResignPlan(null);
  }, [resignLoading]);

  const confirmResign = useCallback(async () => {
    if (!(resignPlan as any)?.savingsPlanId) {
      closeResignPopup();
      return;
    }

    try {
      setResignLoading(true);

      const resignPayload = {
        savingsPlanId: String((resignPlan as any).savingsPlanId),
        accountId: (resignPlan as any).accountId || undefined,
        cardId: (resignPlan as any).cardId || undefined,
        savingsAccountId: (resignPlan as any).savingsAccountId || undefined,
      };

      const res: any = await resignInitMutation.mutateAsync(
        resignPayload as any,
      );

      const requestId = res?.requestId;
      if (!requestId) {
        showMessageError(t("common.error"), t("savingPlans.errorGeneric"));
        return;
      }

      const cardSummary = getSourceCardSummary(resignPlan);
      const savingsSummary = getSavingsAccountSummary(resignPlan);

      router.push({
        pathname: "/(root)/transaction-summary",
        params: {
          transactionType: "savingPlansResign",
          data: JSON.stringify({
            requestId,
            savingPlanId: String((resignPlan as any).savingsPlanId),
            accountId: (resignPlan as any).accountId ?? "",
            cardId: (resignPlan as any).cardId ?? "",
            savingsAccountId: (resignPlan as any).savingsAccountId ?? "",
            savingsPlanStatus: "RE",
            sourceCardLabel: cardSummary.label,
            sourceCardNumber: cardSummary.number,
            savingsAccountLabel: savingsSummary.label,
            savingsAccountRib: savingsSummary.rib,
            dueDate: (resignPlan as any).dueDate ?? null,
            subscriptionDate: (resignPlan as any).subscriptionDate ?? null,
            savingsType: (resignPlan as any).savingsType ?? null,
            savingsAmount: (resignPlan as any).savingsAmount ?? null,
            savingsPercentage: (resignPlan as any).savingsPercentage ?? null,
            maxSavingsAmount: (resignPlan as any).maxSavingsAmount ?? null,
            status: (resignPlan as any).status ?? null,
          }),
        },
      });

      setResignPopupVisible(false);
      setResignPlan(null);
    } catch (e: any) {
      console.error(
        "[SavingPlansHome] resign init failed:",
        e?.response?.data ?? e?.message ?? e,
      );
      showMessageError(t("common.error"), t("savingPlans.errorGeneric"));
    } finally {
      setResignLoading(false);
    }
  }, [
    resignPlan,
    resignInitMutation,
    showMessageError,
    closeResignPopup,
    getSourceCardSummary,
    getSavingsAccountSummary,
  ]);

  const [consultVisible, setConsultVisible] = useState(false);
  const [consultPlan, setConsultPlan] = useState<any | null>(null);

  const openConsult = useCallback((plan: any) => {
    setConsultPlan(plan);
    setConsultVisible(true);
  }, []);

  const closeConsult = useCallback(() => {
    setConsultVisible(false);
    setConsultPlan(null);
  }, []);

  const isLoading = accountsLoading || cardsLoading || plansLoading;
  const hasData = !!savingPlansData;

  if (isLoading || !hasData) {
    return (
      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <SavingPlansSkeleton count={3} />
          <View style={{ height: 100 }} />
        </ScrollView>
      </View>
    );
  }

  const hasPlans = savingPlans.length > 0;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <BlockingPopup
        visible={resignPopupVisible}
        title={
          (t("savingPlans.resignConfirmTitle") as any) ??
          t("common.confirmation")
        }
        message={
          (t("savingPlans.resignConfirmMessage") as any) ??
          t("savingPlans.resignConfirmMessage")
        }
        actions={[
          {
            label: t("common.cancel"),
            variant: "secondary",
            onPress: closeResignPopup,
            disabled: resignLoading,
          },
          {
            label: t("common.ok"),
            variant: "danger",
            onPress: confirmResign,
            loading: resignLoading,
          },
        ]}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        onRequestClose={closeResignPopup}
      />

      <Modal
        visible={consultVisible}
        transparent
        animationType="fade"
        onRequestClose={closeConsult}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <TText
                tKey="savingPlans.consultTitle"
                style={styles.modalTitle}
              />
              <TouchableOpacity
                onPress={closeConsult}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={BankingColors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 10 }}
            >
              <View style={styles.modalSection}>
                <TText
                  style={styles.modalSectionTitle}
                  tKey="savingPlans.consult.sectionSource"
                />
                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.sourceCard"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? getSourceInfo(consultPlan)
                      : t("common.notAvailable")}
                  </TText>
                </View>
              </View>

              <View style={styles.modalSection}>
                <TText
                  style={styles.modalSectionTitle}
                  tKey="savingPlans.consult.sectionSavings"
                />
                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.savingsAccount"
                  />
                  <View style={{ flex: 1, alignItems: "flex-end" }}>
                    <TText style={styles.modalValue}>
                      {consultPlan
                        ? getSavingsAccountLabel(consultPlan)
                        : t("common.notAvailable")}
                    </TText>
                    {!!consultPlan && !!getSavingsAccountRib(consultPlan) && (
                      <TText style={styles.modalSubValue}>
                        {getSavingsAccountRib(consultPlan)}
                      </TText>
                    )}
                  </View>
                </View>

                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.savingsType"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? t(getSavingsValueLabel(consultPlan))
                      : t("common.notAvailable")}
                  </TText>
                </View>

                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.amountOrPercentage"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? getAmountOrPercent(consultPlan)
                      : t("common.notAvailable")}
                  </TText>
                </View>

                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.monthlyLimit"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? `${Number(
                          consultPlan.maxSavingsAmount ?? 0,
                        ).toLocaleString("fr-FR")} ${t("common.currencyTND")}`
                      : t("common.notAvailable")}
                  </TText>
                </View>
              </View>

              <View style={styles.modalSection}>
                <TText
                  style={styles.modalSectionTitle}
                  tKey="savingPlans.consult.sectionDates"
                />
                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.subscriptionDate"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? formatDate(consultPlan.subscriptionDate)
                      : t("common.notAvailable")}
                  </TText>
                </View>

                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.dueDate"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? formatDate(consultPlan.dueDate)
                      : t("common.notAvailable")}
                  </TText>
                </View>

                <View style={styles.modalRow}>
                  <TText
                    style={styles.modalLabel}
                    tKey="savingPlans.consult.status"
                  />
                  <TText style={styles.modalValue}>
                    {consultPlan
                      ? t(getStatusKey(consultPlan.status))
                      : t("common.notAvailable")}
                  </TText>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={closeConsult}
              activeOpacity={0.9}
              style={styles.modalFooterBtn}
            >
              <TText style={styles.modalFooterBtnText}>{t("common.ok")}</TText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!hasPlans ? (
          <>
            <LinearGradient
              colors={["#FFF8F6", "#FFF2EF", "#FFFFFF"]}
              style={styles.heroCard}
            >
              <View style={styles.heroIconWrapper}>
                <LinearGradient
                  colors={[BankingColors.primary, BankingColors.primaryLight]}
                  style={styles.heroIconGradient}
                >
                  <Banknote size={32} color="#FFF" />
                </LinearGradient>
              </View>

              <TText tKey="savingPlans.heroTitle" style={styles.heroTitle} />
              <TText
                tKey="savingPlans.heroDescription"
                style={styles.heroSubtitle}
              />

              {/* In-app link — uses Globe icon to signal browsing without leaving the app */}
              <TouchableOpacity
                onPress={handleLearnMore}
                activeOpacity={0.75}
                style={styles.heroLinkRow}
              >
                <Globe size={16} color={BankingColors.primary} />
                <TText style={styles.heroLinkText}>
                  {t("savingPlans.learnMore")}
                </TText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.heroButton}
                onPress={handleNewSubscription}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={[BankingColors.primary, BankingColors.primaryLight]}
                  style={styles.heroButtonGradient}
                >
                  <Sparkles size={18} color="#FFF" />
                  <TText
                    tKey="savingPlans.startSaving"
                    style={styles.heroButtonText}
                  />
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>

            <View style={styles.advantagesSection}>
              <View style={styles.sectionHeader}>
                <Target size={20} color={BankingColors.primary} />
                <TText
                  tKey="savingPlans.advantages"
                  style={styles.sectionTitle}
                />
              </View>

              <View style={styles.advantagesGrid}>
                <View style={styles.advantageCard}>
                  <View
                    style={[
                      styles.advantageIcon,
                      { backgroundColor: "rgba(246, 68, 39, 0.10)" },
                    ]}
                  >
                    <Zap size={20} color={BankingColors.primary} />
                  </View>
                  <TText
                    tKey="savingPlans.automaticSavings"
                    style={styles.advantageTitle}
                  />
                  <TText
                    tKey="savingPlans.automaticSavingsDesc"
                    style={styles.advantageDesc}
                  />
                </View>

                <View style={styles.advantageCard}>
                  <View
                    style={[
                      styles.advantageIcon,
                      { backgroundColor: "rgba(16, 185, 129, 0.10)" },
                    ]}
                  >
                    <TrendingUp size={20} color={BankingColors.secondary} />
                  </View>
                  <TText
                    tKey="savingPlans.regularGrowth"
                    style={styles.advantageTitle}
                  />
                  <TText
                    tKey="savingPlans.regularGrowthDesc"
                    style={styles.advantageDesc}
                  />
                </View>

                <View style={styles.advantageCard}>
                  <View
                    style={[
                      styles.advantageIcon,
                      { backgroundColor: "rgba(59, 130, 246, 0.10)" },
                    ]}
                  >
                    <Settings2 size={20} color={BankingColors.info} />
                  </View>
                  <TText
                    tKey="savingPlans.totalFlexibility"
                    style={styles.advantageTitle}
                  />
                  <TText
                    tKey="savingPlans.totalFlexibilityDesc"
                    style={styles.advantageDesc}
                  />
                </View>

                <View style={styles.advantageCard}>
                  <View
                    style={[
                      styles.advantageIcon,
                      { backgroundColor: "rgba(139, 92, 246, 0.10)" },
                    ]}
                  >
                    <Shield size={20} color={BankingColors.accentPurple} />
                  </View>
                  <TText
                    tKey="savingPlans.secured"
                    style={styles.advantageTitle}
                  />
                  <TText
                    tKey="savingPlans.securedDesc"
                    style={styles.advantageDesc}
                  />
                </View>
              </View>
            </View>

            <ScreenState
              variant="empty"
              titleKey="savingPlans.noSubscription"
              descriptionKey="savingPlans.noSubscriptionDesc"
            />
          </>
        ) : (
          <>
            <View style={styles.statsCard}>
              <View style={styles.statsIconWrapper}>
                <Target size={28} color={BankingColors.primary} />
              </View>
              <TText style={styles.statsCount}>{activeCount}</TText>
              <TText
                tKey={
                  activeCount > 1
                    ? "savingPlans.activeSubscriptionsPlural"
                    : "savingPlans.activeSubscriptionsSingular"
                }
                style={styles.statsLabel}
              />
              <TText
                tKey="savingPlans.osrofDescription"
                style={styles.statsMessage}
              />

              {/* In-app link */}
              <TouchableOpacity
                onPress={handleLearnMore}
                activeOpacity={0.75}
                style={styles.statsLinkRow}
              >
                <Globe size={16} color={BankingColors.primary} />
                <TText style={styles.heroLinkText}>
                  {t("savingPlans.learnMore")}
                </TText>
              </TouchableOpacity>
            </View>

            <View style={styles.subscriptionsSection}>
              <View style={styles.sectionHeader}>
                <Banknote size={20} color={BankingColors.primary} />
                <TText
                  tKey="savingPlans.mySubscriptions"
                  style={styles.sectionTitle}
                />
              </View>

              <View style={styles.subscriptionsList}>
                {savingPlans.map((plan: any, index: number) => {
                  const active = isPlanActive(plan.status);
                  const dueReached = isDueDateReached(plan?.dueDate);
                  const savingPlanId = plan.savingsPlanId;

                  const canEditOrResign = active && !dueReached;

                  return (
                    <View
                      key={savingPlanId ?? String(index)}
                      style={styles.subscriptionCard}
                    >
                      <View style={styles.subscriptionHeader}>
                        <View style={styles.subscriptionIconWrapper}>
                          {plan.cardId ? (
                            <CreditCard
                              size={18}
                              color={BankingColors.primary}
                            />
                          ) : (
                            <Wallet size={18} color={BankingColors.primary} />
                          )}
                        </View>

                        <View style={styles.subscriptionInfo}>
                          <TText style={styles.subscriptionTitle}>
                            <TText tKey="savingPlans.subscription" /> #
                            {index + 1}
                          </TText>
                          <TText style={styles.subscriptionSource}>
                            {getSourceInfo(plan)}
                          </TText>
                        </View>

                        <View
                          style={[
                            styles.statusToggle,
                            active
                              ? styles.statusActive
                              : styles.statusDisabled,
                          ]}
                        >
                          <TText
                            style={[
                              styles.statusToggleText,
                              active
                                ? styles.statusActiveText
                                : styles.statusDisabledText,
                            ]}
                            tKey={getStatusKey(plan.status)}
                          />
                        </View>
                      </View>

                      <View style={styles.subscriptionDetails}>
                        <View style={styles.detailItem}>
                          <TText
                            tKey="savingPlans.savingsTypeLabel"
                            style={styles.detailLabel}
                          />
                          <TText
                            style={styles.detailValue}
                            tKey={getSavingsValueLabel(plan)}
                          />
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailItem}>
                          <TText
                            tKey="savingPlans.monthlyLimitLabel"
                            style={styles.detailLabel}
                          />
                          <TText style={styles.detailValue}>
                            {Number(plan.maxSavingsAmount ?? 0).toLocaleString(
                              "fr-FR",
                            )}{" "}
                            {t("common.currencyTND")}
                          </TText>
                        </View>

                        <View style={styles.detailDivider} />

                        <View style={styles.detailItem}>
                          <TText
                            tKey="savingPlans.savingsDeadlineLabel"
                            style={styles.detailLabel}
                          />
                          <TText style={styles.detailValue}>
                            {formatDate(plan.dueDate)}
                          </TText>
                        </View>
                      </View>

                      {canEditOrResign ? (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.actionBtnPrimary}
                            activeOpacity={0.85}
                            onPress={() =>
                              savingPlanId &&
                              handleEditPlan(String(savingPlanId))
                            }
                          >
                            <TText
                              tKey="common.edit"
                              style={styles.actionBtnPrimaryText}
                            />
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.actionBtn}
                            activeOpacity={0.85}
                            onPress={() => openConsult(plan)}
                          >
                            <Eye size={16} color={BankingColors.primary} />
                            <TText
                              style={[
                                styles.actionBtnText,
                                styles.consultBtnText,
                              ]}
                            >
                              {t("savingPlans.consult")}
                            </TText>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[styles.actionBtn, styles.resignBtn]}
                            activeOpacity={0.85}
                            onPress={() => openResignPopup(plan)}
                          >
                            <TText
                              tKey="savingPlans.resign"
                              style={[
                                styles.actionBtnText,
                                styles.resignBtnText,
                              ]}
                            />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={styles.actionsRow}>
                          <TouchableOpacity
                            style={styles.actionBtn}
                            activeOpacity={0.85}
                            onPress={() => openConsult(plan)}
                          >
                            <Eye size={16} color={BankingColors.primary} />
                            <TText
                              style={[
                                styles.actionBtnText,
                                styles.consultBtnText,
                              ]}
                            >
                              {t("savingPlans.consult")}
                            </TText>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <View
        style={[
          styles.fabContainer,
          { paddingBottom: Math.max(insets.bottom, 30) },
        ]}
      >
        <TouchableOpacity
          style={styles.fabButton}
          onPress={handleNewSubscription}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[BankingColors.primary, BankingColors.primaryLight]}
            style={styles.fabGradient}
          >
            <Plus size={22} color="#FFF" />
            <TText tKey="savingPlans.newSubscription" style={styles.fabText} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },

  heroCard: {
    borderRadius: 22,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(246, 68, 39, 0.12)",
    backgroundColor: "#FFF",
  },
  heroIconWrapper: { marginBottom: Spacing.lg },
  heroIconGradient: {
    width: 74,
    height: 74,
    borderRadius: 37,
    justifyContent: "center",
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },

  heroLinkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    marginBottom: Spacing.md,
  },
  heroLinkText: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
  },

  heroButton: {
    borderRadius: 14,
    overflow: "hidden",
    elevation: 3,
    shadowColor: BankingColors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    marginTop: Spacing.sm,
  },
  heroButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  heroButtonText: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: "#FFF",
  },

  statsCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginBottom: Spacing.lg,
  },
  statsIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(246, 68, 39, 0.10)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  statsCount: {
    fontSize: 36,
    fontFamily: FontFamily.black,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    marginBottom: 8,
  },
  statsMessage: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: Spacing.md,
  },
  statsLinkRow: {
    marginTop: 10,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },

  advantagesSection: { marginTop: Spacing.xl },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
  },
  advantagesGrid: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.md },
  advantageCard: {
    width: "47%",
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  advantageIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  advantageTitle: {
    fontSize: 14,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
    marginBottom: 4,
  },
  advantageDesc: { fontSize: 12, color: "#666", lineHeight: 16 },

  emptyStateCard: {
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: Spacing.xl,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#F0F0F0",
    marginTop: Spacing.xl,
  },
  emptyIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F5F5F5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
    marginBottom: 8,
  },
  emptyDesc: {
    fontSize: 13,
    color: "#666",
    textAlign: "center",
    lineHeight: 20,
  },

  subscriptionsSection: { marginTop: Spacing.md },
  subscriptionsList: { gap: Spacing.md },
  subscriptionCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  subscriptionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  subscriptionIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(246, 68, 39, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  subscriptionInfo: { flex: 1 },
  subscriptionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
  },
  subscriptionSource: { fontSize: 12, color: "#666", marginTop: 2 },

  statusToggle: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 999,
  },
  statusActive: { backgroundColor: "rgba(16, 185, 129, 0.12)" },
  statusDisabled: { backgroundColor: "rgba(107, 114, 128, 0.12)" },
  statusToggleText: { fontSize: 12, fontFamily: FontFamily.extrabold },
  statusActiveText: { color: "#10B981" },
  statusDisabledText: { color: "#6B7280" },

  subscriptionDetails: {
    flexDirection: "row",
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    padding: Spacing.md,
  },
  detailItem: { flex: 1, alignItems: "center" },
  detailLabel: { fontSize: 11, color: "#666", marginBottom: 4 },
  detailValue: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
  },
  detailDivider: { width: 1, backgroundColor: "#E5E5E5", marginHorizontal: 4 },

  actionsRow: { flexDirection: "row", gap: 10, marginTop: Spacing.md },
  actionBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E9E9E9",
    backgroundColor: "#FFF",
    flexDirection: "row",
    gap: 6,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.extrabold,
    color: "#1A1A1A",
  },

  actionBtnPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.primary,
  },
  actionBtnPrimaryText: {
    fontSize: 13,
    fontFamily: FontFamily.black,
    color: "#FFF",
  },

  resignBtn: {
    borderColor: "rgba(246, 68, 39, 0.25)",
    backgroundColor: "rgba(246, 68, 39, 0.08)",
  },
  resignBtnText: { color: BankingColors.primary },

  consultBtnText: { color: BankingColors.primary },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#FFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
    marginBottom: 12,
  },
  modalTitle: { fontSize: 16, fontFamily: FontFamily.black, color: "#1A1A1A" },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
  },

  modalSection: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F0F0F0",
    padding: 12,
    marginBottom: 12,
    backgroundColor: "#FFF",
  },
  modalSectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.black,
    color: "#111827",
    marginBottom: 6,
  },
  modalRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 12,
  },
  modalLabel: { fontSize: 13, color: "#6B7280", flex: 1 },
  modalValue: {
    fontSize: 13,
    fontFamily: FontFamily.black,
    color: "#111827",
    textAlign: "right",
    flex: 1,
  },
  modalSubValue: {
    marginTop: 2,
    fontSize: 12,
    color: "#6B7280",
    textAlign: "right",
  },
  modalFooterBtn: {
    marginTop: 10,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.primary,
  },
  modalFooterBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.black,
    color: "#FFF",
  },

  fabContainer: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    bottom: 0,
  },
  fabButton: {
    borderRadius: 18,
    overflow: "hidden",
    elevation: 4,
    shadowColor: BankingColors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
  },
  fabGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
    gap: 8,
  },
  fabText: { fontSize: 15, fontFamily: FontFamily.black, color: "#FFF" },
});
