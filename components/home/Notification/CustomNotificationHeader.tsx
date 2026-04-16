import React, { useEffect, useMemo } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Bell } from "lucide-react-native";

import { BankingColors,
  Spacing,
  FontSize,
  Shadow,
  IconSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useProfile } from "@/hooks/use-accounts-api";
import { useAuth } from "@/hooks/auth-store";

export default function CustomNotificationHeader() {
  const { data: profile } = useProfile();

  const { deviceId, quickLoginIdentity, setQuickLoginIdentity } = useAuth();

  const primaryUser =
    profile?.users?.find(
      (x) =>
        x.defaultUser === "true" ||
        x.defaultUser === "1" ||
        x.defaultUser === "Y",
    ) ?? profile?.users?.[0];

  const firstName = primaryUser?.firstName ?? null;
  const lastName = primaryUser?.lastName ?? null;

  const fullName = useMemo(() => {
    const first = (firstName ?? "").trim();
    const last = (lastName ?? "").trim();
    const full = `${first} ${last}`.trim();
    return full || "-";
  }, [firstName, lastName]);

  /**
   * We need a stable identity key for "this trusted user on this phone".
   * Prefer userId > login. If login exists, we use it as "username".
   */
  const username = useMemo(() => {
    // If your API returns primaryUser.login, use it:
    const login = (primaryUser?.login ?? "").trim();
    if (login) return login;

    // Fallback (still unique enough): userId
    const uid = (primaryUser?.userId ?? "").trim();
    return uid;
  }, [primaryUser?.login, primaryUser?.userId]);

  /**
   * ✅ Persist identity for quick-login / MFA skip
   * - Only when: we have deviceId + username
   * - And only if changed (avoid extra writes / rerenders)
   */
  useEffect(() => {
    if (!deviceId) return;
    if (!username) return;

    const next = {
      username,
      deviceId,
      firstName,
      lastName,
      fullName,
      trustedAt: new Date().toISOString() };

    const sameAsSaved =
      !!quickLoginIdentity &&
      quickLoginIdentity.username === next.username &&
      quickLoginIdentity.deviceId === next.deviceId &&
      (quickLoginIdentity.firstName ?? null) === (next.firstName ?? null) &&
      (quickLoginIdentity.lastName ?? null) === (next.lastName ?? null) &&
      (quickLoginIdentity.fullName ?? "") === (next.fullName ?? "");

    if (sameAsSaved) return;

    // Save / update persisted identity
    setQuickLoginIdentity(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId, username, firstName, lastName, fullName]);

  return (
    <View style={styles.header}>
      <View>
        <TText tKey="home.welcome" style={styles.userName} />
        {/* NOTE: USER FULL NAME is not a translation key; use direct text */}
        <TText style={styles.greeting}>{fullName}</TText>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() =>
            router.navigate("/(root)/(tabs)/(menu)/notifications" as any)
          }
        >
          <Bell size={IconSize.xl} color={BankingColors.text} />
        </TouchableOpacity>

        {/* <TouchableOpacity
          style={styles.headerButton}
          onPress={() => router.navigate("/(root)/(tabs)/(menu)" as any)}
        >
          <Settings size={IconSize.xl} color={BankingColors.text} />
        </TouchableOpacity> */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs },
  greeting: {
    fontSize: FontSize.md,
    color: BankingColors.textMedium },
  userName: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginTop: Spacing.xs },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.md },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    ...Shadow.sm } });
