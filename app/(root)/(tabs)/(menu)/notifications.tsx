import React, { useMemo, useState, useCallback } from "react";
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";
import { Stack, useRouter } from "expo-router";
import { Settings , Plus} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import NotificationItem from "@/components/NotificationItem";
import NotificationSkeleton from "@/components/NotificationSkeleton";
import CustomHeader from "@/components/home/Notification/CustomHeader";

import { BankingColors,
  Spacing,
  FontSize,
  IconSize,
  Shadow,
  BorderRadius, FontFamily } from "@/constants";
import {
  useMarkPushAllRead,
  useMarkPushRead,
  usePushNotifications } from "@/hooks/use-notifications";
import { BlockingPopup } from "@/components/BlockingPopup";
import CustomButton from "@/components/CustomButton";

type TabType = "all" | "read" | "unread";
function PrimaryButton({
  title,
  onPress,
  disabled,
  isLoading,
  leftIcon }: {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
}) {
  const isDisabled = !!disabled || !!isLoading;

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      disabled={isDisabled}
      style={[styles.btn, isDisabled && styles.btnDisabled]}
    >
      {isLoading ? (
        <ActivityIndicator color={BankingColors.surface} />
      ) : (
        <>
          {leftIcon}
          <TText style={styles.btnText}>{title}</TText>
        </>
      )}
    </TouchableOpacity>
  );
}
export default function NotificationsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const page = 1;
  const size = 100;
  const token = "";

  const {
    data: pushRes,
    isLoading,
    isFetching,
    refetch } = usePushNotifications(page, size, token);

  const notifications = useMemo(() => pushRes?.data ?? [], [pushRes]);

  const markAsReadMutation = useMarkPushRead(page, size, token);
  const markAllAsReadMutation = useMarkPushAllRead(page, size, token);

  const [activeTab, setActiveTab] = useState<TabType>("all");

  // ✅ Confirm popup for mark all
  const [confirmAllOpen, setConfirmAllOpen] = useState(false);

  const counts = useMemo(() => {
    const read = notifications.filter((n) => n.read).length;
    return {
      all: notifications.length,
      read,
      unread: notifications.length - read };
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "read") return notifications.filter((n) => n.read);
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, activeTab]);

  // ✅ mark one as read
  const markOneAsRead = useCallback(
    (id: string) => {
      if (markAsReadMutation.isPending) return;
      markAsReadMutation.mutate(id);
    },
    [markAsReadMutation],
  );

  const onPressNotif = useCallback(
    (id: string, read: boolean) => {
      if (!read) markOneAsRead(id);
      // You can also navigate to details here if you want
    },
    [markOneAsRead],
  );

  const canMarkAll = counts.unread > 0 && !markAllAsReadMutation.isPending;

  const handleConfirmMarkAll = async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
      setConfirmAllOpen(false);
      // If your hooks invalidate the query, refetch is optional:
      // refetch();
    } catch {
      // errors are handled in the hook
    }
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="notifications.title"
              rightIcon={
                <Settings size={IconSize.lg} color={BankingColors.white} />
              }
              onRightPress={() => router.push("/notification-config")}
            />
          ) }}
      />

      {isLoading ? (
        <View style={styles.skeletonContainer}>
          <NotificationSkeleton count={8} />
        </View>
      ) : (
        <>
          {/* ✅ Tabs row + Mark All text button */}
          <View style={styles.tabsRow}>
            <View style={styles.tabsContainer}>
              <TabButton
                label={`${t("notifications.tabs.all")} (${counts.all})`}
                active={activeTab === "all"}
                onPress={() => setActiveTab("all")}
              />
              <TabButton
                label={`${t("notifications.tabs.read")} (${counts.read})`}
                active={activeTab === "read"}
                onPress={() => setActiveTab("read")}
              />
              <TabButton
                label={`${t("notifications.tabs.unread")} (${counts.unread})`}
                active={activeTab === "unread"}
                onPress={() => setActiveTab("unread")}
              />
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setConfirmAllOpen(true)}
            disabled={!canMarkAll}
            style={styles.markAllBtn}
            activeOpacity={0.8}
          >
            <TText
              style={[styles.markAllText, !canMarkAll && { opacity: 0.4 }]}
            >
              {t("notifications.markAll") ?? "Mark all"}
            </TText>
          </TouchableOpacity>
          <FlatList
            data={filteredNotifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationItem
                notification={item}
                onPress={() => onPressNotif(item.id, item.read)}
              />
            )}
      contentContainerStyle={[
  styles.listContent,
  filteredNotifications.length === 0 && styles.listEmptyContent,
  { paddingBottom: 140 },
]}
            ListEmptyComponent={
              <ScreenState
                variant="empty"
                titleKey="notifications.empty"
                descriptionKey="notifications.upToDate"
              />
            }
            refreshing={isFetching}
            onRefresh={() => refetch()}
          />
        </>
      )}
<View
  style={[
    styles.footer,
    { paddingBottom: Math.max(insets.bottom, Spacing.lg) },
  ]}
>
  <PrimaryButton
    title={t("alerts.createTitle")} // or t("notifications.createAlert")
    onPress={() => router.push("/(root)/(tabs)/(menu)/create-alert")}
    disabled={false}
    leftIcon={<Plus size={IconSize.md} color={BankingColors.surface} />}
  />
</View>
      {/* ✅ Confirm popup for Mark All */}
      <BlockingPopup
        visible={confirmAllOpen}
        title={t("notifications.markAllTitle") ?? t("notifications.title")}
        message={
          t("notifications.markAllConfirm") ?? "Mark all notifications as read?"
        }
        onRequestClose={() => setConfirmAllOpen(false)}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        theme={{
          surface: BankingColors.white,
          text: BankingColors.text,
          mutedText: BankingColors.textSecondary,
          border: BankingColors.borderDark ?? BankingColors.border,
          primary: BankingColors.primary,
          radius: 16 }}
        actions={[
          {
            label: t("common.cancel"),
            variant: "secondary",
            disabled: markAllAsReadMutation.isPending,
            onPress: () => setConfirmAllOpen(false) },
          {
            label: t("common.confirm"),
            variant: "primary",
            loading: markAllAsReadMutation.isPending,
            onPress: handleConfirmMarkAll },
        ]}
      />
    </View>
  );
}

function TabButton({
  label,
  active,
  onPress }: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.tab, active && styles.activeTab]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <TText style={[styles.tabText, active && styles.activeTabText]}>
        {label}
      </TText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },

  skeletonContainer: {
    flex: 1,
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg },

  tabsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderDark },

  tabsContainer: {
    flex: 1,
    flexDirection: "row" },

  markAllBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignSelf: "flex-end" },

  markAllText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },

  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    alignItems: "center",
    borderBottomWidth: 2,
    borderBottomColor: "transparent" },

  activeTab: { borderBottomColor: BankingColors.primary },

  tabText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary },

  activeTabText: {
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold },

listContent: {
  paddingVertical: Spacing.md,
  paddingHorizontal: Spacing.lg,
  paddingBottom: 120 },
  listEmptyContent: { flexGrow: 1, justifyContent: "center" },

  emptyContainer: { alignItems: "center", padding: Spacing.xxxl },

  emptyText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm },

  emptySubtext: { fontSize: FontSize.base, color: BankingColors.textSecondary },
footer: {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: 10,
  backgroundColor: BankingColors.background,
  paddingHorizontal: Spacing.lg,
  paddingTop: Spacing.md,
  borderTopWidth: 1,
  borderTopColor: BankingColors.borderDark ?? BankingColors.border },

btn: {
  height: 56,
  backgroundColor: BankingColors.primary,
  borderRadius: BorderRadius.xl,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: Spacing.sm,
  ...Shadow.lg },
btnDisabled: { opacity: 0.5 },
btnText: {
  fontSize: FontSize.md,
  fontFamily: FontFamily.bold,
  color: BankingColors.surface } });
