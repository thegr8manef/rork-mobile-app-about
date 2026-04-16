import React, { useMemo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Stack, useRouter } from "expo-router";

import type { AlertResponseItem } from "@/types/notification.type";
import type { AlertConfig } from "@/types/notifications";

import { useTranslation } from "react-i18next";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { AddMoreButton } from "@/components/AddMoreButton";
import { AlertCard } from "@/components/menu/alerts/AlertCard";
import { AlertSkeleton } from "@/components/menu/alerts/AlertSkeleton";
import TText from "@/components/TText";
import ApiErrorState from "@/components/Apierrorstate";
import ScreenState from "@/components/ScreenState";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import {
  alertQueries,
  useAlerts,
  useEnableAlert,
  useDisableAlert,
  useDeleteAlert } from "@/hooks/use-notifications";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";

const toAlertConfig = (a: AlertResponseItem): AlertConfig => ({
  id: a.id,
  accountId: a.accountId,
  type: a.type as any,
  minAmount: a.minAmount,
  maxAmount: a.maxAmount,
  startDate: a.startDate,
  endDate: a.endDate,
  enabled: a.enabled ?? false,
  receptionChannels: a.receptionChannels as any,
  contactDetails: {
    email: a.contactDetails.email ?? a.contactDetails.mail ?? "",
    phoneNumber:
      a.contactDetails.phoneNumber ?? a.contactDetails.telNumber ?? "" } });

export default function NotificationConfigScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    data: alertsRes,
    isLoading: isLoadingAlerts,
    isError: isAlertsError,
    refetch: refetchAlerts } = useAlerts();

  useRefetchOnFocus([
    { queryKey: alertQueries.alerts },
  ]);

  const {
    data: accountsRes,
    isLoading: accountsLoading,
    isError: isAccountsError,
    refetch: refetchAccounts } = useCustomerAccounts();

  const alerts: AlertConfig[] = useMemo(
    () => (alertsRes?.data ?? []).map(toAlertConfig),
    [alertsRes],
  );

  const enableAlertMutation = useEnableAlert();
  const disableAlertMutation = useDisableAlert();
  const deleteAlertMutation = useDeleteAlert();

  const handleCreateAlert = () =>
    router.push("/(root)/(tabs)/(menu)/create-alert");

  const handleEditAlert = (alert: AlertConfig) => {
    router.push({
      pathname: "/(root)/(tabs)/(menu)/create-alert",
      params: { alertId: alert.id } });
  };

  const handleToggleAlert = (alert: AlertConfig) => {
    if (alert.enabled) disableAlertMutation.mutate(alert.id);
    else enableAlertMutation.mutate(alert.id);
  };

  const handleDeleteAlert = (alert: AlertConfig) => {
    deleteAlertMutation.mutate(alert.id);
  };

  const getAccountNameKeyOrLabel = (accountId: string) => {
    const list = accountsRes?.data;
    if (!Array.isArray(list) || list.length === 0)
      return "notifications.accountUnknown";
    const account = list.find((a) => a.id === accountId);
    return account ? account.accountLabel : "notifications.accountUnknown";
  };

  const isMutating =
    enableAlertMutation.isPending ||
    disableAlertMutation.isPending ||
    deleteAlertMutation.isPending;

  // ✅ LOADING (like your other screens)
  if (isLoadingAlerts || accountsLoading || isMutating) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                title={t("notifications.configuration")}
              />
            ) }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <AddMoreButton
            onPress={handleCreateAlert}
            tKey="notifications.createAlert"
          />
          <AlertSkeleton />
          <AlertSkeleton />
          <AlertSkeleton />
        </ScrollView>
      </View>
    );
  }

  // ✅ ERROR (friendly state)
  if (isAlertsError || isAccountsError) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                title={t("notifications.configuration")}
              />
            ) }}
        />

        <ApiErrorState
          title={t("common.error")}
          description={t("notifications.loadingError")}
          onRetry={() => {
            refetchAccounts?.();
            refetchAlerts?.();
          }}
        />
      </View>
    );
  }

  // ✅ EMPTY (friendly state)
  if (!alerts.length) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                title={t("notifications.configuration")}
              />
            ) }}
        />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <AddMoreButton
            onPress={handleCreateAlert}
            tKey="notifications.createAlert"
          />

          <ScreenState
            variant="empty"
            title={t("notifications.noAlertsTitle")}
            description={t("notifications.noAlertsDescription")}
          />
        </ScrollView>
      </View>
    );
  }

  // ✅ NORMAL RENDER
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              title={t("notifications.configuration")}
            />
          ) }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <AddMoreButton
          onPress={handleCreateAlert}
          tKey="notifications.createAlert"
        />

        {alerts.map((alert) => (
          <AlertCard
            key={alert.id}
            alert={alert}
            accountName={getAccountNameKeyOrLabel(alert.accountId)}
            onToggle={() => handleToggleAlert(alert)}
            onEdit={() => handleEditAlert(alert)}
            onDelete={() => handleDeleteAlert(alert)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60 },
  emptyText: { fontSize: 16, color: "#999" } });
