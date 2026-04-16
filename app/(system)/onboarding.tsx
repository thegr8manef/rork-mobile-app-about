import React, { useCallback, useRef } from "react";
import { router } from "expo-router";

import OnboardingStories from "@/components/OnboardingStories";
import { useAuth } from "@/hooks/auth-store";

export default function OnboardingScreen() {
  const { markOnboardingSeen, authState } = useAuth();

  // ✅ prevent double-complete (some story components can call onComplete twice)
  const completedRef = useRef(false);

  const handleComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;

    try {
      await markOnboardingSeen();

      /**
       * ✅ IMPORTANT:
       * Avoid router.replace("/") because "/" may re-trigger layout redirects
       * depending on your auth/onboarding guards.
       *
       * Go directly to the correct group:
       * - If authenticated => root tabs
       * - Else => auth login
       */
      if (authState.isAuthenticated) {
        router.replace("/(root)/(tabs)/(home)");
      } else {
        router.replace("/(auth)/login");
      }
    } catch (error) {
      completedRef.current = false; // allow retry
      console.warn("Failed to mark onboarding as seen:", error);
    }
  }, [markOnboardingSeen, authState.isAuthenticated]);

  return (
    <OnboardingStories onComplete={handleComplete} />
  );
}
