// hooks/useStoreReview.ts
import { useEffect } from "react";
import * as StoreReview from "expo-store-review";
import { useAppPreferencesStore } from "@/store/store";
import { isProductionBuild } from "@/utils/buildConfig";

// ✅ Show review prompt at these login milestones only
const REVIEW_MILESTONES = [3, 20, 50];

/**
 * Triggers the native in-app review prompt at specific login milestones.
 * Only runs in production builds.
 *
 * - Login #3  → 1st prompt (new user, early impression)
 * - Login #20 → 2nd prompt (regular user)
 * - Login #50 → 3rd prompt (loyal user, most likely to review)
 * - After that → never again
 *
 * Usage: call useStoreReview() in HomeScreen
 */
export function useStoreReview() {
  const loginCount = useAppPreferencesStore((s) => s.loginCount);
  const reviewPromptCount = useAppPreferencesStore(
    (s) => s.reviewPromptCount,
  );
  const incrementReviewPromptCount = useAppPreferencesStore(
    (s) => s.incrementReviewPromptCount,
  );
  const setLastReviewPromptLoginCount = useAppPreferencesStore(
    (s) => s.setLastReviewPromptLoginCount,
  );

  useEffect(() => {
    // TODO: re-enable when ready
    return;
    // ✅ Only run in production
    if (!isProductionBuild) return;
    // All milestones exhausted
    if (reviewPromptCount >= REVIEW_MILESTONES.length) return;

    // Current milestone to hit
    const nextMilestone = REVIEW_MILESTONES[reviewPromptCount];
    if (loginCount < nextMilestone) return;

    const requestReview = async () => {
      try {
        const hasAction = await StoreReview.hasAction();
        if (!hasAction) return;

        // Wait 2s after HomeScreen loads — feels natural
        await new Promise((r) => setTimeout(r, 2000));

        await StoreReview.requestReview();

        // Mark this milestone as done
        incrementReviewPromptCount();
        setLastReviewPromptLoginCount(loginCount);
      } catch (e) {
        console.log("StoreReview error:", e);
      }
    };

    requestReview();
  }, [
    loginCount,
    reviewPromptCount,
    incrementReviewPromptCount,
    setLastReviewPromptLoginCount,
  ]);
}