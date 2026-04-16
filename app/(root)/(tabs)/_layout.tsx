// app/(root)/(tabs)/_layout.tsx
import { Tabs, Redirect, router } from "expo-router";
import React, {
  useMemo,
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  Home,
  CreditCard,
  Receipt,
  MoreHorizontal,
  Plus,
  X,
  ReceiptText,
} from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { useAuth } from "@/hooks/auth-store";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  useWindowDimensions,
  Keyboard,
  Easing,
  Image,
} from "react-native";
import QuickActionsModal from "@/components/QuickActionsModal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FlashMessage from "react-native-flash-message";
import { BottomTabBar } from "@react-navigation/bottom-tabs";
import { useTranslation } from "react-i18next";
import SplashRenderComponent from "@/components/SplashRenderComponent";
import { FontFamily } from "@/constants";

export default function TabLayout() {
  const { authState, isLoading } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const gateLoading = isLoading;

  // ✅ Android bottom system bar height (nav bar / gesture bar)
  const androidBottomBarHeight = useMemo(() => {
    if (Platform.OS !== "android") return 0;
    return Math.min(34, Math.max(0, insets.bottom)); // clamp (example)
  }, [insets.bottom]);

  // ✅ unified bottom inset (Android navbar / iOS safe area)
  const bottomInset = insets.bottom; // use for both platforms

  // base heights
  const androidBaseHeight = 65;
  const iosBaseHeight = 65;

  const tabBarHeight =
    (Platform.OS === "android" ? androidBaseHeight : iosBaseHeight) +
    bottomInset;

  // ✅ Native-feel tabbar animation
  const tabTranslateY = useRef(new Animated.Value(0)).current;
  const tabOpacity = useRef(new Animated.Value(1)).current;
  const showTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPendingShow = () => {
    if (showTimeout.current) {
      clearTimeout(showTimeout.current);
      showTimeout.current = null;
    }
  };
  const animateOut = useCallback(
    (duration?: number) => {
      stopPendingShow();

      const d = typeof duration === "number" && duration > 0 ? duration : 220;

      Animated.parallel([
        Animated.timing(tabTranslateY, {
          toValue: tabBarHeight + 28,
          duration: Platform.OS === "ios" ? d : 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tabOpacity, {
          toValue: 0,
          duration: Platform.OS === "ios" ? Math.max(160, d - 40) : 150,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [tabBarHeight, tabOpacity, tabTranslateY],
  );

  const animateIn = useCallback(
    (duration?: number) => {
      const d = typeof duration === "number" && duration > 0 ? duration : 260;

      Animated.parallel([
        Platform.OS === "ios"
          ? Animated.spring(tabTranslateY, {
              toValue: 0,
              damping: 18,
              stiffness: 180,
              mass: 1,
              useNativeDriver: true,
            })
          : Animated.timing(tabTranslateY, {
              toValue: 0,
              duration: 260,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
        Animated.timing(tabOpacity, {
          toValue: 1,
          duration: Platform.OS === "ios" ? Math.min(220, d) : 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    },
    [tabOpacity, tabTranslateY],
  );

  // ✅ Delay 1s before showing again
  const animateInDelayed = useCallback(
    (duration?: number) => {
      stopPendingShow();
      showTimeout.current = setTimeout(() => animateIn(duration), 1000);
    },
    [animateIn],
  );

  useEffect(() => {
    const onShow = (e: any) => animateOut(e?.duration);
    const onHide = (e: any) => animateInDelayed(e?.duration);

    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const subShow = Keyboard.addListener(showEvt, onShow);
    const subHide = Keyboard.addListener(hideEvt, onHide);

    return () => {
      subShow.remove();
      subHide.remove();
      stopPendingShow();
    };
  }, [animateInDelayed, animateOut]);

  // i replace this istead of loading hwen ryhardrite the app
  if (gateLoading) {
    return <SplashRenderComponent />;
  }
  if (!authState.isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const handleFabPress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    setModalVisible((prev) => !prev);
  };

  const renderTabBar = (props: any) => (
    <Animated.View
      style={[
        styles.animatedBarWrap,
        {
          backgroundColor: BankingColors.background,
          transform: [{ translateY: tabTranslateY }],
          opacity: tabOpacity,
        },
      ]}
      pointerEvents="auto"
    >
      {/* Fallback solid overlay under tab bar (fix color hole when hidden) */}
      <View style={styles.tabBarBackdrop} pointerEvents="none" />

      {/* Keep tabbar at lower stacking */}
      <View style={{ zIndex: 0, elevation: 0 }}>
        <BottomTabBar {...props} />
      </View>

      {/* Put FAB above everything */}
      <View
        style={[
          styles.fabContainer,
          Platform.OS === "android" && bottomInset > 0
            ? { top: -15 - bottomInset / 2 }
            : null,
          { zIndex: 9999, elevation: 9999 }, // ✅ important
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity onPress={handleFabPress} activeOpacity={0.9}>
          <Animated.View
            style={[
              styles.fab,
              { transform: [{ scale: scaleAnim }] },
              { zIndex: 9999, elevation: 9999 }, // ✅ important
            ]}
          >
            {modalVisible ? (
              <X size={28} color="#FFFFFF" strokeWidth={3} />
            ) : (
              <Plus size={32} color="#FFFFFF" strokeWidth={3} />
            )}
          </Animated.View>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <>
      {/* Static bottom layer under tab bar as final fallback */}
      <View
        style={[styles.staticBottomBackDrop, { height: tabBarHeight + 8 }]}
        pointerEvents="none"
      />
      <Tabs
        tabBar={renderTabBar}
        screenOptions={{
          tabBarActiveTintColor: BankingColors.primary,
          tabBarInactiveTintColor: BankingColors.textLight,
          headerShown: true,
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: { fontFamily: FontFamily.bold },

          sceneStyle: {
            backgroundColor: BankingColors.background,
          },

          tabBarStyle: {
            backgroundColor: BankingColors.background,
            borderTopColor: BankingColors.border,
            overflow: "visible",
            height: tabBarHeight,
            paddingBottom: bottomInset,
            paddingTop: 6,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontFamily: FontFamily.semibold,
            marginTop: 2,
          },
          tabBarItemStyle: {
            minHeight: 44,
            paddingVertical: 4,
          },
        }}
      >
        <Tabs.Screen
          name="(home)"
          options={{
            title: t("Tabs.title.home"),
            headerShown: false,
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate("/(root)/(tabs)/(home)");
            },
          }}
        />

        <Tabs.Screen
          name="(cartes)"
          options={{
            title: t("Tabs.title.cards"),
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <CreditCard size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate("/(root)/(tabs)/(cartes)");
            },
          }}
        />

        {/* Placeholder route (hidden) - FAB handles actions */}
        <Tabs.Screen
          name="quick-actions"
          options={{
            title: "",
            tabBarButton: () => null,
          }}
        />

        <Tabs.Screen
          name="(factures)"
          options={{
            title: t("Tabs.title.bills"),
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <ReceiptText size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate("/(root)/(tabs)/(factures)");
            },
          }}
        />

        <Tabs.Screen
          name="(menu)"
          options={{
            title: t("Tabs.title.more"),
            headerShown: false,
            tabBarIcon: ({ color, size }) => (
              <MoreHorizontal size={size} color={color} />
            ),
          }}
          listeners={{
            tabPress: (e) => {
              e.preventDefault();
              router.navigate("/(root)/(tabs)/(menu)");
            },
          }}
        />
      </Tabs>

      <FlashMessage position="bottom" />
      <QuickActionsModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
  },

  animatedBarWrap: {
    backgroundColor: BankingColors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: BankingColors.border,
    overflow: "visible", // ✅ add this here too
    position: "relative", // ✅ helps with absolute children
  },

  tabBarBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: BankingColors.background,
    zIndex: -1,
  },

  staticBottomBackDrop: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BankingColors.background,
    zIndex: -2,
  },

  fabContainer: {
    position: "absolute",
    top: -28,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 12,
  },
  imageStyle: {
    width: 200,
  },
});
