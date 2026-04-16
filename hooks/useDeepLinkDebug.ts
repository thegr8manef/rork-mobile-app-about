import { useEffect, useRef } from "react";
import * as Linking from "expo-linking";

type QueryParams = Record<string, string | string[]>;

type Options = {
  enabled?: boolean;
  ignoreDevClientInitial?: boolean;

  // Keep your original callback if you want:
  onUrl?: (url: string) => void;

  // ✅ New: easiest for routing
  onRoute?: (route: string, params: QueryParams, rawUrl: string) => void;
};

function isDevClientUrl(url: string) {
  return url.includes("expo-development-client/?url=");
}

/**
 * Normalize deep link URL into a route + query params.
 * Handles both:
 *  - attijariup://send-money      (hostname)
 *  - attijariup:///send-money     (path)
 */
function extractRoute(url: string): { route: string; params: QueryParams } {
  const parsed = Linking.parse(url);

  // Expo-linking sometimes returns null path for scheme://host style
  const raw = parsed.path ?? parsed.hostname ?? "";

  // Normalize:
  // - ensure leading slash removal
  // - remove accidental leading slashes
  const route = raw.replace(/^\/+/, "");

  const params = (parsed.queryParams ?? {}) as QueryParams;

  return { route, params };
}

function prettyLog(label: string, url: string | null) {
  if (!url) {
    console.log(`🔗 [DL:${label}] url=null`);
    return;
  }

  const parsed = Linking.parse(url);
  const { route, params } = extractRoute(url);

  console.log("══════════════════════════════════════");
  console.log(`🔗 [DL:${label}] ${url}`);
  console.log(`🧩 isDevClient=${isDevClientUrl(url)}`);
  console.log("🧭 parsed:", {
    scheme: parsed.scheme,
    hostname: parsed.hostname,
    path: parsed.path,
    queryParams: parsed.queryParams,
  });
  console.log("✅ normalized:", { route, params });
  console.log("══════════════════════════════════════");
}

export function useDeepLinkDebug(opts: Options = {}) {
  const enabled = opts.enabled ?? true;
  const ignoreDevClientInitial = opts.ignoreDevClientInitial ?? true;

  // keep latest callbacks without re-subscribing
  const onUrlRef = useRef<Options["onUrl"]>(opts.onUrl);
  onUrlRef.current = opts.onUrl;

  const onRouteRef = useRef<Options["onRoute"]>(opts.onRoute);
  onRouteRef.current = opts.onRoute;

  const lastUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const shouldIgnore = (url: string) =>
      ignoreDevClientInitial && isDevClientUrl(url);

    const handle = (source: "initial" | "event", url: string) => {
      if (lastUrlRef.current === url) {
        prettyLog(`${source}:deduped`, url);
        return;
      }
      lastUrlRef.current = url;

      prettyLog(source, url);

      if (shouldIgnore(url)) return;

      // keep old behavior
      onUrlRef.current?.(url);

      // ✅ new behavior: give normalized route + params
      const { route, params } = extractRoute(url);
      if (route) onRouteRef.current?.(route, params, url);
    };

    let mounted = true;

    Linking.getInitialURL().then((u) => {
      if (!mounted) return;

      prettyLog("getInitialURL", u);

      if (u) handle("initial", u);
    });

    const sub = Linking.addEventListener("url", ({ url }) => {
      handle("event", url);
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [enabled, ignoreDevClientInitial]);
}