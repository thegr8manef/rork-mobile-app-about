// HomeScreen.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors, Spacing } from "@/constants";
import { getMockOffers } from "@/mocks/offers-data";
import CustomNotificationHeader from "@/components/home/Notification/CustomNotificationHeader";
import AccountsCarousel from "@/components/home/AccountsCarousel/AccountsCarousel";
import RecentTransactions from "@/components/home/recentTransactions/recentTransactions";
import OffersSection from "@/components/OfferStory/OffersSection";
import { useAppPreferencesStore } from "@/store/store";
import { useAuth } from "@/hooks/auth-store";
import HomeOnboardingGuide, {
  measureViewAsync,
  OnboardingStep,
  SpotlightRegion,
} from "@/components/home/HomeOnboardingGuide";
import { useTranslation } from "react-i18next";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
// import { useStoreReview } from "@/utils/Usestorereview";
import { useNavigation, useRouter } from "expo-router";
import { accountQueryKeys, useContractConfig } from "@/hooks/use-accounts-api";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function HomeScreen() {
  // useStoreReview();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const isFocused = navigation.isFocused();
  const offers = getMockOffers(t);
  const router = useRouter();
  const [feedbackChecked, setFeedbackChecked] = useState(false);
  {
    /*const { data: contractConfig, isError, error } = useContractConfig();

    console.log("Contract config in HomeScreen:", contractConfig, isError, error);
    useEffect(() => {
    if (feedbackChecked || !contractConfig) return;
    setFeedbackChecked(true);

    if (contractConfig.feedbackConfiguration) {
      const fb = contractConfig.feedbackConfiguration;
      console.log("✅ [home] Feedback config found, redirecting to feedback screen");
      setTimeout(() => {
        router.navigate({
          pathname: "/(root)/feedback" as any,
          params: {
            title: fb.feedbackTitle,
            subtitle: fb.feedbackSubTitle,
            isNoteActivated: String(fb.isNoteActivated),
            isCommentsActivated: String(fb.isCommentsActivated) } } as any);
      }, 500);
    } else {
      console.log("ℹ️ [home] No feedback config");
    }
  }, [feedbackChecked, contractConfig, router]);*/
  }

  const [showStoreReview, setShowStoreReview] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  // ✅ Track if accounts had an error so transactions don't show infinite skeleton
  const [accountsHasError, setAccountsHasError] = useState(false);

  const showTransactionDetail = useAppPreferencesStore(
    (s) => s.showTransactionDetail,
  );
  const setShowTransactionDetail = useAppPreferencesStore(
    (s) => s.setShowTransactionDetail,
  );
  const toggleTransactionDetail = useCallback(() => {
    setShowTransactionDetail(!showTransactionDetail);
  }, [showTransactionDetail, setShowTransactionDetail]);

  const [accountcount, setAccountCount] = useState<number | null>(null);
  const { authState } = useAuth();

  const toggleBalance = useCallback(() => {
    setShowBalance((prev) => !prev);
  }, []);

  const homeOnboardingCompleted = useAppPreferencesStore(
    (s) => s.homeOnboardingCompleted,
  );
  const setHomeOnboardingCompleted = useAppPreferencesStore(
    (s) => s.setHomeOnboardingCompleted,
  );

  const headerRef = useRef<View>(null);
  const accountRef = useRef<View>(null);
  const transactionsRef = useRef<View>(null);
  const offersRef = useRef<View>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const [guideSteps, setGuideSteps] = useState<OnboardingStep[]>([]);
  const [showGuide, setShowGuide] = useState(false);

  const buildGuideSteps = useCallback(async () => {
    if (homeOnboardingCompleted) return;

    const [headerRegion, accountRegion, transactionsRegion] = await Promise.all(
      [
        measureViewAsync(headerRef),
        measureViewAsync(accountRef),
        measureViewAsync(transactionsRef),
      ],
    );

    const steps: OnboardingStep[] = [];

    if (headerRegion) {
      steps.push({
        key: "header",
        title: t("homeGuide.header.title"),
        description: t("homeGuide.header.description"),
        region: headerRegion,
        tooltipPosition: "below",
        borderRadius: 16,
        padding: 6,
      });
    }

    if (accountRegion) {
      steps.push({
        key: "accounts",
        title: t("homeGuide.accounts.title"),
        description: t("homeGuide.accounts.description"),
        region: accountRegion,
        tooltipPosition: "below",
        borderRadius: 16,
        padding: 4,
      });
    }

    if (transactionsRegion) {
      steps.push({
        key: "transactions",
        title: t("homeGuide.transactions.title"),
        description: t("homeGuide.transactions.description"),
        region: transactionsRegion,
        tooltipPosition:
          transactionsRegion.y > SCREEN_HEIGHT * 0.45 ? "above" : "below",
        borderRadius: 16,
        padding: 4,
      });
    }

    const tabBarHeight = 65 + insets.bottom;
    const fabSize = 64;
    const screenWidth = Dimensions.get("window").width;

    steps.push({
      key: "offers",
      title: t("homeGuide.offers.title"),
      description: t("homeGuide.offers.description"),
      region: { x: 0, y: 0, width: 0, height: 0 },
      tooltipPosition: "above",
      borderRadius: 16,
      padding: 4,
    });

    steps.push({
      key: "fab",
      title: t("homeGuide.fab.title"),
      description: t("homeGuide.fab.description"),
      region: {
        x: screenWidth / 2 - fabSize / 2,
        y: SCREEN_HEIGHT - tabBarHeight - fabSize / 2 + 4,
        width: fabSize,
        height: fabSize,
      },
      tooltipPosition: "above",
      borderRadius: 32,
      padding: 8,
    });

    steps.push({
      key: "tabbar",
      title: t("homeGuide.tabbar.title"),
      description: t("homeGuide.tabbar.description"),
      region: {
        x: 0,
        y: SCREEN_HEIGHT - tabBarHeight,
        width: screenWidth,
        height: tabBarHeight,
      },
      tooltipPosition: "above",
      borderRadius: 0,
      padding: 0,
    });

    if (steps.length > 0) {
      setGuideSteps(steps);
      setShowGuide(true);
    }
  }, [homeOnboardingCompleted, insets.bottom, t]);

  useEffect(() => {
    if (homeOnboardingCompleted) return;
    if (!isFocused) return;
    const timer = setTimeout(() => {
      buildGuideSteps();
    }, 1200);
    return () => clearTimeout(timer);
  }, [homeOnboardingCompleted, buildGuideSteps, isFocused]);

  const handleBeforeStep = useCallback(
    async (
      _nextIndex: number,
      stepKey: string,
    ): Promise<SpotlightRegion | null> => {
      if (stepKey === "offers" && scrollViewRef.current && offersRef.current) {
        return new Promise((resolve) => {
          offersRef.current?.measureLayout(
            scrollViewRef.current as unknown as View,
            (_x, y) => {
              const scrollTarget = Math.max(0, y - 60);
              scrollViewRef.current?.scrollTo({
                y: scrollTarget,
                animated: true,
              });

              setTimeout(async () => {
                const region = await measureViewAsync(offersRef);
                resolve(region);
              }, 500);
            },
            () => resolve(null),
          );
        });
      }

      if (stepKey === "fab" || stepKey === "tabbar") {
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
        await new Promise((r) => setTimeout(r, 400));
      }

      return null;
    },
    [],
  );

  const handleGuideComplete = useCallback(() => {
    setShowGuide(false);
    setHomeOnboardingCompleted(true);
  }, [setHomeOnboardingCompleted]);

  useRefetchOnFocus([
    { queryKey: accountQueryKeys.accounts },
    {
      queryKey: accountQueryKeys.movements(selectedAccountId),
      enabled: !!selectedAccountId,
    },
  ]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!showGuide}
      >
        <View ref={headerRef} collapsable={false}>
          <CustomNotificationHeader />
        </View>

        <View ref={accountRef} collapsable={false}>
          <AccountsCarousel
            showBalance={showBalance}
            onToggleBalance={toggleBalance}
            onAccountChange={setSelectedAccountId}
            setAccountCount={setAccountCount}
            onError={setAccountsHasError}
          />
        </View>

        <View ref={transactionsRef} collapsable={false}>
          <RecentTransactions
            accountId={selectedAccountId}
            limit={3}
            isLoadingAccounts={
              selectedAccountId === null &&
              !accountsHasError &&
              accountcount === null
            }
            noAccounts={accountcount === 0}
            onToggleBalance={toggleTransactionDetail}
          />
        </View>

        <View ref={offersRef} collapsable={false}>
          <OffersSection
            offers={offers}
            onViewAllPress={() => console.log("view all")}
            onOfferPress={(offer) => console.log("Offer pressed:", offer.id)}
          />
        </View>
      </ScrollView>

      <HomeOnboardingGuide
        visible={showGuide}
        steps={guideSteps}
        onComplete={handleGuideComplete}
        onBeforeStep={handleBeforeStep}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
});
