import React, { useState, useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import { Stack, router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { BankingColors } from "@/constants/banking-colors";
import { useAppPreferencesStore } from "@/store/store";
import TText from "@/components/TText";
import { Switch } from "@/components/ui/switch";
import { Spacing, FontFamily } from "@/constants";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { INITIAL_QUICK_ACTIONS } from "@/constants/quick-action";

export default function QuickActionsConfig() {
  const enabledQuickActions = useAppPreferencesStore(
    (s) => s.enabledQuickActions,
  );
  const setEnabledQuickActions = useAppPreferencesStore(
    (s) => s.setEnabledQuickActions,
  );

  const [actions, setActions] = useState(
    INITIAL_QUICK_ACTIONS.map((a) => ({
      ...a,
      enabled: enabledQuickActions.includes(a.id),
    })),
  );

  // Staggered entry animation
  const itemAnims = useRef(
    INITIAL_QUICK_ACTIONS.map(() => new Animated.Value(0)),
  ).current;
  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(100),
        Animated.stagger(
          60,
          itemAnims.map((anim) =>
            Animated.timing(anim, {
              toValue: 1,
              duration: 340,
              easing: Easing.out(Easing.back(1.1)),
              useNativeDriver: true,
            }),
          ),
        ),
      ]),
    ]).start();
  }, []);

  useEffect(() => {
    setActions((prev) =>
      prev.map((a) => ({
        ...a,
        enabled: enabledQuickActions.includes(a.id),
      })),
    );
  }, [enabledQuickActions]);

  const enabledCount = actions.filter((a) => a.enabled).length;

  const toggleAction = (id: string) => {
    const isEnabled = enabledQuickActions.includes(id);
    if (isEnabled && enabledCount <= 2) return;
    if (!isEnabled && enabledCount >= 4) return;
    const updated = isEnabled
      ? enabledQuickActions.filter((x) => x !== id)
      : [...enabledQuickActions, id];
    setEnabledQuickActions(updated);
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <Stack.Screen
        options={{
          title: "",
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: BankingColors.white,
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="qa_title" />
          ),
        }}
      />

      <FlashList
        data={actions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={() => (
          <Animated.View
            style={{
              opacity: headerAnim,
              transform: [
                {
                  translateY: headerAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0],
                  }),
                },
              ],
            }}
          >
            <View style={styles.infoCard}>
              <TText tKey="qa_title" style={styles.infoTitle} />
              <TText tKey="qa_subtitle" style={styles.infoText} />
              <View style={styles.countBadge}>
                <TText style={styles.countText}>{enabledCount} / 4</TText>
              </View>
            </View>
          </Animated.View>
        )}
        renderItem={({ item, index }) => {
          const anim = itemAnims[index];
          const translateY = anim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          });

          return (
            <Animated.View
              style={{ opacity: anim, transform: [{ translateY }] }}
            >
              <TouchableOpacity
                style={[
                  styles.actionItem,
                  item.enabled && styles.actionItemEnabled,
                ]}
                onPress={() => toggleAction(item.id)}
                activeOpacity={0.75}
              >
                <View style={styles.actionLeft}>
                  <View
                    style={[styles.iconContainer, { backgroundColor: item.bg }]}
                  >
                    <item.icon size={Spacing.lg} color={item.color} />
                  </View>

                  <View style={styles.actionTextContainer}>
                    <TText tKey={item.titleKey} style={styles.actionTitle} />
                    <TText
                      tKey={item.descKey}
                      style={styles.actionDescription}
                    />
                  </View>
                </View>

                <Switch
                  size="md"
                  isDisabled={
                    (!item.enabled && enabledCount >= 4) ||
                    (item.enabled && enabledCount <= 2)
                  }
                  value={item.enabled}
                  onValueChange={() => toggleAction(item.id)}
                  trackColor={{
                    false: BankingColors.surfaceSecondary,
                    true: BankingColors.primaryLight,
                  }}
                  thumbColor={BankingColors.white}
                  ios_backgroundColor={BankingColors.surfaceSecondary}
                />
              </TouchableOpacity>
            </Animated.View>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { padding: Spacing.screenPadding, paddingBottom: Spacing.lg },
  infoCard: {
    backgroundColor: BankingColors.surface,
    borderRadius: Spacing.md,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.sectionSpacing,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  infoTitle: { color: BankingColors.text, fontFamily: FontFamily.bold },
  infoText: { color: BankingColors.textSecondary, marginTop: Spacing.sm },
  countBadge: {
    backgroundColor: BankingColors.surfaceSecondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Spacing.lg,
    alignSelf: "flex-start",
    marginTop: Spacing.sm,
  },
  countText: { color: BankingColors.primary, fontFamily: FontFamily.semibold },
  actionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: Spacing.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  actionItemEnabled: {
    borderColor: BankingColors.primaryLight,
    backgroundColor: BankingColors.surface,
  },
  actionLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  iconContainer: {
    width: Spacing.massive,
    height: Spacing.massive,
    borderRadius: Spacing.massive,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  actionTextContainer: { flex: 1 },
  actionTitle: { color: BankingColors.text, fontFamily: FontFamily.semibold },
  actionDescription: { color: BankingColors.textSecondary },
});
