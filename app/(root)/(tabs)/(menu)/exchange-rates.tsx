// ExchangeRatesScreen.tsx
import React, { useMemo, useState } from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity } from "react-native";
import { Stack } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Calculator } from "lucide-react-native";
import { useTranslation } from "react-i18next";

import { BankingColors, Spacing, BorderRadius, Shadow, FontFamily } from "@/constants";

import { getExchangeRates } from "@/services/account.api";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";
import ExchangeRatesSkeleton from "@/components/ExchangeRatesSkeleton";
import ExchangeRatesHeader from "@/components/menu/exchangerRates/ExchangeRatesHeader";
import ExchangeRatesTable from "@/components/menu/exchangerRates/ExchangeRatesTable";
import ExchangeRatesCalculatorModal from "@/components/menu/exchangerRates/ExchangeRatesCalculatorModal";
import CurrencyPickerModal from "@/components/menu/exchangerRates/CurrencyPickerModal";

const CURRENCY_FLAGS: Record<string, string> = {
  EUR: "🇪🇺",
  USD: "🇺🇸",
  GBP: "🇬🇧",
  SAR: "🇸🇦",
  AED: "🇦🇪",
  CHF: "🇨🇭",
  JPY: "🇯🇵",
  CAD: "🇨🇦",
  CNY: "🇨🇳",
  DKK: "🇩🇰",
  NOK: "🇳🇴",
  SEK: "🇸🇪",
  QAR: "🇶🇦",
  BHD: "🇧🇭",
  KWD: "🇰🇼" };

const CURRENCY_UNITY: Record<string, number> = {
  EUR: 1,
  USD: 1,
  GBP: 1,
  SAR: 10,
  AED: 10,
  CHF: 10,
  JPY: 1000,
  CAD: 1,
  CNY: 1,
  DKK: 100,
  NOK: 100,
  SEK: 10,
  QAR: 10,
  BHD: 1,
  KWD: 1 };

type CurrencyRates = {
  currency: string;
  flag: string;
  unity: number;
  name: string;
  buyRate: string;
  sellRate: string;
};

export default function ExchangeRatesScreen() {
  const { t } = useTranslation();

  // If you want "Cours de change" default, set "BBE"
  const [activeTab, setActiveTab] = useState<"" | "BBE">("BBE");
  const [showSimulator, setShowSimulator] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const [fromDinar, setFromDinar] = useState(true);
  const [amount, setAmount] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const {
    data: exchangeData,
    isLoading,
    isFetching,
    error,
    refetch } = useQuery({
    queryKey: ["exchangeRates", activeTab],
    queryFn: () => getExchangeRates(activeTab),
    staleTime: 1000 * 60 * 5,
    gcTime: 10 * 60 * 1000 });
    // console.log('**********************************************');
    
    // console.log("🚀 ~ ExchangeRatesScreen ~ exchangeData:",JSON.stringify(exchangeData) )
    // console.log('**********************************************');

  const processedRates: CurrencyRates[] = useMemo(() => {
    if (!exchangeData?.data) return [];

    const ratesMap = new Map<string, CurrencyRates>();

    exchangeData.data.forEach((rate: any) => {
      if (rate.searchNature !== "A" && rate.searchNature !== "V") return;

      const currencyCode = rate.initialCurrency?.alphaCode;
      if (!currencyCode) return;

      if (!ratesMap.has(currencyCode)) {
        ratesMap.set(currencyCode, {
          currency: currencyCode,
          flag: CURRENCY_FLAGS[currencyCode] || "🏳️",
          name: rate.initialCurrency?.designation ?? currencyCode,
          unity: CURRENCY_UNITY[currencyCode] || 1,
          buyRate: "",
          sellRate: "" });
      }

      const currencyRate = ratesMap.get(currencyCode)!;
      if (rate.searchNature === "A")
        currencyRate.buyRate = String(rate.rate ?? "");
      if (rate.searchNature === "V")
        currencyRate.sellRate = String(rate.rate ?? "");
    });

    return Array.from(ratesMap.values());
  }, [exchangeData]);

  const hasNoData = !isLoading && !error && processedRates.length === 0;
  const showLoading = isLoading || isFetching;

  const calculateConversion = () => {
    if (!amount || isNaN(parseFloat(amount))) return "0.00";

    const selectedRate = processedRates.find(
      (r) => r.currency === selectedCurrency,
    );
    if (!selectedRate) return "0.00";

    const amountNum = parseFloat(amount);

    if (fromDinar) {
      const rate = parseFloat(selectedRate.sellRate);
      if (!rate) return "0.00";
      return (amountNum / rate).toFixed(2);
    } else {
      const rate = parseFloat(selectedRate.buyRate);
      if (!rate) return "0.00";
      return (amountNum * rate).toFixed(2);
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontFamily: FontFamily.bold as any } }}
      />

      {showLoading ? (
        <ExchangeRatesSkeleton activeTab={activeTab} />
      ) : error ? (
        <ApiErrorState
          title={t("common.error")}
          description={t("exchangeRates.errorFriendly")}
          onRetry={() => refetch()}
        />
      ) : hasNoData ? (
        <ScreenState
          variant="empty"
          title={t("exchangeRates.noDataTitle")}
          description={t("exchangeRates.noDataDesc")}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBox}>
            <TText style={styles.infoSubtext} tKey="exchangeRates.disclaimer" />
          </View>
          <ExchangeRatesHeader
            applicationDate={exchangeData?.applicationDate}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />

          <ExchangeRatesTable rates={processedRates} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCurrencyPicker(true)}
        activeOpacity={0.8}
      >
        <Calculator size={24} color={BankingColors.surface} />
      </TouchableOpacity>

      {/* Modals */}
      <ExchangeRatesCalculatorModal
        visible={showSimulator}
        onClose={() => setShowSimulator(false)}
        fromDinar={fromDinar}
        setFromDinar={setFromDinar}
        amount={amount}
        setAmount={setAmount}
        selectedCurrency={selectedCurrency}
        processedRates={processedRates}
        calculateConversion={calculateConversion}
        onOpenCurrencyPicker={() => setShowCurrencyPicker(true)}
        currencyFlags={CURRENCY_FLAGS}
      />

      <CurrencyPickerModal
        visible={showCurrencyPicker}
        onClose={() => setShowCurrencyPicker(false)}
        processedRates={processedRates}
        selectedCurrency={selectedCurrency}
        onSelectCurrency={setSelectedCurrency}
        onAfterSelect={() => setShowSimulator(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  infoBox: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
    marginTop: Spacing.xl,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary },
  infoText: {
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  infoSubtext: {
    color: BankingColors.textSecondary,
    lineHeight: 16 },
  fab: {
    position: "absolute",
    bottom: Spacing.xl,
    right: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.card,
    elevation: 6 } });
