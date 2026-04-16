// =========================
// LoansScreen.tsx (FULL)
// =========================
import React, { useCallback } from "react";
import { View, StyleSheet, ScrollView, Linking } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { router } from "expo-router";
import { t } from "i18next";
import * as WebBrowser from "expo-web-browser";

import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import { loansQueryKeys, useLoans } from "@/hooks/use-loans";
import { mockCreditTypes } from "@/mocks/banking-data";

import LoanCard from "@/components/LoanCard";
import TText from "@/components/TText";
import LoanSkeleton from "@/components/LoanSkeleton";
import CreditTypeCard from "@/components/menu/loans/CreditTypeCard";
import ScreenState from "@/components/ScreenState";
import { horizontalScale } from "@/utils/scale";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import ApiErrorState from "@/components/Apierrorstate";
import EmptyState from "@/components/factures/EmptyState";

const LOANS_URL = "https://www.attijaribank.com.tn/fr/particulier/credit";

export default function LoansScreen() {
  const { data, isLoading, isError, refetch, isFetching } = useLoans();

  useRefetchOnFocus([{ queryKey: loansQueryKeys.loans() }]);

  const loans = data?.data ?? [];

  /**
   * ✅ FIX:
   * Open external browser directly.
   * No router navigation to "/webview".
   * When user cancels/closes: do nothing (stay on screen).
   */
  const handleNavigation = useCallback(() => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/webview",
      params: {
        url: LOANS_URL,
        title: t("menu.credits"),
        showHeader: "1",
        closeBehavior: "back",
        loadingTextKey: "common.loading",
        returnTo: "/(root)/(tabs)/(menu)/loans",
      },
    });
  }, [t]);

  const handleOpenDetails = (loan: any) => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/loan-details",
      params: {
        loanId: loan.id,
        prefetched: "1",
        loanSnapshot: JSON.stringify(loan),
      },
    });
  };

  // ── Loading ───────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <TText tKey="loans.myCredits" style={styles.sectionTitle} />
        <LoanSkeleton count={3} />
      </View>
    );
  }

  // ── API Error ─────────────────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.container}>
        <ApiErrorState
          description={t("apiErrors.generic.desc")}
          onRetry={() => refetch()}
          isRetrying={isFetching}
        />
      </View>
    );
  }

  // ── No loans (empty state) ────────────────────────────────────────────
  if (!loans.length) {
    return (
      <View style={styles.container}>
        <ScreenState
          variant="empty"
          titleKey="loans.noPlacementsTitle"
          descriptionKey="loans.noPlacementsDescription"
        />

        <View style={styles.discoverSection}>
          <TText tKey="loans.discoverCredits" style={styles.discoverTitle} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.creditTypesList}
          >
            {mockCreditTypes.map((item) => (
              <CreditTypeCard
                key={item.id}
                credit={item}
                onPress={handleNavigation}
              />
            ))}
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Loans list ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <FlashList
        data={loans}
        ListHeaderComponent={
          <TText tKey="loans.myCredits" style={styles.sectionTitle}>
            {` (${loans.length})`}
          </TText>
        }
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <LoanCard loan={item} onPress={() => handleOpenDetails(item)} />
        )}
        ListEmptyComponent={
          <EmptyState
            titleKey="loans.noPlacementsTitle"
            descriptionKey="loans.noPlacementsDescription"
          />
        }
        ListFooterComponent={
          <View style={styles.discoverSection}>
            <TText tKey="loans.discoverCredits" style={styles.discoverTitle} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.creditTypesList}
            >
              {mockCreditTypes.map((item) => (
                <CreditTypeCard
                  key={item.id}
                  credit={item}
                  onPress={handleNavigation}
                />
              ))}
            </ScrollView>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
    padding: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.lg,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: horizontalScale(Spacing.md),
    paddingVertical: Spacing.xxxl,
  },
  discoverSection: {
    marginTop: Spacing.xl,
  },
  discoverTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  creditTypesList: {
    paddingVertical: Spacing.sm,
  },
});
