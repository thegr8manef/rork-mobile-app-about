import React, { useCallback, useMemo, useState } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { FlashList } from "@shopify/flash-list";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { Eye, EyeOff, CreditCard, FileText } from "lucide-react-native";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { BankingColors, Spacing, BorderRadius, FontFamily } from "@/constants";
import TText from "@/components/TText";
import RibAccountCard from "@/components/menu/menu/RibAccountCard";
import ApiErrorState from "@/components/Apierrorstate";
import type { Account } from "@/types/account.type";

// ─── Empty State ────────────────────────────────────────────
function EmptyState() {
  const { t } = useTranslation();
  return (
    <Animated.View
      entering={FadeInDown.delay(200).duration(500).springify()}
      style={styles.emptyContainer}
    >
      <View style={styles.emptyIconCircle}>
        <CreditCard size={36} color={BankingColors.textLight} />
      </View>
      <TText style={styles.emptyTitle}>
        {t("rib.noAccounts")}
      </TText>
      <TText style={styles.emptySubtitle}>
        {t("rib.noAccountsDesc")}
      </TText>
    </Animated.View>
  );
}

// ─── Screen ─────────────────────────────────────────────────
export default function ConsultRibScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const { data, isLoading, isError, refetch } = useCustomerAccounts();
  const accounts = useMemo(() => {
    const list = data?.data ?? [];
    return [...list].sort((a, b) => a.displayIndex - b.displayIndex);
  }, [data?.data]);

  const [showBalance, setShowBalance] = useState(true);

  const toggleBalance = useCallback(() => {
    setShowBalance((prev) => !prev);
  }, []);

  // ── Navigate to account details ───────────────────────────
  const goToAccountDetails = useCallback(
    (accountId: string) => {
      const idx = accounts.findIndex((a) => a.id === accountId);
      router.push({
        pathname: "/(root)/(tabs)/(home)/account-details",
        params: {
          accountId,
          currentAccountIndex: (idx >= 0 ? idx : 0).toString() } });
    },
    [accounts],
  );

  // ── List header ───────────────────────────────────────────
  const ListHeader = useCallback(
    () => (
      <Animated.View
        entering={FadeIn.delay(100).duration(350)}
        style={styles.headerCard}
      >
        <LinearGradient
          colors={[BankingColors.primary, "#D97706"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          {/* Decorative circles */}
          <View style={[styles.decoCircle, styles.deco1]} />
          <View style={[styles.decoCircle, styles.deco2]} />
          <View style={[styles.decoCircle, styles.deco3]} />

          <View style={styles.headerInner}>
            <View style={styles.headerTopRow}>
              <View style={styles.headerIconCircle}>
                <FileText size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.headerTextBlock}>
                <TText style={styles.headerTitle}>
                  {t("rib.title")}
                </TText>
                <TText style={styles.headerSubtitle}>
                  {t("rib.accountCount", { count: accounts.length })}
                </TText>
              </View>

              <TouchableOpacity
                onPress={toggleBalance}
                style={styles.headerEyeBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showBalance ? (
                  <Eye size={18} color="rgba(255,255,255,0.9)" />
                ) : (
                  <EyeOff size={18} color="rgba(255,255,255,0.9)" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    ),
    [accounts.length, showBalance, toggleBalance, t],
  );

  if (isError) {
    return (
      <>
        <Stack.Screen options={{ title: t("rib.screenTitle"), headerShown: true }} />
        <ApiErrorState
          description="pdf.rib.downloadErrorMessage"
          onRetry={refetch}
        />
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: t("rib.screenTitle"),
          headerShown: true }}
      />

      <View style={[styles.container, { paddingBottom: insets.bottom }]}>
        {accounts.length === 0 && !isLoading ? (
          <View style={styles.emptyWrapper}>
            <ListHeader />
            <EmptyState />
          </View>
        ) : (
          <FlashList
            data={accounts}
       
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={ListHeader}
            renderItem={({ item }: { item: Account }) => (
              <RibAccountCard
                account={item}
                showBalance={showBalance}
                onToggleBalance={toggleBalance}
                onPress={goToAccountDetails}
              />
            )}
            keyExtractor={(item: Account) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
}

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA" },

  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl },

  emptyWrapper: {
    flex: 1,
    paddingHorizontal: Spacing.lg },

  // ── Header ────────────────────────────────────────────────
  headerCard: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: "#1a1a2e",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 5 },

  headerGradient: {
    borderRadius: BorderRadius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
    position: "relative" },

  headerInner: {
    zIndex: 2 },

  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },

  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.95)",
    justifyContent: "center",
    alignItems: "center" },

  headerTextBlock: {
    flex: 1 },

  headerTitle: {
    fontSize: 19,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.white,
    letterSpacing: -0.2 },

  headerSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: FontFamily.medium,
    marginTop: 2 },

  headerEyeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.15)",
    justifyContent: "center",
    alignItems: "center" },

  // ── Decorative ────────────────────────────────────────────
  decoCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)" },
  deco1: { width: 100, height: 100, top: -30, right: -15 },
  deco2: { width: 60, height: 60, bottom: -15, left: 40 },
  deco3: { width: 35, height: 35, top: 10, right: 80, backgroundColor: "rgba(255,255,255,0.05)" },

  // ── Empty ─────────────────────────────────────────────────
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingTop: 80 },

  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,0,0,0.04)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },

  emptyTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.sm },

  emptySubtitle: {
    fontSize: 14,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20 } });