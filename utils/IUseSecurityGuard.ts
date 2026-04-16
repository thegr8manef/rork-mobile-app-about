import { useEffect, useMemo } from "react";
import { Platform } from "react-native";
import * as ScreenCapture from "expo-screen-capture";
import { usePathname, useSegments } from "expo-router";

type Options = {
  enabled?: boolean;
  key?: string;
  debug?: boolean;
  blockExact?: string[];
  blockPrefixes?: string[];
  blockIfSegmentIncludes?: string[];
};

export function usePreventScreenCaptureByRoute({
  enabled = true,
  key = "route-guard",
  debug = false,
  blockExact = [],
  blockPrefixes = [],
  blockIfSegmentIncludes = [] }: Options = {}) {
  const pathname = usePathname();

  // ✅ FIX HERE
  const segments = useSegments() as unknown as string[];

  const shouldBlock = useMemo(() => {
    if (!enabled) return false;

    if (blockExact.includes(pathname)) return true;
    if (blockPrefixes.some((p) => pathname.startsWith(p))) return true;

    if (blockIfSegmentIncludes.some((s) => segments.includes(s))) return true;

    return false;
  }, [enabled, pathname, segments, blockExact, blockPrefixes, blockIfSegmentIncludes]);

  useEffect(() => {
    if (Platform.OS === "web") return;

    if (debug) {
      console.log("[SC] pathname:", pathname);
      console.log("[SC] segments:", segments);
      // console.log("[SC] shouldBlock:", shouldBlock);
    }

    (async () => {
      try {
        if (shouldBlock) await ScreenCapture.preventScreenCaptureAsync(key);
        else await ScreenCapture.allowScreenCaptureAsync(key);
      } catch {}
    })();

    return () => {
      ScreenCapture.allowScreenCaptureAsync(key).catch(() => {});
    };
  }, [shouldBlock, key, pathname, segments, debug]);

  return { shouldBlock, pathname, segments };
}
