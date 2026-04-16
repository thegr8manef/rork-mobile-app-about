// =========================
// MenuScreen.tsx (FULL)
// =========================
import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
  Keyboard,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import { moderateScale, verticalScale, horizontalScale } from "@/utils/scale";
import { useAuth } from "@/hooks/auth-store";
import { useHaptic } from "@/utils/useHaptic";
import { useTranslation } from "react-i18next";
import {
  Users,
  Settings,
  Shield,
  Bell,
  ChevronDown,
  CreditCard,
  MessageSquare,
  Receipt,
  Fingerprint,
  FolderOpen,
  Wallet,
  SlidersHorizontal,
  TrendingUp,
  DollarSign,
  ArrowLeftRight,
  Banknote,
  Search,
  AlertCircle,
  Send,
  Package,
  X,
  BriefcaseBusiness,
  GraduationCap,
  LogOut,
  Globe,
  History,
  Clock,
} from "lucide-react-native";
import { useProfile } from "@/hooks/use-accounts-api";
import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";
import Constants from "expo-constants";
import {
  getPrimaryUser,
  getFullName,
  getInitials,
  getAvatarBg,
} from "@/utils/user";
import { formatDistanceToNow } from "date-fns";
import { getDateLocale } from "@/utils/date-locale";
// ── Enable LayoutAnimation on Android ──
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_COLUMNS = 3;
const GRID_GAP = 10;
const CARD_PADDING_H = 16;
const GRID_ITEM_WIDTH =
  Math.floor(
    (SCREEN_WIDTH -
      CARD_PADDING_H * 2 -
      Spacing.lg * 2 -
      GRID_GAP * (GRID_COLUMNS - 1)) /
      GRID_COLUMNS,
  ) - 1;

interface GridItemData {
  icon: React.ComponentType<any>;
  titleKey: string;
  onPress: () => void;
  iconColor: string;
  iconBg: string;
  /** Optional extra search keywords (French/English aliases) */
  searchAliases?: string[];
}

interface SectionData {
  key: string;
  title: string;
  emoji: string;
  items: GridItemData[];
}

// ─────────────────────────────────────────────
// Grid Item
// ─────────────────────────────────────────────
const GridItem = React.memo(function GridItem({
  item,
  t,
  showIcons,
}: {
  item: GridItemData;
  t: (key: string) => string;
  showIcons: boolean;
}) {
  const Icon = item.icon;
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, {
      toValue: 0.92,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();
  const onPressOut = () =>
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      damping: 15,
      stiffness: 300,
    }).start();

  return (
    <Animated.View style={{ transform: [{ scale }], width: GRID_ITEM_WIDTH }}>
      <TouchableOpacity
        style={styles.gridItem}
        onPress={item.onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={1}
      >
        {showIcons && (
          <View
            style={[styles.gridIconContainer, { backgroundColor: item.iconBg }]}
          >
            <Icon size={22} color={item.iconColor} strokeWidth={1.8} />
          </View>
        )}
        <TText
          style={styles.gridItemLabel}
          tKey={item.titleKey}
          numberOfLines={2}
        />
      </TouchableOpacity>
    </Animated.View>
  );
});

// ─────────────────────────────────────────────
// Collapsible Section Card
// ─────────────────────────────────────────────
function SectionCard({
  section,
  t,
  triggerLightHaptic,
  defaultOpen = false,
  collapsibleEnabled,
  showIcons,
  isRTL = false,
}: {
  section: SectionData;
  t: (key: string) => string;
  triggerLightHaptic: () => void;
  defaultOpen?: boolean;
  collapsibleEnabled: boolean;
  showIcons: boolean;
  isRTL?: boolean;
}) {
  // If collapsible is disabled, always open
  const isAlwaysOpen = !collapsibleEnabled;
  const [open, setOpen] = useState(defaultOpen || isAlwaysOpen);
  const [measuredHeight, setMeasuredHeight] = useState(0);
  const rotateAnim = useRef(
    new Animated.Value(defaultOpen || isAlwaysOpen ? 1 : 0),
  ).current;
  const heightAnim = useRef(
    new Animated.Value(defaultOpen || isAlwaysOpen ? 1 : 0),
  ).current;

  const toggle = useCallback(() => {
    // If collapsible is disabled, do nothing
    if (!collapsibleEnabled) return;
    if (measuredHeight === 0) return;
    triggerLightHaptic();
    const next = !open;
    setOpen(next);

    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: next ? 1 : 0,
        useNativeDriver: true,
        damping: 18,
        stiffness: 260,
      }),
      Animated.timing(heightAnim, {
        toValue: next ? 1 : 0,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    open,
    measuredHeight,
    rotateAnim,
    heightAnim,
    triggerLightHaptic,
    collapsibleEnabled,
  ]);

  const onContentLayout = useCallback(
    (e: any) => {
      const h = e.nativeEvent.layout.height;
      if (h > 0 && measuredHeight === 0) {
        setMeasuredHeight(h);
        heightAnim.setValue(defaultOpen || isAlwaysOpen ? 1 : 0);
      }
    },
    [measuredHeight, defaultOpen, heightAnim, isAlwaysOpen],
  );

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  const animatedHeight = isAlwaysOpen
    ? undefined // No height animation when collapsible is disabled
    : measuredHeight > 0
      ? heightAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, measuredHeight],
        })
      : undefined;

  const animatedOpacity = isAlwaysOpen
    ? 1
    : heightAnim.interpolate({
        inputRange: [0, 0.4, 1],
        outputRange: [0, 0.7, 1],
      });

  return (
    <View style={styles.sectionCard}>
      {/* ── Header ── */}
      <TouchableOpacity
        style={[styles.sectionHeader, isRTL && styles.sectionHeaderRTL]}
        onPress={toggle}
        activeOpacity={collapsibleEnabled ? 0.7 : 1}
        disabled={!collapsibleEnabled}
      >
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.sectionTitle, isRTL && styles.sectionTitleRTL]}
        >
          {section.title}
        </Text>
        <View style={styles.sectionHeaderRight}>
          {collapsibleEnabled && (
            <>
              <View style={styles.countBadge}>
                <Text style={styles.countText}>{section.items.length}</Text>
              </View>
              <Animated.View style={{ transform: [{ rotate }] }}>
                <ChevronDown
                  size={18}
                  color={BankingColors.textSecondary}
                  strokeWidth={2.5}
                />
              </Animated.View>
            </>
          )}
        </View>
      </TouchableOpacity>

      {/* ── Animated wrapper ── */}
      <Animated.View
        style={[
          { overflow: "hidden", opacity: animatedOpacity },
          animatedHeight !== undefined ? { height: animatedHeight } : {},
        ]}
      >
        {/* Invisible measure layer — renders once off-screen to get real height */}
        {!isAlwaysOpen && measuredHeight === 0 && (
          <View onLayout={onContentLayout} style={styles.measureLayer}>
            <View style={styles.gridContainer}>
              {section.items.map((item, idx) => (
                <GridItem
                  key={`m-${idx}`}
                  item={item}
                  t={t}
                  showIcons={showIcons}
                />
              ))}
            </View>
          </View>
        )}

        {/* Actual visible content */}
        <View style={styles.gridContainer}>
          {section.items.map((item, idx) => (
            <GridItem key={idx} item={item} t={t} showIcons={showIcons} />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ─────────────────────────────────────────────
// Search helpers
// ─────────────────────────────────────────────

/**
 * Normalize text for search comparison:
 * - lowercase
 * - strip accents (é→e, à→a, ç→c, etc.)
 * - strip special characters
 * - trim
 */
const normalizeForSearch = (text: string): string =>
  text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics/accents
    .replace(
      /[^a-z0-9\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF\s]/g,
      "",
    ) // keep alphanumeric, Arabic + spaces
    .trim();

/**
 * Check if ALL query words appear in the searchable text.
 * Supports partial/substring matching so "pla" matches "placements".
 */
const matchesAllWords = (
  searchableText: string,
  queryWords: string[],
): boolean => queryWords.every((word) => searchableText.includes(word));

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────
export default function MenuScreen() {
  const insets = useSafeAreaInsets();
  const { useLogout } = useAuth();
  const { triggerLightHaptic } = useHaptic();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { t, i18n } = useTranslation();
  const logout = useLogout();
  const appVersion = Constants.expoConfig?.version;

  // ══════════════════════════════════════════════════════════════
  // 🔧 TOGGLE THESE TO ENABLE/DISABLE FEATURES
  // ══════════════════════════════════════════════════════════════
  const [collapsibleEnabled, setCollapsibleEnabled] = useState(false);
  const [showIcons, setShowIcons] = useState(true);
  // ══════════════════════════════════════════════════════════════

  const { data: profile } = useProfile();

  const primaryUser = useMemo(
    () => getPrimaryUser(profile?.users),
    [profile?.users],
  );

  const USER_FULL_NAME = useMemo(() => getFullName(primaryUser), [primaryUser]);
  const USER_INITIALS = useMemo(() => getInitials(primaryUser), [primaryUser]);
  const avatarBg = useMemo(() => getAvatarBg(primaryUser), [primaryUser]);

  const handleLogout = useCallback(() => setShowLogoutModal(true), []);
  const confirmLogout = useCallback(async () => {
    setShowLogoutModal(false);
    await logout();
  }, [logout]);

  const formatLastConnection = useCallback(() => {
    const users = profile?.users ?? [];
    if (!users.length) return null;
    const u =
      users.find(
        (x) =>
          x.defaultUser === "true" ||
          x.defaultUser === "1" ||
          x.defaultUser === "Y",
      ) ?? users[0];
    const raw = u?.lastDateConnexion;
    if (!raw || raw === "null") return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} : ${hh}:${min}`;
  }, [profile?.users]);

  const lastConnection = formatLastConnection();

  const sections: SectionData[] = useMemo(
    () => [
      {
        key: "payments",
        title: t("menu.paymentsTransfers"),
        emoji: "💸",
        items: [
          {
            icon: ArrowLeftRight,
            titleKey: "menu.transfers",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(home)/send-money" as any),
            iconColor: BankingColors.primary,
            iconBg: "#FFF5F3",
            searchAliases: [
              "virement",
              "transfer",
              "envoyer",
              "envoi",
              "تحويل",
              "إرسال",
              "حوالة",
            ],
          },
          {
            icon: History,
            titleKey: "qa_transfers_title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(home)/transfer-history"),
            iconColor: "#6B7280",
            iconBg: "#F3F4F6",
            searchAliases: [
              "historique",
              "history",
              "virement",
              "سجل",
              "تاريخ",
              "تحويلات",
            ],
          },
          {
            icon: Users,
            titleKey: "beneficiaries.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(home)/beneficiaries" as any),
            iconColor: "#16A34A",
            iconBg: "#F0FDF4",
            searchAliases: [
              "beneficiaire",
              "destinataire",
              "contact",
              "مستفيد",
              "مستفيدون",
            ],
          },
          {
            icon: Receipt,
            titleKey: "menu.billPayments",
            onPress: () => router.navigate("/(root)/(tabs)/(factures)" as any),
            iconColor: "#9333EA",
            iconBg: "#FAF5FF",
            searchAliases: [
              "facture",
              "paiement",
              "bill",
              "steg",
              "sonede",
              "telecom",
              "فاتورة",
              "دفع",
              "فواتير",
            ],
          },
          {
            icon: CreditCard,
            titleKey: "menu.cardReload",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(cartes)/reload-card" as any),
            iconColor: "#0284C7",
            iconBg: "#F0F9FF",
            searchAliases: [
              "recharge",
              "carte",
              "card",
              "reload",
              "بطاقة",
              "شحن",
              "رصيد",
            ],
          },
          {
            icon: History,
            titleKey: "menu.cardReloadHistory",
            onPress: () =>
              router.navigate(
                "/(root)/(tabs)/(cartes)/reload-card-history" as any,
              ),
            iconColor: "#0284C7",
            iconBg: "#F0F9FF",
            searchAliases: [
              "recharge",
              "carte",
              "card",
              "reload",
              "historique",
              "history",
              "بطاقة",
              "شحن",
              "سجل",
            ],
          },
          {
            icon: GraduationCap,
            titleKey: "schooling.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/schooling" as any),
            iconColor: BankingColors.schooling,
            iconBg: "#FFF7ED",
            searchAliases: [
              "scolarite",
              "ecole",
              "school",
              "university",
              "universite",
              "inscription",
              "تمدرس",
              "مدرسة",
              "تعليم",
              "جامعة",
            ],
          },
          {
            icon: DollarSign,
            titleKey: "menu.exchangeRates",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/exchange-rates" as any),
            iconColor: "#CA8A04",
            iconBg: "#FEFCE8",
            searchAliases: [
              "change",
              "devise",
              "dollar",
              "euro",
              "taux",
              "exchange",
              "currency",
              "صرف",
              "عملة",
              "دولار",
              "يورو",
              "سعر",
            ],
          },
          {
            icon: Banknote,
            titleKey: "savingPlans.title",
            onPress: () =>
              router.push("/(root)/(tabs)/(menu)/saving-plans" as any),
            iconColor: "#059669",
            iconBg: "#ECFDF5",
            searchAliases: [
              "epargne",
              "saving",
              "plan",
              "economie",
              "ادخار",
              "توفير",
              "خطة",
            ],
          },
        ],
      },
      {
        key: "consultation",
        title: t("menu.consultation"),
        emoji: "📊",
        items: [
          {
            icon: Wallet,
            titleKey: "menu.myAccounts",
            onPress: () => router.navigate("/(root)/(tabs)/(home)" as any),
            iconColor: "#2563EB",
            iconBg: "#EFF6FF",
            searchAliases: [
              "compte",
              "account",
              "solde",
              "balance",
              "حساب",
              "رصيد",
              "حساباتي",
            ],
          },
          {
            icon: CreditCard,
            titleKey: "menu.myCards",
            onPress: () => router.navigate("/(root)/(tabs)/(cartes)" as any),
            iconColor: "#7C3AED",
            iconBg: "#F5F3FF",
            searchAliases: [
              "carte",
              "card",
              "visa",
              "mastercard",
              "بطاقة",
              "بطاقاتي",
              "كارت",
            ],
          },
          {
            icon: TrendingUp,
            titleKey: "menu.placements",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/placements" as any),
            iconColor: "#059669",
            iconBg: "#ECFDF5",
            searchAliases: [
              "placement",
              "investissement",
              "invest",
              "depot",
              "terme",
              "استثمار",
              "توظيف",
              "إيداع",
            ],
          },
          {
            icon: Wallet,
            titleKey: "menu.credits",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/loans" as any),
            iconColor: "#D97706",
            iconBg: "#FFFBEB",
            searchAliases: [
              "credit",
              "pret",
              "loan",
              "emprunt",
              "قرض",
              "تمويل",
              "اقتراض",
            ],
          },
          {
            icon: FolderOpen,
            titleKey: "edocs.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/edocs" as any),
            iconColor: "#0891B2",
            iconBg: "#ECFEFF",
            searchAliases: [
              "document",
              "edoc",
              "releve",
              "attestation",
              "rib",
              "pdf",
              "وثيقة",
              "كشف",
              "شهادة",
              "مستند",
            ],
          },
          {
            icon: Receipt,
            titleKey: "menu.consultRib",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(home)/account-details"),
            iconColor: "#0EA5E9",
            iconBg: "#F0F9FF",
            searchAliases: [
              "rib",
              "releve identite bancaire",
              "bank details",
              "iban",
              "account rib",
              "ريب",
              "حساب بنكي",
            ],
          },
          {
            icon: Receipt,
            titleKey: "cheques.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/cheques" as any),
            iconColor: "#DC2626",
            iconBg: "#FEF2F2",
            searchAliases: ["cheque", "chequier", "شيك", "شيكات"],
          },
          {
            icon: Receipt,
            titleKey: "cheques.createChequebook",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/create-chequebook" as any),
            iconColor: "#BE185D",
            iconBg: "#FDF2F8",
            searchAliases: [
              "chequier",
              "commander",
              "commande",
              "nouveau cheque",
              "دفتر شيكات",
              "طلب",
              "شيك",
            ],
          },
          {
            icon: Receipt,
            titleKey: "bills.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/bills" as any),
            iconColor: "#EA580C",
            iconBg: "#FFF7ED",
            searchAliases: [
              "effet",
              "traite",
              "bill",
              "lettre change",
              "كمبيالة",
              "ورقة تجارية",
            ],
          },
          {
            icon: Package,
            titleKey: "menu.equipments",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/equipements" as any),
            iconColor: "#4338CA",
            iconBg: "#EEF2FF",
            searchAliases: [
              "equipement",
              "pack",
              "offre",
              "souscription",
              "تجهيز",
              "عرض",
              "اشتراك",
            ],
          },
          {
            icon: BriefcaseBusiness,
            titleKey: "portfolio.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/portfolio-titres" as any),
            iconColor: "#1D4ED8",
            iconBg: "#EFF6FF",
            searchAliases: [
              "portefeuille",
              "titre",
              "bourse",
              "action",
              "portfolio",
              "stock",
              "محفظة",
              "بورصة",
              "أسهم",
            ],
          },
        ],
      },
      {
        key: "settings",
        title: t("menu.settings"),
        emoji: "⚙️",
        items: [
          {
            icon: Shield,
            titleKey: "more.security",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/change-password" as any),
            iconColor: "#DC2626",
            iconBg: "#FEF2F2",
            searchAliases: [
              "securite",
              "password",
              "mot de passe",
              "mdp",
              "changer",
              "أمن",
              "كلمة مرور",
              "تغيير",
            ],
          },
          {
            icon: Settings,
            titleKey: "notificationConfig.menuTitle",
            onPress: () =>
              router.navigate(
                "/(root)/(tabs)/(menu)/notification-config" as any,
              ),
            iconColor: "#6B7280",
            iconBg: "#F3F4F6",
            searchAliases: [
              "notification",
              "alerte",
              "alert",
              "push",
              "sms",
              "email",
              "إشعار",
              "تنبيه",
              "رسالة",
            ],
          },
          {
            icon: Fingerprint,
            titleKey: "biometry.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/biometry-settings" as any),
            iconColor: "#7C3AED",
            iconBg: "#F5F3FF",
            searchAliases: [
              "biometrie",
              "empreinte",
              "fingerprint",
              "face id",
              "touch id",
              "بيومتري",
              "بصمة",
            ],
          },
          {
            icon: MessageSquare,
            titleKey: "claims.title",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/claims-home" as any),
            iconColor: "#0891B2",
            iconBg: "#ECFEFF",
            searchAliases: [
              "reclamation",
              "claim",
              "plainte",
              "probleme",
              "signaler",
              "شكوى",
              "مشكلة",
              "تبليغ",
            ],
          },
          {
            icon: Users,
            titleKey: "menu.contactInfo",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/contact-info" as any),
            iconColor: "#4338CA",
            iconBg: "#EEF2FF",
            searchAliases: [
              "contact",
              "telephone",
              "adresse",
              "email",
              "info",
              "اتصال",
              "هاتف",
              "عنوان",
            ],
          },
          {
            icon: SlidersHorizontal,
            titleKey: "menu.customizeAccounts",
            onPress: () =>
              router.navigate(
                "/(root)/(tabs)/(menu)/customize-accounts" as any,
              ),
            iconColor: "#0891B2",
            iconBg: "#ECFEFF",
            searchAliases: [
              "personnaliser",
              "customize",
              "ordre",
              "renommer",
              "masquer",
              "تخصيص",
              "ترتيب",
              "إخفاء",
            ],
          },
          {
            icon: Globe,
            titleKey: "menu.language",
            onPress: () =>
              router.navigate("/(root)/(tabs)/(menu)/language" as any),
            iconColor: "#2563EB",
            iconBg: "#EFF6FF",
            searchAliases: [
              "langue",
              "language",
              "francais",
              "anglais",
              "arabe",
              "english",
              "french",
              "لغة",
              "عربي",
              "فرنسي",
              "انجليزي",
            ],
          },
        ],
      },
    ],
    [t],
  );

  // ── Advanced fuzzy search ──────────────────────────────────────────────
  const filteredSections = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) return sections;

    const normalizedQuery = normalizeForSearch(raw);
    // Split query into individual words for multi-word matching
    const queryWords = normalizedQuery.split(/\s+/).filter(Boolean);
    if (!queryWords.length) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          // 1. Match against translated label
          const translatedLabel = normalizeForSearch(t(item.titleKey));

          // 2. Match against the raw title key
          const rawKey = normalizeForSearch(item.titleKey.replace(/\./g, " "));

          // 3. Match against ALL search aliases regardless of current language
          const aliases = (item.searchAliases ?? [])
            .map(normalizeForSearch)
            .join(" ");

          // Combine item-level searchable text only (no section title —
          // including section title caused all items in a section to show
          // whenever the section name matched the query)
          const searchableText = `${translatedLabel} ${rawKey} ${aliases}`;

          // All query words must appear somewhere in the combined text
          return matchesAllWords(searchableText, queryWords);
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery, sections, t]);

  const hasSearchQuery = searchQuery.trim().length > 0;
  const isSearching = hasSearchQuery;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.userSection}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
                <Text style={styles.avatarText}>{USER_INITIALS}</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{USER_FULL_NAME}</Text>
                {!!lastConnection && (
                  <View style={styles.lastConnectionBadge}>
                    <View style={styles.lastConnectionRow}>
                      <Clock size={moderateScale(10)} color={BankingColors.textSecondary} strokeWidth={2.5} />
                      <Text style={styles.lastConnectionLabel}>
                        {t("menu.lastConnection")} :
                      </Text>
                      <Text style={styles.lastConnectionValue}>
                        {lastConnection}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <TouchableOpacity
              style={styles.logoutIconButton}
              onPress={handleLogout}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <LogOut size={moderateScale(18)} color={BankingColors.primary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* ── Search ── */}
          <View style={styles.searchContainer}>
            <Search
              size={moderateScale(16)}
              color={BankingColors.textSecondary}
              strokeWidth={2}
            />
            <TextInput
              style={styles.searchInput}
              placeholder={t("menu.search")}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={BankingColors.textSecondary}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {hasSearchQuery && (
              <TouchableOpacity
                onPress={() => {
                  triggerLightHaptic();
                  setSearchQuery("");
                  Keyboard.dismiss();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Sections ── */}
        <View style={styles.menuContent}>
          {filteredSections.length > 0 ? (
            filteredSections.map((section, idx) => (
              <SectionCard
                key={section.key}
                section={section}
                t={t}
                triggerLightHaptic={triggerLightHaptic}
                defaultOpen={idx === 0 || isSearching}
                collapsibleEnabled={collapsibleEnabled}
                showIcons={showIcons}
                isRTL={i18n.language === "ar"}
              />
            ))
          ) : (
            <ScreenState
              variant="empty"
              titleKey="menu.noResults"
              descriptionKey="menu.noResultsDescription"
            />
          )}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>
            {t("menu.version")} {appVersion ?? "-"}
          </Text>
        </View>
      </ScrollView>

      {/* ── Logout Modal ── */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconContainer}>
              <AlertCircle size={48} color="#FF9500" strokeWidth={2} />
            </View>
            <Text style={styles.modalMessage}>
              {t("menu.logoutConfirmMessage")}
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>{t("menu.logout")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F4F6FA" },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  // ── Header ──
  header: {
    paddingHorizontal: horizontalScale(Spacing.lg),
    paddingTop: verticalScale(Spacing.lg),
    paddingBottom: verticalScale(Spacing.lg),
  },
  userSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: verticalScale(Spacing.lg),
  },
  avatarContainer: { flexDirection: "row", alignItems: "flex-start", flex: 1 },
  avatar: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    justifyContent: "center",
    alignItems: "center",
    marginRight: horizontalScale(Spacing.md),
  },
  avatarText: { fontSize: moderateScale(18), fontFamily: FontFamily.bold, color: "#FFFFFF" },
  userInfo: { flex: 1 },
  userName: {
    fontSize: moderateScale(15),
    fontFamily: FontFamily.bold,
    color: "#0F172A",
    letterSpacing: -0.2,
  },
  lastConnectionBadge: {
    marginTop: verticalScale(2),
    backgroundColor: "#F1F5F9",
    paddingVertical: verticalScale(4),
    borderRadius: moderateScale(10),
    alignSelf: "flex-start",
  },
  lastConnectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: horizontalScale(4),
  },
  lastConnectionLabel: {
    fontSize: moderateScale(11),
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
  },
  lastConnectionValue: {
    fontSize: moderateScale(11),
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  logoutIconButton: {
    width: moderateScale(33),
    height: moderateScale(33),
    borderRadius: moderateScale(20),
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
    shadowColor: BankingColors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    top: verticalScale(-5),
  },

  // ── Search ──
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: horizontalScale(Spacing.lg),
    paddingVertical: verticalScale(12),
    borderRadius: moderateScale(14),
    gap: horizontalScale(10),
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: moderateScale(14), color: "#0F172A" },

  // ── Sections ──
  menuContent: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    gap: 12,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EAECF0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionEmoji: {
    fontSize: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: "#0F172A",
    letterSpacing: -0.2,
    flex: 1,
  },
  sectionHeaderRTL: {
    flexDirection: "row-reverse",
  },
  sectionTitleRTL: {
    textAlign: "right",
    writingDirection: "rtl",
  },
  sectionHeaderRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  countBadge: {
    backgroundColor: "#F1F5F9",
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: "#64748B",
  },

  measureLayer: {
    position: "absolute",
    opacity: 0,
    left: 0,
    right: 0,
    pointerEvents: "none" as const,
  },
  // ── Grid ──
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: CARD_PADDING_H,
    paddingBottom: Spacing.lg,
  },
  gridItem: {
    width: GRID_ITEM_WIDTH,
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  gridIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  gridItemLabel: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },

  // ── No results ──
  noResultsContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.sm,
  },
  noResultsIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BankingColors.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  noResultsTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginTop: Spacing.md,
  },
  noResultsSubtitle: {
    fontSize: 14,
    color: BankingColors.textSecondary,
    textAlign: "center",
  },

  // ── Version ──
  versionContainer: {
    alignItems: "center",
    paddingVertical: Spacing.xxl,
    marginTop: Spacing.md,
  },
  versionText: { fontSize: 13, color: BankingColors.textMuted },

  // ── Logout Modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    paddingBottom: Spacing.massive,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: Spacing.lg,
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    alignItems: "center",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,149,0,0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  modalMessage: {
    fontSize: 17,
    color: "#0F172A",
    textAlign: "center",
    marginBottom: Spacing.xxl,
    lineHeight: 24,
  },
  modalButtons: { flexDirection: "column", width: "100%", gap: Spacing.md },
  modalButton: {
    width: "100%",
    paddingVertical: Spacing.lg,
    borderRadius: 16,
    alignItems: "center",
  },
  cancelButton: { backgroundColor: "#F1F5F9" },
  confirmButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: BankingColors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: "#0F172A",
  },
  confirmButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
});
