import React, { useEffect, useRef } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  Linking } from "react-native";
import { ShieldCheck, ShieldX, Settings, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { BankingColors,
  BorderRadius,
  FontSize,
  Spacing,
  Shadow, FontFamily } from "@/constants";

export type PermissionModalVariant = "request" | "denied" | "deniedPermanent";

interface PermissionModalProps {
  visible: boolean;
  variant: PermissionModalVariant;
  onAllow?: () => void;
  onDeny?: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
}

export default function PermissionModal({
  visible,
  variant,
  onAllow,
  onDeny,
  onOpenSettings,
  onClose }: PermissionModalProps) {
  const { t } = useTranslation();
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 65,
          friction: 9,
          useNativeDriver: true }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleOpenSettings = () => {
    if (Platform.OS === "ios") {
      Linking.openURL("app-settings:");
    } else if (Platform.OS === "android") {
      Linking.openSettings();
    }
    onOpenSettings?.();
  };

  const isRequest = variant === "request";
  const isDeniedPermanent = variant === "deniedPermanent";

  const iconBgColor = isRequest ? "#FFF1E6" : "#FEE2E2";
  const iconColor = isRequest ? BankingColors.primary : BankingColors.error;
  const IconComponent = isRequest ? ShieldCheck : ShieldX;

  const titleKey = isRequest
    ? "permissions.storageTitle"
    : "permissions.deniedTitle";
  const messageKey = isRequest
    ? "permissions.storageMessage"
    : isDeniedPermanent
      ? "permissions.deniedPermanentMessage"
      : "permissions.deniedMessage";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose ?? onDeny}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.card,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim },
          ]}
        >
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose ?? onDeny}
            activeOpacity={0.7}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <X size={18} color={BankingColors.textMuted} strokeWidth={2.5} />
          </TouchableOpacity>

          <View style={[styles.iconCircle, { backgroundColor: iconBgColor }]}>
            <IconComponent size={36} color={iconColor} strokeWidth={1.8} />
          </View>

          <TText style={styles.title} tKey={titleKey} />

          <TText style={styles.message} tKey={messageKey} />

          {isRequest && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.denyBtn}
                onPress={onDeny}
                activeOpacity={0.7}
              >
                <TText style={styles.denyBtnText} tKey="permissions.notNow" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.allowBtn}
                onPress={onAllow}
                activeOpacity={0.7}
              >
                <TText style={styles.allowBtnText} tKey="permissions.allow" />
              </TouchableOpacity>
            </View>
          )}

          {!isRequest && isDeniedPermanent && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.denyBtn}
                onPress={onClose ?? onDeny}
                activeOpacity={0.7}
              >
                <TText style={styles.denyBtnText} tKey="permissions.cancel" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingsBtn}
                onPress={handleOpenSettings}
                activeOpacity={0.7}
              >
                <Settings size={16} color={BankingColors.white} strokeWidth={2.5} />
                <TText
                  style={styles.settingsBtnText}
                  tKey="permissions.openSettings"
                />
              </TouchableOpacity>
            </View>
          )}

          {!isRequest && !isDeniedPermanent && (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.allowBtn, { flex: 1 }]}
                onPress={onClose ?? onDeny}
                activeOpacity={0.7}
              >
                <TText style={styles.allowBtnText} tKey="common.ok" />
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    paddingTop: Spacing.xxxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    width: "100%",
    maxWidth: 340,
    alignItems: "center",
    ...Shadow.modal },
  closeBtn: {
    position: "absolute" as const,
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center" },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center" as const,
    marginBottom: Spacing.sm },
  message: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 22,
    marginBottom: Spacing.xxl,
    paddingHorizontal: Spacing.xs },
  btnRow: {
    flexDirection: "row" as const,
    gap: Spacing.sm,
    width: "100%" },
  denyBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center" },
  denyBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  allowBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center" },
  allowBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white },
  settingsBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.primary,
    flexDirection: "row" as const,
    justifyContent: "center",
    alignItems: "center",
    gap: 6 },
  settingsBtnText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white } });
