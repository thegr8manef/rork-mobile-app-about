// constants/base-url.ts
// (keeps old export names, but values come from app.config.js -> extra)

import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, any>;

/**
 * ✅ URLs
 */
export const BASE_URL: string = extra.API_BASE_URL;


//export const BASE_URL = "https://www.attijariup.com.tn/v2";

/**z
 * ✅ Storage keys (old names preserved)
 */
export const AUTH_STORAGE_KEY: string = extra.AUTH_STORAGE_KEY ?? "auth_state";

export const BIOMETRIC_ENABLED_KEY: string = extra.BIOMETRIC_ENABLED_KEY;

export const SECURE_USERNAME_KEY: string = extra.SECURE_USERNAME_KEY;

export const SECURE_PASSWORD_KEY: string = extra.SECURE_PASSWORD_KEY;

export const SECURE_PASSCODE_KEY: string = extra.SECURE_PASSCODE_KEY;
export const SECURE_PENDING_USERNAME_KEY: string =
  extra.SECURE_PENDING_USERNAME_KEY;

export const SECURE_PENDING_PASSWORD_KEY: string =
  extra.SECURE_PENDING_PASSWORD_KEY;

export const PASSCODE_SALT_KEY: string = extra.PASSCODE_SALT_KEY;

export const PASSCODE_HASH_KEY: string = extra.PASSCODE_HASH_KEY;

export const SECURE_ACCESS_TOKEN_KEY: string = extra.SECURE_ACCESS_TOKEN_KEY;

export const SECURE_REFRESH_TOKEN_KEY: string = extra.SECURE_REFRESH_TOKEN_KEY;

/**
 * ✅ Other config
 * NOTE: router/eas are nested in app.config.js, so read them nested here.
 */
export const ROUTER_ORIGIN: string =
  extra.router?.origin ?? "https://www.attijariup.com.tn";

export const EAS_PROJECT_ID: string = extra.eas?.projectId ?? "";

export const ENV_BUILD_MARKER: string = extra.ENV_BUILD_MARKER ?? "";

export const BACKGROUND_TIMESTAMP_KEY: string =
  extra.ENV_BACKGROUND_TIMESTAMP_KEY ??
  "!!!MISSING_ENV_BACKGROUND_TIMESTAMP_KEY!!!";
export const BACKGROUND_LOGOUT_TIMEOUT_MS: number =
  Number(extra.ENV_BACKGROUND_LOGOUT_TIMEOUT_MS) ?? 60_000; // 55 seconds, giving a 5 second buffer from the 60 second timeout in auth-store.ts
