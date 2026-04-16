import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Check, Globe } from "lucide-react-native";
import { BankingColors, FontFamily } from "@/constants";
import { useAppPreferencesStore } from "@/store/store";
import { getDeviceLanguage } from "@/features/getDeviceLanguage";
import { setAppLanguage } from "@/features/language";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────
type Lang = "fr" | "en" | "ar";
export type LangChoice = Lang | null;

// ─────────────────────────────────────────────
// Cross-platform Toggle
// ─────────────────────────────────────────────
type ToggleProps = {
  active: boolean;
  onPress: () => void;
  disabled?: boolean;
};

function LangToggle({ active, onPress, disabled }: ToggleProps) {
  const translateX = useRef(new Animated.Value(active ? 1 : 0)).current;
  const bgOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: active ? 1 : 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 280,
        mass: 0.7,
      }),
      Animated.timing(bgOpacity, {
        toValue: active ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [active, translateX, bgOpacity]);

  const TRACK_W = 50;
  const TRACK_H = 28;
  const KNOB = 22;
  const OFFSET = (TRACK_H - KNOB) / 2;
  const travel = TRACK_W - KNOB - OFFSET * 2;

  const knobX = translateX.interpolate({
    inputRange: [0, 1],
    outputRange: [OFFSET, OFFSET + travel],
  });

  const trackBg = bgOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: ["#E2E8F0", BankingColors.primary],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={8}
      accessibilityRole="switch"
      accessibilityState={{ checked: active }}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Animated.View
        style={[
          {
            width: TRACK_W,
            height: TRACK_H,
            borderRadius: TRACK_H / 2,
            backgroundColor: trackBg,
            justifyContent: "center",
          },
        ]}
      >
        <Animated.View
          style={{
            width: KNOB,
            height: KNOB,
            borderRadius: KNOB / 2,
            backgroundColor: "#FFFFFF",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
            transform: [{ translateX: knobX }],
          }}
        />
      </Animated.View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────
// Confirmation Pill Toast
// ─────────────────────────────────────────────
type ToastProps = { visible: boolean; label: string };

function ConfirmPill({ visible, label }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;
  const scale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;

    translateY.setValue(16);
    scale.setValue(0.92);
    opacity.setValue(0);

    Animated.sequence([
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          damping: 16,
          stiffness: 260,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 16,
          stiffness: 260,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1500),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 10,
          duration: 280,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [visible, label, opacity, translateY, scale]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pill, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      <View style={styles.pillCheck}>
        <Check size={12} color="#fff" strokeWidth={3} />
      </View>
      <Text style={styles.pillText}>{label}</Text>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Language Row Card
// ─────────────────────────────────────────────
type RowProps = {
  code: LangChoice;
  label: string;
  nativeLabel: string;
  flag: string;
  selected: boolean;
  loading: boolean;
  onPress: () => void;
  showDivider?: boolean;
};

function LanguageRow({
  label,
  nativeLabel,
  flag,
  selected,
  loading,
  onPress,
  showDivider,
}: RowProps) {
  const pressScale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(pressScale, {
      toValue: 0.975,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();

  const onPressOut = () =>
    Animated.spring(pressScale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 20,
      stiffness: 300,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale: pressScale }] }}>
      {showDivider && <View style={styles.rowDivider} />}
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={loading}
        style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.flagBadge, selected && styles.flagBadgeActive]}>
            <Text style={styles.flagEmoji}>{flag}</Text>
          </View>

          <View style={styles.rowLabels}>
            <Text style={[styles.rowLabel, selected && styles.rowLabelActive]}>
              {label}
            </Text>
            <Text style={styles.rowSubLabel}>{nativeLabel}</Text>
          </View>
        </View>

        <LangToggle active={selected} onPress={onPress} disabled={loading} />
      </Pressable>
    </Animated.View>
  );
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function LanguageScreen() {
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const setSelectedLanguage = useAppPreferencesStore(
    (s) => s.setSelectedLanguage,
  );

  const effectiveLanguage: LangChoice =
    selectedLanguage ?? (i18n.language as Lang);

  const [loading, setLoading] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastLabel, setToastLabel] = useState("");

  const headerAnim = useRef(new Animated.Value(0)).current;
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(120, [
      Animated.spring(headerAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }),
    ]).start();
  }, [headerAnim, cardAnim]);

  const options = useMemo(
    () => [
      {
        code: "fr" as LangChoice,
        label: t("menu.french") || "Français",
        nativeLabel: "Français",
        flag: "🇫🇷",
      },
      // {
      //   code: "en" as LangChoice,
      //   label: t("menu.english") || "English",
      //   nativeLabel: "English",
      //   flag: "🇬🇧",
      // },
      // {
      //   code: "ar" as LangChoice,
      //   label: t("menu.arabic") || "العربية",
      //   nativeLabel: "العربية",
      //   flag: "🇹🇳",
      // },
    ],
    [t],
  );

  const onSelect = useCallback(
    async (lang: LangChoice) => {
      if (lang === effectiveLanguage) return;

      setLoading(true);
      try {
        setSelectedLanguage(lang);
        const nextLng: Lang =
          lang ?? (getDeviceLanguage(["fr", "en", "ar"]) as Lang);
        await setAppLanguage(nextLng);

        const picked = options.find((o) => o.code === lang);
        const label = picked ? `${picked.flag}  ${picked.nativeLabel}` : "";
        setToastLabel(label);
        setToastVisible(false);
        setTimeout(() => setToastVisible(true), 50);
      } finally {
        setLoading(false);
      }
    },
    [effectiveLanguage, setSelectedLanguage, i18n, options],
  );

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerAnim,
            transform: [
              {
                translateY: headerAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-12, 0],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.headerIconWrap}>
          <Globe size={20} color={BankingColors.primary} strokeWidth={2} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{t("menu.language")}</Text>
          <Text style={styles.headerSub}>{t("menu.languageDesc")}</Text>
        </View>
      </Animated.View>

      <Animated.View
        style={[
          styles.card,
          {
            opacity: cardAnim,
            transform: [
              {
                translateY: cardAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.cardLabel}>
          {t("menu.selectLanguage") || "Select language"}
        </Text>

        {options.map((opt, index) => (
          <LanguageRow
            key={String(opt.code)}
            code={opt.code}
            label={opt.label}
            nativeLabel={opt.nativeLabel}
            flag={opt.flag}
            selected={opt.code === effectiveLanguage}
            loading={loading}
            onPress={() => onSelect(opt.code)}
            showDivider={index > 0}
          />
        ))}
      </Animated.View>

      <Animated.Text
        style={[
          styles.note,
          {
            opacity: cardAnim,
          },
        ]}
      >
        {t("menu.languageNote") ||
          "The app will update immediately after switching."}
      </Animated.Text>

      <ConfirmPill visible={toastVisible} label={toastLabel} />
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F6FA",
    paddingHorizontal: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 20,
    marginBottom: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  headerIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(246,68,39,0.09)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  headerSub: {
    marginTop: 2,
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    paddingHorizontal: 4,
    paddingTop: 6,
    paddingBottom: 10,
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    overflow: "hidden",
  },
  cardLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bold,
    color: "#94A3B8",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginLeft: 16,
    marginTop: 10,
    marginBottom: 8,
  },

  // ✅ FIX: divider is a standalone View child, completely separate from
  // the Animated wrapper — so ALL rows have identical wrapper structure.
  rowDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginHorizontal: 18,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderRadius: 14,
    marginHorizontal: 4,
    marginVertical: 2,
  },
  rowPressed: {
    backgroundColor: "#F8FAFC",
  },
  rowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    flex: 1,
  },
  flagBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    flexShrink: 0,
    overflow: "hidden",
  },
  flagBadgeActive: {
    backgroundColor: "rgba(246,68,39,0.07)",
    borderColor: "rgba(246,68,39,0.2)",
  },
  flagEmoji: {
    fontSize: 26,
    textAlign: "center",
    includeFontPadding: false,
    lineHeight: 32,
  },
  rowLabels: {
    gap: 2,
    flexShrink: 1,
  },
  rowLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#1E293B",
    letterSpacing: -0.1,
  },
  rowLabelActive: {
    color: BankingColors.primary,
  },
  rowSubLabel: {
    fontSize: 12,
    color: "#94A3B8",
    fontFamily: FontFamily.medium,
  },

  note: {
    marginTop: 16,
    marginHorizontal: 4,
    fontSize: 12,
    color: "#94A3B8",
    lineHeight: 17,
    textAlign: "center",
  },

  pill: {
    position: "absolute",
    bottom: 48,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "#0F172A",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 100,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 12,
  },
  pillCheck: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  pillText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    letterSpacing: -0.1,
  },
});
