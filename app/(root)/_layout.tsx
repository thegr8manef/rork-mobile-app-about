// app/_layout.tsx

import { Stack, Redirect } from "expo-router";
import { useEffect, useRef, useState } from "react";
import NetInfo from "@react-native-community/netinfo";
import { useAuth } from "@/hooks/auth-store";
import { isProductionBuild } from "@/utils/buildConfig";
import SplashRenderComponent from "@/components/SplashRenderComponent";
import { useInAppUpdates } from "@/hooks/useInAppUpdates";
import InAppUpdateModal from "@/components/InAppUpdateModal";

export default function RootLayout() {
  const { authState, isLoading } = useAuth();

  // ── In-App Updates (covers closed testing + production) ───────────────────
  const { showModal: showUpdateModal, handleConfirm: onUpdateConfirm, handleDismiss: onUpdateDismiss } =
    useInAppUpdates(isProductionBuild);

  // ✅ Start as true — never block the app on internet check
  const [isConnected, setIsConnected] = useState(true);

  // ✅ Track if we've had at least one successful connection
  // so we don't redirect on app start when NetInfo hasn't resolved yet
  const hasEverConnected = useRef(false);

  // ───────────────────────────────────────────
  // Internet listener (ONLY in production)
  // ───────────────────────────────────────────
  useEffect(() => {
    if (!isProductionBuild) return;

    let mounted = true;
    let offlineTimer: ReturnType<typeof setTimeout> | null = null;

    const clearOfflineTimer = () => {
      if (offlineTimer) {
        clearTimeout(offlineTimer);
        offlineTimer = null;
      }
    };

    const handleNetInfoState = (
      state: Awaited<ReturnType<typeof NetInfo.fetch>>,
    ) => {
      // ✅ Only use isConnected — isInternetReachable is unreliable
      // on proxy networks and during iOS biometric auth
      const definitelyOffline = state.isConnected === false;

      if (!definitelyOffline) {
        clearOfflineTimer();
        if (mounted) {
          hasEverConnected.current = true;
          setIsConnected(true);
        }
        return;
      }

      // ✅ If we've never had a connection, don't redirect to no-internet
      // This handles the case where NetInfo fires false before resolving
      if (!hasEverConnected.current) {
        console.log(
          "📡 [NetInfo] Offline detected but never connected — ignoring",
        );
        return;
      }

      clearOfflineTimer();

      // Debounce: only mark offline after 2s of sustained disconnection
      offlineTimer = setTimeout(async () => {
        try {
          const latest = await NetInfo.fetch();
          const stillOffline = latest.isConnected === false;

          if (mounted && stillOffline) {
            setIsConnected(false);
          }
        } catch {
          // Don't force offline on fetch error
        }
      }, 2000);
    };

    NetInfo.fetch()
      .then(handleNetInfoState)
      .catch(() => {
        // If initial fetch fails, assume connected
        if (mounted) {
          hasEverConnected.current = true;
          setIsConnected(true);
        }
      });

    const unsubscribe = NetInfo.addEventListener((state) => {
      handleNetInfoState(state);
    });

    return () => {
      mounted = false;
      clearOfflineTimer();
      unsubscribe();
    };
  }, []);

  // ───────────────────────────────────────────
  // Wait for auth resolution only — no internet gate
  // ───────────────────────────────────────────
  if (isLoading) {
    return <SplashRenderComponent />; // or splash screen
  }

  // ───────────────────────────────────────────
  // Internet Guard (Production Only)
  // ✅ Only redirect if we HAD a connection and lost it
  // Never redirect on first app launch
  // ───────────────────────────────────────────
  if (isProductionBuild && !isConnected && hasEverConnected.current) {
    return (
      <Redirect href="/(system)/no-internet?reason=startup&proxySuspected=true" />
    );
  }

  // ───────────────────────────────────────────
  // Auth Guard
  // ───────────────────────────────────────────
  const isAuthenticated = !!authState?.isAuthenticated;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // ───────────────────────────────────────────
  // App Navigation
  // ───────────────────────────────────────────
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="feedback" />
        <Stack.Screen name="otp-verification" />
        <Stack.Screen name="transaction-summary" />
        <Stack.Screen name="transaction-result" />
        <Stack.Screen name="transaction-biometric-confirm" />
        <Stack.Screen name="transaction-passcode-confirm" />
      </Stack>

      <InAppUpdateModal
        visible={showUpdateModal}
        onConfirm={onUpdateConfirm}
        onDismiss={onUpdateDismiss}
      />
    </>
  );
}
