// app/_layout.tsx
import "@/global.css";
import "@/features/i18next";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Stack, useRouter, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { QueryClientProvider } from "@tanstack/react-query";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import { StatusBar } from "expo-status-bar";
import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import { AuthProvider, useAuth } from "@/hooks/auth-store";
import { BankingProvider } from "@/hooks/banking-store";

import { BankingColors } from "@/constants";
import { queryClient } from "../queryClient";

import * as Notifications from "expo-notifications";
import * as Linking from "expo-linking";
import messaging from "@react-native-firebase/messaging";
import { useFonts } from "expo-font";
import { openLocalPdf } from "@/utils/openLocalPdf";
import { hydrateLanguage } from "@/features/language";

import { initPushNotifications } from "@/notification/pushNotifications";
import { useDeepLinkDebug } from "@/hooks/useDeepLinkDebug";
import FlashMessage from "react-native-flash-message";
import { AppFonts } from "@/constants/fonts";
import { useSecurityGuard } from "@/utils/useSecurityGuard";
import { usePreventScreenCaptureByRoute } from "@/utils/IUseSecurityGuard";
import GlobalPermissionModal from "@/components/GlobalPermissionModal";
import { isProductionBuild } from "@/utils/buildConfig";
import { Text as RNText, TextInput as RNTextInput } from "react-native";



const patchTextComponent = (Component: any) => {
  const origRender = Component.render;
  if (!origRender) return;
  Component.render = function (props: any, ref: any) {
    return origRender.call(this, { ...props, allowFontScaling: false }, ref);
  };
};

patchTextComponent(RNText);
patchTextComponent(RNTextInput);
SplashScreen.preventAutoHideAsync().catch(() => {});

type PushData = Record<string, unknown>;

function now() {
  return new Date().toISOString();
}

function errMsg(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  try {
    return JSON.stringify(e);
  } catch {
    return String(e);
  }
}

function safeJson(payload: unknown) {
  if (payload === undefined) return undefined;
  if (typeof payload === "string") return payload;
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

function logBlock(title: string, payload?: unknown) {
  console.log("══════════════════════════════════════");
  console.log(`[${now()}] ${title}`);
  const p = safeJson(payload);
  if (p !== undefined) console.log(p);
  console.log("══════════════════════════════════════");
}

function toStringRecord(obj: unknown): Record<string, string> {
  if (!obj || typeof obj !== "object") return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") out[k] = v;
    else if (typeof v === "number" || typeof v === "boolean")
      out[k] = String(v);
    else {
      try {
        out[k] = JSON.stringify(v);
      } catch {
        out[k] = String(v);
      }
    }
  }
  return out;
}

function normalizeParams(p: unknown): Record<string, string> {
  if (p === null || p === undefined) return {};
  if (typeof p === "string") {
    const s = p.trim();
    if (!s || s.toLowerCase() === "null" || s.toLowerCase() === "undefined")
      return {};
    try {
      const parsed = JSON.parse(s);
      return toStringRecord(parsed);
    } catch {
      return { p: s };
    }
  }
  return toStringRecord(p);
}

function forcePathStyle(url: string) {
  try {
    if (!url) return url;
    if (url.startsWith("attijariup:///")) return url;
    if (url.startsWith("attijariup://")) {
      const rest = url.slice("attijariup://".length);
      return `attijariup:///${rest.replace(/^\/+/, "")}`;
    }
    return url;
  } catch {
    return url;
  }
}

function getPushAction(data: PushData | undefined) {
  const a =
    data && typeof (data as any).action === "string"
      ? ((data as any).action as string)
      : "";
  return a.trim();
}

function isResetPasswordPush(data: PushData | undefined) {
  const action = getPushAction(data).toLowerCase();
  if (action === "reset-password") return true;

  const screen =
    typeof (data as any)?.screen === "string"
      ? ((data as any).screen as string)
      : "";
  const pathname =
    typeof (data as any)?.pathname === "string"
      ? ((data as any).pathname as string)
      : "";
  const url =
    typeof (data as any)?.url === "string" ? ((data as any).url as string) : "";

  const raw = `${screen} ${pathname} ${url}`.toLowerCase();
  return raw.includes("reset-password");
}

/**
 * ✅ Retry helper for cold-start races (Expo tap from quit sometimes returns null quickly)
 */
async function getLastNotifWithRetry(tries = 6, delayMs = 300) {
  for (let i = 0; i < tries; i++) {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) return last;
  }
  return null;
}

/**
 * ✅ IMPORTANT FIX:
 * If url is internal (attijariup://...), DO NOT Linking.openURL as primary routing.
 * Navigate directly with router to avoid flaky deep-link delivery.
 */
function routeFromPushData(
  data: PushData | undefined,
  router: ReturnType<typeof useRouter>,
) {
  if (!data) return;

  const url =
    typeof (data as any).url === "string"
      ? ((data as any).url as string)
      : undefined;
  const screen =
    typeof (data as any).screen === "string"
      ? ((data as any).screen as string)
      : undefined;
  const pathname =
    typeof (data as any).pathname === "string"
      ? ((data as any).pathname as string)
      : undefined;

  // 1) url contract
  if (url && url.length > 0) {
    const fixed = forcePathStyle(url);

    // internal scheme => route via router
    if (fixed.startsWith("attijariup://")) {
      const parsed = Linking.parse(fixed);
      const raw = parsed.path ?? parsed.hostname ?? "";
      const route = String(raw).replace(/^\/+/, "");
      const params = (parsed.queryParams ?? {}) as Record<string, unknown>;

      const path = `/${route}`;
      logBlock("🧭 routeFromPushData: internal url => router.replace", {
        url,
        fixed,
        parsed: {
          scheme: parsed.scheme,
          hostname: parsed.hostname,
          path: parsed.path,
          queryParams: parsed.queryParams },
        path,
        params });

      router.replace({
        pathname: path as any,
        params: toStringRecord(params) as any } as any);
      return;
    }

    // external url => open browser
    logBlock("🔗 routeFromPushData: external openURL", { url, fixed });
    Linking.openURL(fixed).catch((e: unknown) =>
      logBlock("❌ Linking.openURL failed", errMsg(e)),
    );
    return;
  }

  // 2) screen/pathname contract
  const target = screen ?? pathname;
  if (target && target.length > 0) {
    const path = target.startsWith("/") ? target : `/${target}`;

    const rest: Record<string, unknown> = { ...(data as any) };
    delete (rest as any).screen;
    delete (rest as any).url;
    delete (rest as any).pathname;

    const routeParams = {
      ...toStringRecord(rest),
      ...normalizeParams((data as any).params) };

    delete (routeParams as any).screen;
    delete (routeParams as any).url;
    delete (routeParams as any).pathname;

    logBlock("🧭 routeFromPushData: router.replace(screen/pathname)", {
      path,
      routeParams });

    router.navigate({
      pathname: path as any,
      params: routeParams as any } as any);
    return;
  }

  logBlock("⚠️ routeFromPushData: no route matched", data);
}

function RootLayoutNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { authState, isBootstrapped, useLogout } = useAuth();

  useSecurityGuard({
      enabled: isProductionBuild, // ← entire hook disabled in dev + preview
    enforceInDev: false,
    debug: false,
    reaction: "block",
    recheckOnActive: true,
    onThreat: (threat) => {
      // already on the blocked screen or debug info — don't redirect again
      if (pathname.includes("app-blocked")) return;
      router.replace({
        pathname: "/(system)/app-blocked",
        params: {
          type: threat.type,
          reason: threat.reason,
          details: threat.details != null ? JSON.stringify(threat.details) : undefined,
        },
      });
    } });
  usePreventScreenCaptureByRoute({
    enabled: isProductionBuild, // ← false for preview
    key: "route-guard",
    debug: __DEV__,
    blockIfSegmentIncludes: ["(root)"], // ✅ blocks ALL screens under (root)
  });

  // const [fontsLoaded] = useFonts(AppFonts);
  //   if (!fontsLoaded) {
  //     // keep native splash visible (we never call hideAsync yet)
  //     return <View style={{ flex: 1, backgroundColor: BankingColors.white }} />;
  //   }
  // keep latest router in ref (avoid stale closures)
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // readiness refs (do not cause re-renders)
  const rootReadyRef = useRef(false);
  const bootRef = useRef(false);
  const authedRef = useRef(false);

  useEffect(() => {
    bootRef.current = isBootstrapped;
    logBlock("🧩 BOOTSTRAP state", { isBootstrapped });
  }, [isBootstrapped]);

  useEffect(() => {
    authedRef.current = !!authState.isAuthenticated;
    logBlock("🔐 AUTH state", { isAuthenticated: !!authState.isAuthenticated });
  }, [authState.isAuthenticated]);

  const [rootViewReady, setRootViewReady] = useState(false);
  const splashHiddenRef = useRef(false);

  const onLayoutRootView = useCallback(() => {
    if (rootReadyRef.current) return;
    rootReadyRef.current = true;
    setRootViewReady(true);
    logBlock("✅ ROOT VIEW READY (onLayout)");
  }, []);

  // push queue + dedupe
  const pendingPushRef = useRef<PushData | null>(null);
  const lastNavKeyRef = useRef<string | null>(null);

  const isNavReadyAuthed = () =>
    rootReadyRef.current && bootRef.current && authedRef.current;
  const isRootBootReady = () => rootReadyRef.current && bootRef.current;

  const handlePushData = useCallback((data: PushData) => {
    logBlock("📦 handlePushData() called with", data);

    // Router not ready yet => queue
    if (!isRootBootReady()) {
      pendingPushRef.current = data;
      logBlock("⏳ PUSH queued (root/boot not ready)", {
        ready: {
          root: rootReadyRef.current,
          boot: bootRef.current,
          authed: authedRef.current },
        data });
      return;
    }

    // Not authenticated:
    // - allow reset-password flow to go to auth immediately
    // - other pushes stay queued until user logs in
    if (!authedRef.current) {
      pendingPushRef.current = data;

      if (isResetPasswordPush(data)) {
        logBlock(
          "🟣 PUSH reset-password while logged-out => go to /(auth)",
          data,
        );
        const screen =
          typeof (data as any).screen === "string"
            ? (data as any).screen
            : "reset-password";
        console.log("====================================");
        console.log("🚀 ~ RootLayoutNav ~ screen:", screen);

        console.log("====================================");

        routerRef.current.navigate(`/(auth)/${screen}` as any);
      } else {
        logBlock("⏳ PUSH queued (logged-out, waiting login)", data);
      }
      return;
    }

    // Authenticated but not fully ready (rare) => queue
    if (!isNavReadyAuthed()) {
      pendingPushRef.current = data;
      logBlock("⏳ PUSH queued (not fully nav-ready)", {
        ready: {
          root: rootReadyRef.current,
          boot: bootRef.current,
          authed: authedRef.current },
        data });
      return;
    }

    // Dedup
    const navKey = safeJson(data) ?? String(Date.now());
    if (lastNavKeyRef.current === navKey) {
      logBlock("🟡 PUSH deduped", data);
      return;
    }
    lastNavKeyRef.current = navKey;

    logBlock("🟢 PUSH handle => routeFromPushData", data);
    routeFromPushData(data, routerRef.current);
  }, []);

  /**
   * Flush queued push:
   * - if user becomes authenticated => route to target
   * - NOTE: reset-password does NOT need auth, but we already route to /(auth) immediately.
   *   When /(auth) is mounted, user can continue the flow using the queued data (if your auth screens read it).
   */
  useEffect(() => {
    if (!rootViewReady) return;
    if (!isBootstrapped) return;

    const pending = pendingPushRef.current;
    if (!pending) return;

    // If logged in now => go to target
    if (authState.isAuthenticated) {
      pendingPushRef.current = null;
      logBlock("📤 FLUSH pending PUSH (authed)", pending);
      routeFromPushData(pending, routerRef.current);
    }
  }, [rootViewReady, isBootstrapped, authState.isAuthenticated]);
  const logout = useLogout();

  // ✅ Deep links observer
  useDeepLinkDebug({
    enabled: true,
    ignoreDevClientInitial: true,
    onUrl: (url) => logBlock("🧪 DL onUrl", url),
    onRoute: (route, params, rawUrl) => {
      logBlock("🧪 DL onRoute", { route, params, rawUrl });
      if (!route) return;

      const pathname = `/${route.replace(/^\/+/, "")}`;
      const authRoutes = [
        "reset-password",
        "forgot-password",
        "reset-password-confirm",
      ];
      const cleanRoute = route.replace(/^\/+/, "").replace(/^\(auth\)\//, "");

      // 1) Auth routes (reset-password, forgot-password, etc.)
      if (authRoutes.includes(cleanRoute)) {
        logBlock("🟢 DL auth route", {
          cleanRoute,
          params,
          authed: authedRef.current });

        if (authedRef.current) {
          // Logged in → logout first, then go to auth screen
          logout();
          setTimeout(() => {
            routerRef.current.replace("/(auth)/login" as any);
            setTimeout(() => {
              routerRef.current.push({
                pathname: `/(auth)/${cleanRoute}` as any,
                params: toStringRecord(params) as any } as any);
            }, 150);
          }, 200);
        } else {
          // Already logged out → login as root, then push
          routerRef.current.replace("/(auth)/login" as any);
          setTimeout(() => {
            routerRef.current.push({
              pathname: `/(auth)/${cleanRoute}` as any,
              params: toStringRecord(params) as any } as any);
          }, 100);
        }
        return;
      }

      // 2) App routes (send-money, transactions, etc.)
      if (authedRef.current) {
        // Logged in → home as root, then push target
        logBlock("🟢 DL app route (authed)", { pathname, params });
        routerRef.current.replace("/(root)/(tabs)/(home)" as any);
        setTimeout(() => {
          routerRef.current.push({
            pathname: pathname as any,
            params: params as any } as any);
        }, 100);
      } else {
        // Not logged in → queue deep link, redirect to login
        logBlock("⏳ DL app route queued (not authed)", { pathname, params });
        pendingPushRef.current = {
          screen: pathname,
          ...toStringRecord(params) };
        routerRef.current.replace("/(auth)/login" as any);
      }
    } });

  // ✅ ONE place to listen for notification taps (Expo + RNFirebase)
  useEffect(() => {
    let expoTapSub: Notifications.Subscription | undefined;
    let unsubRNFOpened: undefined | (() => void);

    (async () => {
      // Expo: quit-state open (WITH RETRY)
      try {
        logBlock("🧾 getLastNotificationResponseAsync() (retry start)");
        const last = await getLastNotifWithRetry(6, 300);
        logBlock(
          "🧾 getLastNotificationResponseAsync() (retry result)",
          last ?? "null",
        );
        if (last) {
          const data = (last.notification.request.content.data ??
            {}) as PushData;
          logBlock("🧾 EXPO initial tap data", data);
          handlePushData(data);
        }
      } catch (e) {
        logBlock("❌ getLastNotificationResponseAsync failed", errMsg(e));
      }

      // Expo: tap while app bg/fg
      expoTapSub = Notifications.addNotificationResponseReceivedListener(
        (resp) => {
          const data = (resp.notification.request.content.data ??
            {}) as PushData;
          logBlock("👉 EXPO TAP data", data);
          handlePushData(data);
        },
      );

      // RNFirebase: quit-state open (system FCM notif)
      try {
        const initial = await messaging().getInitialNotification();
        logBlock("🧾 RNF getInitialNotification()", initial ?? "null");
        if (initial?.data) {
          logBlock("🧾 RNF initial tap data", initial.data);
          handlePushData(initial.data as any);
        }
      } catch (e) {
        logBlock("❌ RNF getInitialNotification failed", errMsg(e));
      }

      // RNFirebase: background open
      unsubRNFOpened = messaging().onNotificationOpenedApp((msg) => {
        logBlock("👉 RNF OPENED FROM BG", msg ?? "null");
        if (msg?.data) handlePushData(msg.data as any);
      });
    })();

    return () => {
      try {
        expoTapSub?.remove();
      } catch {}
      try {
        unsubRNFOpened?.();
      } catch {}
    };
  }, [handlePushData]);

  // init push (permissions/token)
  const didInitPushRef = useRef(false);
  useEffect(() => {
    if (!isBootstrapped) return;
    if (didInitPushRef.current) return;
    didInitPushRef.current = true;

    logBlock("🔥 PUSH INIT start");

    (async () => {
      try {
        if (Platform.OS === "android") {
          await Notifications.setNotificationChannelAsync("default", {
            name: "Default",
            importance: Notifications.AndroidImportance.MAX,
            sound: "default",
            vibrationPattern: [0, 250, 250, 250] });
          logBlock("✅ Android channel set: default");
        }

        const res = await initPushNotifications({
          onEvent: (event) => {
            logBlock("🔔 PUSH EVENT (initPushNotifications)", event);
          },
          showSystemInForeground: true });

        logBlock("🔥 initPushNotifications done", { token: res.token });
      } catch (e) {
        logBlock("❌ Push setup failed", errMsg(e));
      }
    })();
  }, [isBootstrapped]);

  // hide splash
  useEffect(() => {
    const hide = async () => {
      if (!rootViewReady) return;
      if (!isBootstrapped) return;
      if (splashHiddenRef.current) return;

      splashHiddenRef.current = true;
      await SplashScreen.hideAsync();
      logBlock("✅ Splash hidden");
    };

    hide().catch((e) =>
      logBlock("❌ SplashScreen.hideAsync failed", errMsg(e)),
    );
  }, [rootViewReady, isBootstrapped]);

  Notifications.addNotificationResponseReceivedListener((response) => {
    const fileUri = response.notification.request.content.data?.fileUri;
    if (typeof fileUri === "string" && fileUri.endsWith(".pdf")) {
      openLocalPdf(fileUri).catch(console.error);
    }
  });

  if (!isBootstrapped)
    return <View style={styles.root} onLayout={onLayoutRootView} />;

  return (
    <View style={styles.root} onLayout={onLayoutRootView}>
      <Stack screenOptions={{ headerShown: false }}>
        {!authState.isAuthenticated ? (
          <Stack.Screen name="(auth)" />
        ) : (
          <Stack.Screen name="(root)" />
        )}
        <Stack.Screen name="(system)" />
      </Stack>
      <FlashMessage position="bottom" duration={3000} hideOnPress />
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(AppFonts);
  const [langReady, setLangReady] = useState(false);

  useEffect(() => {
    hydrateLanguage().finally(() => setLangReady(true));
  }, []);

  if (!fontsLoaded || !langReady) {
    return <View style={{ flex: 1, backgroundColor: BankingColors.white }} />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <GluestackUIProvider>
        <AuthProvider>
          <BankingProvider>
            <GestureHandlerRootView style={{ flex: 1 }}>
              <BottomSheetModalProvider>
                <StatusBar style="auto" backgroundColor={BankingColors.white} />

                <RootLayoutNav />
                <GlobalPermissionModal />
              </BottomSheetModalProvider>
            </GestureHandlerRootView>
          </BankingProvider>
        </AuthProvider>
      </GluestackUIProvider>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  root: { flex: 1, backgroundColor: BankingColors.white } });
