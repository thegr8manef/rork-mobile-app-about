import { useCallback, useEffect, useMemo, useRef } from "react";
import {
  Alert,
  AppState,
  AppStateStatus,
  BackHandler,
  Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import RootDetection from "@kamarajcalm/react-native-root-detection";
import JailMonkey from "jail-monkey";
import { useTranslation } from "react-i18next";
import { getSecuritySignals } from "@/native/SecurityNative";

type RootedDetectionMethods = {
  rootBeer: {
    detectRootManagementApps: boolean;
    detectPotentiallyDangerousApps: boolean;
    checkForSuBinary: boolean;
    checkForDangerousProps: boolean;
    checkForRWPaths: boolean;
    detectTestKeys: boolean;
    checkSuExists: boolean;
    checkForRootNative: boolean;
    checkForMagiskBinary: boolean;
  };
  jailMonkey: boolean;
};

export type SecurityThreatType =
  | "EMULATOR"
  | "ROOTED"
  | "DEV_OPTIONS"
  | "DEBUGGER"
  | "HOOKING"
  | "UNKNOWN_ERROR";

export type SecurityThreat = {
  type: SecurityThreatType;
  reason: string;
  details?: any;
};

export interface UseSecurityGuardResult {
  performSecurityCheck: () => Promise<
    { ok: true } | { ok: false; threat: SecurityThreat }
  >;
}

export type UseSecurityGuardOptions = {
  enabled?: boolean;
  debug?: boolean;

  /**
   * "exit": show blocking alert then exit app
   * "block": call onThreat so you can logout / redirect to blocked screen
   */
  reaction?: "exit" | "block";

  /**
   * Called when a threat is detected (useful with reaction="block")
   */
  onThreat?: (threat: SecurityThreat) => void;

  /**
   * Run checks even in __DEV__ (default false)
   */
  enforceInDev?: boolean;

  /**
   * Re-run on app foreground (default true)
   */
  recheckOnActive?: boolean;
};

const isOptions = (v: unknown): v is UseSecurityGuardOptions =>
  !!v && typeof v === "object";

export const useSecurityGuard = (
  enabledOrOptions: boolean | UseSecurityGuardOptions = true
): UseSecurityGuardResult => {
  const { t } = useTranslation();

  const opts = useMemo<Required<UseSecurityGuardOptions>>(() => {
    const base: Required<UseSecurityGuardOptions> = {
      enabled: true,
      debug: false,
      reaction: "exit",
      onThreat: () => {},
      enforceInDev: false,
      recheckOnActive: true };

    if (typeof enabledOrOptions === "boolean") {
      return { ...base, enabled: enabledOrOptions };
    }

    if (isOptions(enabledOrOptions)) {
      return {
        ...base,
        ...enabledOrOptions,
        enabled: enabledOrOptions.enabled ?? true };
    }

    return base;
  }, [enabledOrOptions]);

  const { enabled, debug, reaction, onThreat, enforceInDev, recheckOnActive } =
    opts;

  // prevents double alert / double exit
  const blockedRef = useRef(false);

  // prevents concurrent runs
  const inFlightRef = useRef(false);

  // for debug grouping
  const runIdRef = useRef(0);

  const log = useCallback(
    (msg: string, extra?: any) => {
      if (!debug) return;
      if (extra !== undefined) console.log(`[SEC] ${msg}`, extra);
      else console.log(`[SEC] ${msg}`);
    },
    [debug]
  );

  const resetBlock = useCallback(() => {
    blockedRef.current = false;
  }, []);

  const reactToThreat = useCallback(
    (threat: SecurityThreat) => {
      log(`❌ THREAT: ${threat.type} — ${threat.reason}`, threat.details);

      if (reaction === "block") {
        onThreat(threat);
        return;
      }

      // reaction === "exit"
      if (blockedRef.current) return;
      blockedRef.current = true;

      const titleKey = "unsupported_device_title";

      const messageKey =
        threat.type === "EMULATOR"
          ? "unsupported_device_message_emulator"
          : threat.type === "DEV_OPTIONS"
          ? "unsupported_device_message_dev"
          : threat.type === "ROOTED"
          ? "unsupported_device_message_root"
          : threat.type === "DEBUGGER"
          ? "unsupported_device_message_debugger"
          : threat.type === "HOOKING"
          ? "unsupported_device_message_hooking"
          : "security_error_message";

      // Alert.alert(
      //   t(titleKey),
      //   t(messageKey),
      //   [{ text: t("common_ok"), onPress: () => BackHandler.exitApp() }],
      //   { cancelable: false }
      // );
    },
    [log, reaction, onThreat, t]
  );

  // ---------------------------
  // Individual checks
  // ---------------------------

  const checkEmulator =
    useCallback(async (): Promise<SecurityThreat | null> => {
      if (typeof (DeviceInfo as any).isEmulator !== "function") {
        log("isEmulator not available on native module, skipping");
        return null;
      }
      const isEmulator = await (DeviceInfo as any).isEmulator();
      log("Emulator check", { isEmulator });

      return isEmulator
        ? {
            type: "EMULATOR",
            reason: "DeviceInfo.isEmulator() returned true",
            details: { isEmulator } }
        : null;
    }, [log]);

  const checkRootDetectionLib =
    useCallback(async (): Promise<SecurityThreat | null> => {
      const rootedByLib = await RootDetection.isDeviceRooted();
      log("RootDetection.isDeviceRooted", { rootedByLib });

      return rootedByLib
        ? {
            type: "ROOTED",
            reason: "RootDetection.isDeviceRooted() returned true",
            details: { rootedByLib } }
        : null;
    }, [log]);

  const checkJailMonkey =
    useCallback(async (): Promise<SecurityThreat | null> => {
      const jmIsJailBroken = JailMonkey.isJailBroken?.() ?? false;

      log("JailMonkey high-level", { jmIsJailBroken });

      if (jmIsJailBroken) {
        return {
          type: "ROOTED",
          reason: "JailMonkey isJailBroken detected",
          details: { jmIsJailBroken } };
      }

      if (Platform.OS === "android") {
        const methods = (JailMonkey.androidRootedDetectionMethods ??
          null) as RootedDetectionMethods | null;

        if (methods) {
          const rootBeerHit = Object.values(methods.rootBeer).some(Boolean);
          const jailMonkeyHit = !!methods.jailMonkey;

          log("JailMonkey granular (Android)", {
            rootBeerHit,
            jailMonkeyHit,
            methods });

          if (rootBeerHit || jailMonkeyHit) {
            return {
              type: "ROOTED",
              reason: "Android rooted methods (RootBeer/JailMonkey) hit",
              details: { rootBeerHit, jailMonkeyHit, methods } };
          }
        } else {
          log("JailMonkey granular methods are null");
        }
      }

      return null;
    }, [log]);

  const checkDevOptions =
    useCallback(async (): Promise<SecurityThreat | null> => {
      if (Platform.OS !== "android") return null;

      const devOptions = await RootDetection.isDeveloperOptionsEnabled();
      log("Developer options", { devOptions });

      return devOptions
        ? {
            type: "DEV_OPTIONS",
            reason: "Developer options enabled",
            details: { devOptions } }
        : null;
    }, [log]);

  const checkNativeSignals =
    useCallback(async (): Promise<SecurityThreat | null> => {
      if (Platform.OS !== "android") return null;

      const s = await getSecuritySignals();

      if (s.emulator) {
        return { type: "EMULATOR", reason: "Emulator detected via Build fields", details: s };
      }
      if (s.debugger) {
        return { type: "DEBUGGER", reason: "Debugger detected", details: s };
      }
      if (s.instrumentation || s.hookFramework) {
        return {
          type: "HOOKING",
          reason: "Hooking/instrumentation detected",
          details: s };
      }

      return null;
    }, []);

  // ---------------------------
  // Main runner
  // ---------------------------

  const performSecurityCheck = useCallback(async () => {
    if (!enabled) return { ok: true as const };

    if (__DEV__ && !enforceInDev) {
      log("Skipped (DEV mode)");
      return { ok: true as const };
    }

    if (inFlightRef.current) {
      log("Skipped (already running)");
      return { ok: true as const };
    }

    inFlightRef.current = true;
    const runId = ++runIdRef.current;
    log(`🔍 Start security check (runId=${runId})`);

    try {
      const threat =
        (await checkNativeSignals()) ||
        (await checkEmulator()) ||
        (await checkRootDetectionLib()) ||
        (await checkJailMonkey());
        // (await checkDevOptions());

      if (threat) {
        reactToThreat(threat);
        return { ok: false as const, threat };
      }

      log(`✅ ALL SECURITY CHECKS PASSED (runId=${runId})`);
      return { ok: true as const };
    } catch (error) {
      const threat: SecurityThreat = {
        type: "UNKNOWN_ERROR",
        reason: error instanceof Error ? error.message : "Security check crashed",
        details: error instanceof Error
          ? { name: error.name, message: error.message, stack: error.stack }
          : error };

      reactToThreat(threat);
      return { ok: false as const, threat };
    } finally {
      inFlightRef.current = false;
    }
  }, [
    enabled,
    enforceInDev,
    log,
    checkEmulator,
    checkRootDetectionLib,
    checkJailMonkey,
    checkDevOptions,
    checkNativeSignals,
    reactToThreat,
  ]);

  useEffect(() => {
    if (!enabled) return;

    log("✅ useSecurityGuard mounted");
    performSecurityCheck();

    if (!recheckOnActive) return;

    const sub = AppState.addEventListener("change", (st: AppStateStatus) => {
      if (st === "active") {
        resetBlock();
        performSecurityCheck();
      }
    });

    return () => {
      sub.remove();
      log("🧹 useSecurityGuard unmounted");
    };
  }, [enabled, recheckOnActive, performSecurityCheck, resetBlock, log]);

  return { performSecurityCheck };
};