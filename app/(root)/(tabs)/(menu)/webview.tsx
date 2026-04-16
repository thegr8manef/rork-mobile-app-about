import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  BackHandler,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { WebView } from "react-native-webview";
import type { WebViewNavigation } from "react-native-webview/lib/WebViewTypes";
import { X, ChevronLeft, RefreshCw } from "lucide-react-native";
import { t } from "i18next";

import { BankingColors, FontSize, Spacing, FontFamily } from "@/constants";
import TText from "@/components/TText";

type Params = {
  url?: string;
  title?: string;
  loadingTextKey?: string;
  showHeader?: "0" | "1";
  closeBehavior?: "back" | "replace";
  redirectTo?: string;
  returnTo?: string;

  // backward compatibility
  windowName?: string;
  loadingKey?: string;
};

const WEBVIEW_TIMEOUT_MS = 20000; // increased from 12s — attijaribank.com.tn is slow

export default function GenericWebViewScreen() {
  const {
    url,
    title,
    loadingTextKey,
    showHeader,
    closeBehavior,
    redirectTo,
    returnTo,
    windowName,
    loadingKey,
  } = useLocalSearchParams<Params>();

  const webRef = useRef<WebView>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const safeUrl = useMemo(() => (url ?? "").trim(), [url]);
  const safeTitle = useMemo(
    () => (title ?? windowName ?? "").trim(),
    [title, windowName],
  );
  const safeLoadingKey = useMemo(
    () => (loadingTextKey ?? loadingKey ?? "common.loading").trim(),
    [loadingTextKey, loadingKey],
  );
  const safeRedirect = useMemo(() => (redirectTo ?? "").trim(), [redirectTo]);

  const shouldShowHeader = showHeader !== "0";

  const mode: "back" | "replace" = useMemo(() => {
    const v = (closeBehavior ?? "back") as "back" | "replace";
    return v === "replace" ? "replace" : "back";
  }, [closeBehavior]);

  const [canGoBack, setCanGoBack] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const clearLoadingTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const startLoadingTimeout = useCallback(() => {
    clearLoadingTimeout();
    timeoutRef.current = setTimeout(() => {
      setIsPageLoading(false);
      setHasError(true);
    }, WEBVIEW_TIMEOUT_MS);
  }, [clearLoadingTimeout]);

  const handleClose = useCallback(() => {
    if (mode === "replace" && safeRedirect) {
      router.replace(safeRedirect as any);
      return;
    }
    router.back();
  }, [mode, safeRedirect]);

  // Retry by remounting the WebView — clears the native error page completely
  const handleRetry = useCallback(() => {
    if (!safeUrl) return;
    setHasError(false);
    setIsPageLoading(true);
    setRetryKey((k) => k + 1);
    startLoadingTimeout();
  }, [safeUrl, startLoadingTimeout]);

  const handleBackPress = useCallback(() => {
    if (canGoBack && !hasError) {
      webRef.current?.goBack();
      return true;
    }

    handleClose();
    return true;
  }, [canGoBack, hasError, handleClose]);

  useEffect(() => {
    if (Platform.OS !== "android") return;

    const sub = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackPress,
    );

    return () => sub.remove();
  }, [handleBackPress]);

  useEffect(() => {
    if (!safeUrl) {
      handleClose();
    }
    // Do NOT start a timeout here — the WebView's onLoadStart/onLoadEnd/onError
    // callbacks handle loading state. Starting a timeout here races against
    // the WebView mount and can set hasError=true before the WebView even loads.
  }, [safeUrl, handleClose]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {shouldShowHeader && (
        <View style={styles.header}>
          <TouchableOpacity
            onPress={handleBackPress}
            activeOpacity={0.85}
            style={styles.headerBtn}
          >
            <ChevronLeft size={28} color={BankingColors.white} />
          </TouchableOpacity>

          <TText style={styles.headerTitle}>
            {safeTitle || t("common.browser")}
          </TText>

          <TouchableOpacity
            onPress={handleClose}
            activeOpacity={0.85}
            style={styles.headerBtn}
          >
            <X size={28} color={BankingColors.white} />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.content}>
        {!!safeUrl && !hasError && (
          <WebView
            key={retryKey}
            ref={webRef}
            source={{ uri: safeUrl }}
            style={styles.webview}
            onLoadStart={(event) => {
              console.log("[WebView] onLoadStart:", event.nativeEvent.url);
              setIsPageLoading(true);
              setHasError(false);
              startLoadingTimeout();
            }}
            onLoadEnd={(event) => {
              console.log(
                "[WebView] onLoadEnd:",
                event.nativeEvent.url,
                "| loading:",
                event.nativeEvent.loading,
              );
              clearLoadingTimeout();
              setIsPageLoading(false);
            }}
            onNavigationStateChange={(navState: WebViewNavigation) => {
              console.log(
                "[WebView] navState — url:",
                navState.url,
                "| status:",
                navState.loading ? "loading" : "done",
                "| canGoBack:",
                navState.canGoBack,
              );
              setCanGoBack(!!navState.canGoBack);
            }}
            onShouldStartLoadWithRequest={(request) => {
              console.log(
                "[WebView] onShouldStartLoadWithRequest:",
                request.url,
                "| navigationType:",
                request.navigationType,
              );
              return true;
            }}
            onError={(event) => {
              const { code, description, url } = event.nativeEvent;
              console.log(
                `[WebView] onError — code: ${code} | desc: ${description} | url: ${url}`,
              );
              clearLoadingTimeout();
              setHasError(true);
              setIsPageLoading(false);
            }}
            onHttpError={(event) => {
              const { statusCode, url } = event.nativeEvent;
              console.log(
                `[WebView] onHttpError — status: ${statusCode} | url: ${url}`,
              );
            }}
            onRenderProcessGone={(event) => {
              console.log(
                "[WebView] onRenderProcessGone — didCrash:",
                event.nativeEvent.didCrash,
              );
              setHasError(true);
              setIsPageLoading(false);
            }}
            cacheEnabled
            domStorageEnabled
            javaScriptEnabled
            setSupportMultipleWindows={false}
            allowsBackForwardNavigationGestures
            // Spoof a real browser UA — some servers block the default Android WebView agent
            userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            // Allow mixed HTTP/HTTPS content (some older banking sites need this)
            mixedContentMode="always"
          />
        )}

        {isPageLoading && !hasError && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={BankingColors.primary} />
            <TText style={styles.loadingText}>
              {t(safeLoadingKey) || "Chargement..."}
            </TText>
          </View>
        )}

        {hasError && (
          <View style={styles.errorContainer}>
            <TText style={styles.errorTitle}>{t("webview.errorTitle")}</TText>
            <TText style={styles.errorDescription}>
              {t("webview.errorDescription")}
            </TText>

            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.85}
              onPress={handleRetry}
            >
              <RefreshCw size={18} color={BankingColors.white} />
              <TText style={styles.primaryButtonText}>
                {t("webview.retry", "Réessayer")}
              </TText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              activeOpacity={0.85}
              onPress={handleClose}
            >
              <TText style={styles.secondaryButtonText}>
                {t("webview.close")}
              </TText>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },

  header: {
    paddingTop: Spacing.lg,
    height: 65,
    backgroundColor: BankingColors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },

  content: {
    flex: 1,
    position: "relative",
    backgroundColor: BankingColors.background,
  },

  webview: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.background,
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
  },

  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    backgroundColor: BankingColors.background,
  },
  errorTitle: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  errorDescription: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },

  primaryButton: {
    minWidth: 220,
    backgroundColor: BankingColors.primary,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },

  secondaryButton: {
    minWidth: 220,
    borderRadius: 14,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  secondaryButtonText: {
    color: BankingColors.text,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },
});
