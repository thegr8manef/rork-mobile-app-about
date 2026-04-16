import React, { PropsWithChildren, useEffect } from "react";
import { Platform, AppState, AppStateStatus } from "react-native";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import type { QueryClient } from "@tanstack/react-query";
import { focusManager, useQueryClient } from "@tanstack/react-query";
import * as Crypto from "expo-crypto";
import { useAppPreferencesStore } from "@/store/store";

import type {
  AuthState,
  LoginResponse,
  PreferredLoginMethod,
} from "@/types/auth.type";
import { getDeviceId, getDeviceMetaData } from "@/utils/device-info";
import {
  createDeviceChallengeApi,
  trustDeviceApi,
  verifyDeviceChallengeApi,
} from "@/services/auth.api";
import { generateKeyPair, signChallenge } from "@/native/SecureSignModule";
import * as Application from "expo-application";
import { registerLogoutHandler } from "@/services/lib/axios";

import {
  getAccessToken,
  setAccessToken,
  setRefreshToken,
  clearTokenCache,
  clearTokens,
} from "@/services/lib/getToken";
import { getFcmToken } from "@/notification/fcm";
import { patchFcmToken } from "@/services/account.api";

/**
 * ============================================================
 * STORAGE KEYS
 * ============================================================
 */

/**
 * ============================================================
 * QUICK LOGIN IDENTITY (persisted + encrypted via MMKV)
 * Used to decide if we can SKIP:
 * - device-confidence
 * - setup-passcode
 * - setup-biometric
 * after MFA on a trusted device
 * ============================================================
 */
export type QuickLoginIdentity = {
  username: string;
  deviceId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  trustedAt: string; // ISO
};

/**
 * ============================================================
 * DEFAULT STATE
 * ============================================================
 */
const DEFAULT_AUTH_STATE: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null, // never persisted

  biometricEnabled: false,

  hasSeenOnboarding: false,
  isFirstLaunch: false,

  hasPasscode: false,
  hasTrustedDevice: false,
  passkeyEnabled: false,

  // ✅ persisted display name for quick login
  quickLoginName: null,

  // ✅ NEW: device ownership (does the current account own the device trust?)
  isDeviceOwnedByCurrentUser: true,

  // ✅ NEW: preferred login method (how did the user last authenticate?)
  preferredLoginMethod: null,
};

type PasscodeLoginResult =
  | false
  | { status: "LOGIN_COMPLETE" }
  | { status: "MFA_REQUIRED"; transactionId: string }
  | { status: "SERVICE_UNAVAILABLE" };

type StoreState = {
  // Public shape
  authState: AuthState;
  isLoading: boolean;
  biometricType: string | null;
  deviceId: string | null;
  isBootstrapped: boolean;

  // ✅ persisted identity (encrypted mmkv)
  quickLoginIdentity: QuickLoginIdentity | null;
  setQuickLoginIdentity: (identity: QuickLoginIdentity | null) => Promise<void>;

  // internal
  queryClient: QueryClient | null;
  _didInit: boolean;

  // Init & wiring
  init: () => Promise<void>;
  setQueryClient: (qc: QueryClient) => void;

  // ✅ NEW: hydrate biometricEnabled from SecureStore (async)
  hydrateBiometricFlag: () => Promise<void>;

  // ✅ NEW: clear tokens from memory (for background security)
  clearTokensFromMemory: () => void;

  // API
  savePendingCredentials: (username: string, password: string) => Promise<void>;
  getPendingCredentials: () => Promise<{
    username: string;
    password: string;
  } | null>;
  clearPendingCredentials: () => Promise<void>;

  completeLogin: (
    accessToken: string,
    refreshToken: string,
    biometricEnabled: boolean,
  ) => Promise<void>;

  setDeviceTrusted: (trusted: boolean) => Promise<void>;
  savePasscode: (passcode: string) => Promise<boolean>;

  loginWithPasscode: (passcode: string) => Promise<PasscodeLoginResult>;
  loginWithBiometric: () => Promise<PasscodeLoginResult>;

  enableBiometric: (enabled: boolean) => Promise<boolean>;

  // ✅ passkey preference toggle
  enablePasskey: (enabled: boolean) => Promise<boolean>;

  markOnboardingSeen: () => Promise<void>;

  performLogout: () => Promise<void>;
  useLogout: () => () => Promise<void>;

  testPasskeyOnce: (requireBiometric: boolean) => Promise<LoginResponse>;
  setupPasskey: () => Promise<boolean>;

  // ✅ set quick login display name
  setQuickLoginName: (name: string | null) => Promise<void>;

  // ✅ NEW: set device ownership flag
  setDeviceOwnership: (owned: boolean) => Promise<void>;

  // ✅ NEW: set preferred login method
  setPreferredLoginMethod: (method: PreferredLoginMethod) => Promise<void>;
};

/**
 * ============================================================
 * ✅ ENCRYPTED MMKV ZUSTAND ADAPTER
 * NOTE: We store only NON-SECRETS in MMKV (flags), no tokens/passwords.
 * ============================================================
 */
import MMKVStorage from "react-native-mmkv-storage";
import {
  AUTH_STORAGE_KEY,
  BACKGROUND_TIMESTAMP_KEY,
  BIOMETRIC_ENABLED_KEY,
  PASSCODE_HASH_KEY,
  PASSCODE_SALT_KEY,
  SECURE_PASSCODE_KEY,
  SECURE_PENDING_PASSWORD_KEY,
  SECURE_PENDING_USERNAME_KEY,
} from "@/constants/base-url";

const MMKV = new MMKVStorage.Loader().withEncryption().initialize();
const BACKGROUND_LOGOUT_TIMEOUT_MS = 60_000;
const mmkvZustandStorage = {
  getItem: async (name: string) => {
    const value = await MMKV.getStringAsync(name);
    return value ?? null;
  },
  setItem: async (name: string, value: string) => {
    await MMKV.setStringAsync(name, value);
  },
  removeItem: async (name: string) => {
    await MMKV.removeItem(name);
  },
};

/**
 * ============================================================
 * PASSCODE HELPERS
 * ============================================================
 */
async function getOrCreateSalt(): Promise<string | null> {
  if (Platform.OS === "web") return null;

  let salt = await SecureStore.getItemAsync(PASSCODE_SALT_KEY);
  if (!salt) {
    salt = Crypto.randomUUID();
    await SecureStore.setItemAsync(PASSCODE_SALT_KEY, salt);
  }
  return salt;
}

async function hashPasscode(passcode: string, salt: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${salt}:${passcode}`,
  );
}

/**
 * ============================================================
 * ✅ BACKGROUND TIMESTAMP (MMKV-based)
 * setTimeout is unreliable when iOS/Android suspend JS in background.
 * Instead we persist the timestamp when the app went to background,
 * then check elapsed time when the app comes back to foreground.
 * ============================================================
 */

function saveBackgroundTimestamp() {
  MMKV.setStringAsync(BACKGROUND_TIMESTAMP_KEY, String(Date.now()));
  console.log("⏱️ [auth-store] Background timestamp SAVED to MMKV");
}

function clearBackgroundTimestamp() {
  MMKV.removeItem(BACKGROUND_TIMESTAMP_KEY);
  console.log("⏱️ [auth-store] Background timestamp CLEARED from MMKV");
}

async function getBackgroundElapsedMs(): Promise<number | null> {
  const raw = await MMKV.getStringAsync(BACKGROUND_TIMESTAMP_KEY);
  if (!raw) return null;
  const ts = parseInt(raw, 10);
  if (isNaN(ts)) return null;
  return Date.now() - ts;
}

/**
 * ============================================================
 * STORE
 * ============================================================
 */
const useAuthStore = create<StoreState>()(
  persist(
    (set, get) => ({
      authState: DEFAULT_AUTH_STATE,
      isLoading: true,
      biometricType: null,
      deviceId: null,
      isBootstrapped: false,

      // ✅ persisted identity
      quickLoginIdentity: null,

      queryClient: null,
      _didInit: false,

      setQueryClient: (qc) => set({ queryClient: qc }),

      /**
       * ============================================================
       * ✅ setQuickLoginIdentity
       * - persists identity (mmkv)
       * - also updates quickLoginName for existing UI quick login
       * ============================================================
       */
      setQuickLoginIdentity: async (identity) => {
        const isOwned = get().authState.isDeviceOwnedByCurrentUser;

        // ✅ If device is not owned by current user, don't save anything
        if (!isOwned) return;

        set((s) => ({
          quickLoginIdentity: identity ?? null,
          authState: {
            ...s.authState,
            quickLoginName: identity?.fullName ?? s.authState.quickLoginName,
          },
        }));
      },

      /**
       * ============================================================
       * ✅ hydrateBiometricFlag (from SecureStore)
       * ============================================================
       */
      hydrateBiometricFlag: async () => {
        if (Platform.OS === "web") return;

        try {
          const v = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
          const enabled = v === "1";
          set((s) => ({
            authState: { ...s.authState, biometricEnabled: enabled },
          }));
        } catch (e) {
          console.log("❌ [auth-store] hydrateBiometricFlag failed:", e);
        }
      },

      /**
       * ============================================================
       * ✅ NEW: clearTokensFromMemory
       * Clears accessToken from state (for background security)
       * Does NOT log out - tokens remain in SecureStore
       * ============================================================
       */
      clearTokensFromMemory: () => {
        set((s) => ({
          authState: {
            ...s.authState,
            accessToken: null,
          },
        }));
        clearTokenCache();
        console.log("🧹 [auth-store] Tokens cleared from memory");
      },

      /**
       * ============================================================
       * init
       * ============================================================
       */
      init: async () => {
        if (get()._didInit) return;
        set({ _didInit: true });

        // ✅ Wait for zustand-persist hydration to finish before checking
        // isAuthenticated. Otherwise this races with the async MMKV read:
        // sometimes we'd see the default (false) state, skip the logout,
        // and then rehydration would inject a stale isAuthenticated=true
        // a few ms later — leaving the app in an inconsistent state.
        try {
          if (!useAuthStore.persist.hasHydrated()) {
            await new Promise<void>((resolve) => {
              const unsub = useAuthStore.persist.onFinishHydration(() => {
                unsub();
                resolve();
              });
            });
          }
        } catch (e) {
          console.log("⚠️ [auth-store] hydration wait failed:", e);
        }

        // ✅ Force logout on fresh app start (app was killed)
        if (get().authState.isAuthenticated) {
          console.log("📱 [auth-store] App was killed - logging out");
          await get().performLogout();
        }

        // ✅ Mark store usable immediately
        set({ isBootstrapped: true, isLoading: false });

        // ✅ Background tasks (DO NOT block UI)
        (async () => {
          try {
            // 0) hydrate biometric flag (async safe)
            await get().hydrateBiometricFlag();

            // 1) DeviceId
            const id = await getDeviceId();
            set({ deviceId: id });

            // 2) Biometrics detection
            if (Platform.OS !== "web") {
              const hasHardware = await LocalAuthentication.hasHardwareAsync();
              const enrolled = await LocalAuthentication.isEnrolledAsync();

              if (hasHardware && enrolled) {
                const types =
                  await LocalAuthentication.supportedAuthenticationTypesAsync();

                if (
                  types.includes(
                    LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION,
                  )
                ) {
                  set({ biometricType: "faceId" });
                } else if (
                  types.includes(
                    LocalAuthentication.AuthenticationType.FINGERPRINT,
                  )
                ) {
                  set({ biometricType: "touchId" });
                } else {
                  set({ biometricType: null });
                }
              } else {
                set({ biometricType: null });
              }
            }

            // DEV ONLY: restore token into memory
            if (__DEV__ && Platform.OS !== "web") {
              try {
                const token = await getAccessToken();
                if (token) {
                  set((s) => ({
                    authState: { ...s.authState, accessToken: token },
                  }));
                }
              } catch (e) {
                console.log("DEV token restore failed:", e);
              }
            }
          } catch (e) {
            console.log("init background error:", e);
          }
        })();
      },

      /**
       * ============================================================
       * Pending credentials
       * ============================================================
       */
      savePendingCredentials: async (username, password) => {
        if (Platform.OS === "web") return;
        await SecureStore.setItemAsync(SECURE_PENDING_USERNAME_KEY, username);
        await SecureStore.setItemAsync(SECURE_PENDING_PASSWORD_KEY, password);
      },

      getPendingCredentials: async () => {
        if (Platform.OS === "web") return null;

        const u = await SecureStore.getItemAsync(SECURE_PENDING_USERNAME_KEY);
        const p = await SecureStore.getItemAsync(SECURE_PENDING_PASSWORD_KEY);
        if (!u) return null;

        return { username: u, password: p ?? "" };
      },

      clearPendingCredentials: async () => {
        if (Platform.OS === "web") return;

        // ✅ keep username, delete ONLY password
        await SecureStore.deleteItemAsync(SECURE_PENDING_PASSWORD_KEY);
      },

      setQuickLoginName: async (name) => {
        const isOwned = get().authState.isDeviceOwnedByCurrentUser;
        if (!isOwned) return;

        set((s) => ({
          authState: { ...s.authState, quickLoginName: name ?? null },
        }));
      },

      /**
       * ============================================================
       * ✅ NEW: setDeviceOwnership
       * Sets whether the device trust belongs to the current user
       * ============================================================
       */
      setDeviceOwnership: async (owned) => {
        set((s) => ({
          authState: { ...s.authState, isDeviceOwnedByCurrentUser: owned },
        }));
      },

      /**
       * ============================================================
       * ✅ NEW: setPreferredLoginMethod
       * Tracks how the user authenticated (biometric, passcode, otp)
       * ============================================================
       */
      setPreferredLoginMethod: async (method) => {
        set((s) => ({
          authState: { ...s.authState, preferredLoginMethod: method },
        }));
      },

      completeLogin: async (accessToken, refreshToken, biometricEnabled) => {
        // ✅ Write tokens to SecureStore + in-memory cache BEFORE flipping
        // isAuthenticated. Otherwise React re-renders, useProfile fires, the
        // axios interceptor reads a null token cache → 401 → logoutHandler →
        // performLogout → bounce back to /login.
        if (Platform.OS !== "web") {
          await setAccessToken(accessToken);
          await setRefreshToken(refreshToken);
          await get().clearPendingCredentials();
        }

        set((s) => ({
          authState: {
            ...s.authState,
            isAuthenticated: true,
            user: null,
            accessToken,
            biometricEnabled: s.authState.isDeviceOwnedByCurrentUser
              ? biometricEnabled
              : s.authState.biometricEnabled,
          },
        }));

        // ✅ Track login count for store review
        useAppPreferencesStore.getState().incrementLoginCount();
        console.log("===================================================");
        console.log(
          "🔢 [auth-store] Login count for review in app store and play store:",
          useAppPreferencesStore.getState().loginCount,
        );
        console.log("===================================================");
      },

      /**
       * ============================================================
       * setDeviceTrusted
       * ✅ IMPORTANT FIX: trusting device means passkey exists => enable passkey
       * ============================================================
       */
      setDeviceTrusted: async (trusted) => {
        set((s) => ({
          authState: {
            ...s.authState,
            hasTrustedDevice: trusted,
            // ✅ if we trust the device, passkey is configured, so allow using it
            // passkeyEnabled: trusted ? true : s.authState.passkeyEnabled,
            hasPasscode: trusted ? s.authState.hasPasscode : false,
          },
        }));
      },

      /**
       * ============================================================
       * enablePasskey (preference only)
       * ============================================================
       */
      enablePasskey: async (enabled) => {
        set((s) => ({
          authState: { ...s.authState, passkeyEnabled: enabled },
        }));
        return true;
      },

      /**
       * ============================================================
       * savePasscode (SECURE)
       * ============================================================
       */
      savePasscode: async (passcode) => {
        if (Platform.OS === "web") return false;

        const salt = await getOrCreateSalt();
        if (!salt) return false;

        const passHash = await hashPasscode(passcode, salt);
        await SecureStore.setItemAsync(PASSCODE_HASH_KEY, passHash);

        // cleanup legacy cleartext passcode (if any)
        await SecureStore.deleteItemAsync(SECURE_PASSCODE_KEY);

        set((s) => ({
          authState: { ...s.authState, hasPasscode: true },
        }));

        return true;
      },

      /**
       * ============================================================
       * loginWithPasscode
       * ✅ UPDATED: sets preferredLoginMethod = 'passcode' on success
       * ============================================================
       */
      loginWithPasscode: async (passcode) => {
        try {
          if (Platform.OS === "web") return false;

          const { deviceId } = get();
          if (!deviceId) return false;

          const salt = await SecureStore.getItemAsync(PASSCODE_SALT_KEY);
          const storedHash = await SecureStore.getItemAsync(PASSCODE_HASH_KEY);

          if (salt && storedHash) {
            const inputHash = await hashPasscode(passcode, salt);
            if (inputHash !== storedHash) return false;
          } else {
            const legacy = await SecureStore.getItemAsync(SECURE_PASSCODE_KEY);
            if (!legacy || legacy !== passcode) return false;

            const newSalt = (await getOrCreateSalt())!;
            const newHash = await hashPasscode(passcode, newSalt);
            await SecureStore.setItemAsync(PASSCODE_HASH_KEY, newHash);
            await SecureStore.deleteItemAsync(SECURE_PASSCODE_KEY);

            set((s) => ({
              authState: { ...s.authState, hasPasscode: true },
            }));
          }

          // backend flow (unchanged)
          const challenge = await createDeviceChallengeApi(deviceId);

          const proof = await signChallenge(
            challenge.challengeId,
            challenge.challenge,
            deviceId,
            { requireBiometric: false },
          );

          const res = await verifyDeviceChallengeApi(
            deviceId,
            challenge.challengeId,
            proof,
          );

          if (res.loginStatus === "LOGIN_COMPLETE") {
            const biometricEnabled = get().authState.biometricEnabled;
            await get().completeLogin(
              res.token.accessToken,
              res.token.refreshToken,
              biometricEnabled,
            );

            // ✅ Send FCM token to backend
            try {
              const fcmToken = await getFcmToken();
              if (fcmToken) {
                patchFcmToken(fcmToken)
                  .then(() => console.log("✅ [FCM] Token sent to backend"))
                  .catch((e: any) =>
                    console.log("❌ [FCM] Failed to send token:", e),
                  );
              }
            } catch (e) {
              console.log("⚠️ [FCM] getFcmToken failed:", e);
            }

            // ✅ NEW: set preferred login method + device ownership
            set((s) => ({
              authState: {
                ...s.authState,
                preferredLoginMethod: "passcode",
                isDeviceOwnedByCurrentUser: true, // passcode login = this account owns the trust
              },
            }));

            return { status: "LOGIN_COMPLETE" };
          }

          if (res.loginStatus === "MFA_REQUIRED") {
            return { status: "MFA_REQUIRED", transactionId: res.requestId };
          }

          return false;
        } catch (err) {
          console.log("❌ loginWithPasscode failed:", err);
          return { status: "SERVICE_UNAVAILABLE" };
        }
      },

      testPasskeyOnce: async (requireBiometric: boolean) => {
        if (Platform.OS === "web") throw new Error("WEB_UNSUPPORTED");

        const { deviceId } = get();
        if (!deviceId) throw new Error("DEVICE_ID_MISSING");

        const challenge = await createDeviceChallengeApi(deviceId);

        const proof = await signChallenge(
          challenge.challengeId,
          challenge.challenge,
          deviceId,
          { requireBiometric },
        );

        const res = await verifyDeviceChallengeApi(
          deviceId,
          challenge.challengeId,
          proof,
        );

        return res;
      },

      /**
       * ============================================================
       * setupPasskey (trust device)
       * ============================================================
       */
      setupPasskey: async () => {
        if (Platform.OS === "web") return false;

        const { deviceId } = get();
        if (!deviceId) throw new Error("DEVICE_ID_MISSING");

        const base64PublicKey = await generateKeyPair(deviceId);

        console.log("========== DEBUG setupPasskey PUBLIC KEY ==========");
        console.log("APP PACKAGE:", Application.applicationId);
        console.log("DEVICE ID:", deviceId);
        console.log("PUBLIC KEY:", base64PublicKey);
        console.log("====================================================");

        const meta = await getDeviceMetaData();

        await trustDeviceApi(deviceId, base64PublicKey, meta);

        // ✅ configured + enable by default
        set((s) => ({
          authState: {
            ...s.authState,
            hasTrustedDevice: true,
            passkeyEnabled: true,
          },
        }));

        return true;
      },

      /**
       * ============================================================
       * loginWithBiometric
       * ✅ UPDATED: sets preferredLoginMethod = 'biometric' on success
       * ============================================================
       */
      loginWithBiometric: async () => {
        if (Platform.OS === "web") return false;

        const { deviceId } = get();
        if (!deviceId) return false;

        try {
          const s = get().authState;

          if (!s.hasTrustedDevice) return false;
          if (!s.biometricEnabled) return false;
          // if (!s.passkeyEnabled) return false;

          const challenge = await createDeviceChallengeApi(deviceId);

          const proof = await signChallenge(
            challenge.challengeId,
            challenge.challenge,
            deviceId,
            { requireBiometric: true },
          );

          const res = await verifyDeviceChallengeApi(
            deviceId,
            challenge.challengeId,
            proof,
          );

          if (res.loginStatus === "LOGIN_COMPLETE") {
            const biometricEnabled = get().authState.biometricEnabled;
            await get().completeLogin(
              res.token.accessToken,
              res.token.refreshToken,
              biometricEnabled,
            );

            // ✅ Send FCM token to backend
            try {
              const fcmToken = await getFcmToken();
              if (fcmToken) {
                patchFcmToken(fcmToken)
                  .then(() => console.log("✅ [FCM] Token sent to backend"))
                  .catch((e: any) =>
                    console.log("❌ [FCM] Failed to send token:", e),
                  );
              }
            } catch (e) {
              console.log("⚠️ [FCM] getFcmToken failed:", e);
            }

            // ✅ NEW: set preferred login method + device ownership
            set((s) => ({
              authState: {
                ...s.authState,
                preferredLoginMethod: "biometric",
                isDeviceOwnedByCurrentUser: true, // biometric login = this account owns the trust
              },
            }));

            return { status: "LOGIN_COMPLETE" };
          }

          if (res.loginStatus === "MFA_REQUIRED") {
            return { status: "MFA_REQUIRED", transactionId: res.requestId };
          }

          return false;
        } catch (err) {
          console.log("❌ loginWithBiometric failed:", err);
          return { status: "SERVICE_UNAVAILABLE" };
        }
      },

      /**
       * ============================================================
       * enableBiometric (persist in SecureStore + state)
       * ============================================================
       */
      enableBiometric: async (enabled: boolean) => {
        try {
          if (Platform.OS === "web") return false;

          await SecureStore.setItemAsync(
            BIOMETRIC_ENABLED_KEY,
            enabled ? "1" : "0",
          );

          set((s) => ({
            authState: { ...s.authState, biometricEnabled: enabled },
          }));

          return true;
        } catch (e) {
          console.log("❌ [auth-store] enableBiometric failed:", e);
          return false;
        }
      },

      markOnboardingSeen: async () => {
        set((s) => ({
          authState: {
            ...s.authState,
            hasSeenOnboarding: true,
            isFirstLaunch: false,
          },
        }));
      },

      /**
       * ============================================================
       * performLogout
       * ✅ IMPORTANT: do NOT clear quick login identity/name here
       * ✅ UPDATED: reset preferredLoginMethod + isDeviceOwnedByCurrentUser on logout
       * ============================================================
       */
      performLogout: async () => {
        set((s) => ({
          isLoading: false,
          isBootstrapped: true,
          authState: {
            ...s.authState,
            isAuthenticated: false,
            accessToken: null,
            // ✅ reset session-specific state on logout
            preferredLoginMethod: null,
            // ✅ Reset ownership to true on logout — the device is still trusted
            // for whoever logs in next. navigateAfterLogin will set it to false
            // if the next login is a different account (isDeviceUsedByAnotherAccount).
            isDeviceOwnedByCurrentUser: true,
          },
        }));

        if (Platform.OS !== "web") {
          await clearTokens();
          await SecureStore.deleteItemAsync(SECURE_PENDING_PASSWORD_KEY);
        }

        clearTokenCache();
        get().queryClient?.removeQueries();
        get().queryClient?.clear();
      },

      useLogout: () => {
        return async () => {
          await get().performLogout();
        };
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => mmkvZustandStorage),

      // ✅ persist only safe fields (include new fields)
      partialize: (state) => ({
        authState: {
          ...DEFAULT_AUTH_STATE,

          isAuthenticated: state.authState.isAuthenticated,
          biometricEnabled: state.authState.biometricEnabled,
          hasSeenOnboarding: state.authState.hasSeenOnboarding,
          isFirstLaunch: state.authState.isFirstLaunch,
          hasPasscode: state.authState.hasPasscode,
          hasTrustedDevice: state.authState.hasTrustedDevice,
          passkeyEnabled: state.authState.passkeyEnabled,

          // ✅ persisted quick login display name
          quickLoginName: state.authState.quickLoginName ?? null,

          // ✅ NEW: persist these so they survive app restart within same session
          isDeviceOwnedByCurrentUser:
            state.authState.isDeviceOwnedByCurrentUser ?? true,
          preferredLoginMethod: state.authState.preferredLoginMethod ?? null,

          accessToken: null,
          user: null,
        },
        // ✅ persisted quick identity (encrypted mmkv)
        quickLoginIdentity: state.quickLoginIdentity ?? null,
      }),

      onRehydrateStorage: () => (state) => {
        if (!state) return;

        if (!state.authState) {
          state.authState = {
            ...DEFAULT_AUTH_STATE,
            isFirstLaunch: true,
            hasSeenOnboarding: false,
          };
        }

        // Safety: never keep token after rehydrate
        state.authState.accessToken = null;

        // ✅ ensure new keys exist even for old stored state
        if (typeof state.authState.passkeyEnabled !== "boolean") {
          state.authState.passkeyEnabled = false;
        }
        if (typeof state.authState.biometricEnabled !== "boolean") {
          state.authState.biometricEnabled = false;
        }
        if (typeof state.authState.quickLoginName !== "string") {
          state.authState.quickLoginName =
            state.authState.quickLoginName ?? null;
        }

        // ✅ NEW: ensure new fields exist for old stored state
        if (typeof state.authState.isDeviceOwnedByCurrentUser !== "boolean") {
          state.authState.isDeviceOwnedByCurrentUser = true;
        }
        if (!state.authState.preferredLoginMethod) {
          state.authState.preferredLoginMethod = null;
        }

        if (!("quickLoginIdentity" in state)) {
          (state as any).quickLoginIdentity = null;
        }
      },
    },
  ),
);

/**
 * ============================================================
 * EXPORTS
 * ============================================================
 */
export const useAuth = () => useAuthStore((s) => s);

export function AuthProvider({ children }: PropsWithChildren) {
  const qc = useQueryClient();

  useEffect(() => {
    // ✅ GLOBAL guard (survives Fast Refresh / re-mount)
    const g = globalThis as any;
    if (!g.__ATTIJARI_AUTH_PROVIDER_INIT__) {
      g.__ATTIJARI_AUTH_PROVIDER_INIT__ = true;

      // init store once
      useAuthStore.getState().init();

      // register logout handler ONCE
      registerLogoutHandler(async () => {
        await useAuthStore.getState().performLogout();
      });
    }

    // ✅ if you want the store to be able to clear qc, keep this:
    useAuthStore.getState().setQueryClient(qc);
  }, [qc]);

  // ✅ AppState listener — uses MMKV timestamp (survives JS suspension in background)
  useEffect(() => {
    console.log("🔧 [auth-store] Registering AppState listener");

    const subscription = AppState.addEventListener(
      "change",
      (nextAppState: AppStateStatus) => {
        console.log(
          `📱 [auth-store] ===== AppState changed => "${nextAppState}" =====`,
        );
        const store = useAuthStore.getState();
        console.log(
          "📱 [auth-store] isAuthenticated:",
          store.authState.isAuthenticated,
        );
        console.log(
          "📱 [auth-store] hasAccessToken:",
          !!store.authState.accessToken,
        );

        focusManager.setFocused(nextAppState === "active");

        // ✅ On background: clear tokens from memory + save timestamp
        if (nextAppState === "background") {
          if (store.authState.isAuthenticated) {
            console.log(
              "📱 [auth-store] App went to BACKGROUND — clearing tokens + saving timestamp",
            );
            store.clearTokensFromMemory();
            saveBackgroundTimestamp();
          } else {
            console.log(
              "📱 [auth-store] App went to BACKGROUND but not authenticated — skipping",
            );
          }
        }

        if (nextAppState === "inactive") {
          console.log(
            "📱 [auth-store] App INACTIVE (transitioning) — no action taken",
          );
        }

        // ✅ On foreground: check elapsed time from MMKV timestamp
        if (nextAppState === "active") {
          console.log(
            "📱 [auth-store] App became ACTIVE — checking background duration",
          );

          (async () => {
            try {
              const elapsed = await getBackgroundElapsedMs();
              console.log("📱 [auth-store] Background elapsed ms:", elapsed);

              // Always clear the timestamp once we've read it
              clearBackgroundTimestamp();

              const freshStore = useAuthStore.getState();

              // ✅ If elapsed > 15s and still authenticated → logout
              if (
                elapsed !== null &&
                elapsed >= BACKGROUND_LOGOUT_TIMEOUT_MS &&
                freshStore.authState.isAuthenticated
              ) {
                console.log(
                  `⏱️ [auth-store] ${Math.round(elapsed / 1000)}s elapsed (>15s) — performing logout`,
                );
                await freshStore.performLogout();
                console.log(
                  "✅ [auth-store] Logout completed after background timeout",
                );
                return; // don't restore token, we just logged out
              }

              // ✅ If within timeout and authenticated but no token → restore
              if (
                freshStore.authState.isAuthenticated &&
                !freshStore.authState.accessToken
              ) {
                console.log(
                  "📱 [auth-store] Authenticated but no token — restoring from SecureStore",
                );
                const token = await getAccessToken();
                console.log(
                  "📱 [auth-store] getAccessToken result:",
                  token ? "found" : "null",
                );
                if (token) {
                  const currentState = useAuthStore.getState();
                  useAuthStore.setState({
                    authState: {
                      ...currentState.authState,
                      accessToken: token,
                    },
                  });
                  console.log(
                    "✅ [auth-store] Token restored from SecureStore successfully",
                  );
                } else {
                  console.log(
                    "⚠️ [auth-store] No token in SecureStore — user may need to re-login",
                  );
                }
              } else if (!freshStore.authState.isAuthenticated) {
                console.log(
                  "📱 [auth-store] App active but not authenticated — nothing to restore",
                );
              } else {
                console.log(
                  "📱 [auth-store] App active — token already in memory, no restore needed",
                );
              }
            } catch (e) {
              console.log("❌ [auth-store] Error in foreground check:", e);
            }
          })();
        }
      },
    );

    return () => {
      console.log("🧹 [auth-store] AppState listener UNMOUNTING");
      subscription.remove();
    };
  }, []);

  return React.createElement(React.Fragment, null, children);
}

export default AuthProvider;
