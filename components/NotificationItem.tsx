import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import type { PushNotificationItem } from "@/types/notification.type";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  FontFamily,
} from "@/constants";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface NotificationItemProps {
  notification: PushNotificationItem;
  onPress: () => void; // ✅ tap = mark as read (handled in screen)
}

const getBarColor = (_alertId: string | null): string => BankingColors.primary;

export default function NotificationItem({
  notification,
  onPress,
}: NotificationItemProps) {
  const barColor = getBarColor(notification.alertId);
  const title = notification.data?.title ?? "Notification";
  const body = notification.data?.body ?? "";

  const isUnread = !notification.read;

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatTimestamp = (iso: string) => {
    const timestamp = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const days = Math.floor(diff / 86400000);

    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayName = daysOfWeek[timestamp.getDay()];

    const hours = timestamp.getHours();
    const minutes = timestamp.getMinutes();
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes.toString().padStart(2, "0");

    if (days === 0) return `Today at ${displayHours}:${displayMinutes} ${ampm}`;
    if (days === 1)
      return `Yesterday at ${displayHours}:${displayMinutes} ${ampm}`;
    if (days < 7)
      return `Last ${dayName} at ${displayHours}:${displayMinutes} ${ampm}`;
    return timestamp.toLocaleDateString(selectedLanguage ?? undefined);
  };
  return (
    <TouchableOpacity
      style={[styles.container, isUnread && styles.unread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.leftBar, { backgroundColor: barColor }]} />

      {isUnread && <View style={styles.unreadDot} />}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2}>
            {title}
          </Text>
        </View>

        {!!body && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseText} numberOfLines={3}>
              {body}
            </Text>
          </View>
        )}

        <Text style={styles.timestamp}>
          {formatTimestamp(notification.timestamp)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: BankingColors.surface,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale,
    position: "relative",
  },
  unread: { backgroundColor: BankingColors.surface },

  leftBar: {
    width: 4,
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
  },
  unreadDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
    backgroundColor: BankingColors.primary,
    position: "absolute",
    top: 18,
    left: Spacing.md,
  },

  content: { flex: 1, paddingLeft: Spacing.xl },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },

  title: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: BankingColors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },

  responseContainer: {
    backgroundColor: BankingColors.backgroundLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  responseText: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    lineHeight: 18,
    fontStyle: "italic",
  },

  timestamp: {
    fontSize: FontSize.sm,
    color: BankingColors.textMuted,
    marginTop: Spacing.xs,
  },
});
