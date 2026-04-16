// services/lib/axios.ts
import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { BASE_URL } from "@/constants/base-url";
import { getAccessToken, clearTokenCache } from "@/services/lib/getToken";
import DeviceInfo from "react-native-device-info";
import { syncServerTime } from "@/utils/serverTime";

let logoutHandler: (() => Promise<void> | void) | null = null;

/**
 * Register a logout handler from your AuthProvider / auth-store.
 */
export const registerLogoutHandler = (fn: () => Promise<void> | void) => {
  logoutHandler = fn;
};

let logoutInProgress = false;

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
});

// Optional: endpoints where we don't want to attach token or trigger logout loop
const AUTH_WHITELIST = [
  "/auth/login",
  "/auth/refresh",
  "/auth/device/challenge",
  "/auth/device/verify",
  "/auth/update-password/confirm",
];

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const url = config.url ?? "";
    const shouldSkipAuthHeader = AUTH_WHITELIST.some((p) => url.includes(p));

    config.headers = config.headers ?? {};
    config.headers["X-App-Name"] = DeviceInfo.getApplicationName();

    if (!shouldSkipAuthHeader) {
      const token = await getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => {
    syncServerTime(response.headers["date"]);
    return response;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const url = error.config?.url ?? "";
//X-App-Name: app name 
    // network error → don't logout automatically
    if (!error.response) return Promise.reject(error);

    const isAuthEndpoint = AUTH_WHITELIST.some((p) => url.includes(p));

    if (status === 401 && !isAuthEndpoint) {
      if (!logoutInProgress) {
        logoutInProgress = true;
        try {
          clearTokenCache();
          await logoutHandler?.();
        } finally {
          logoutInProgress = false;
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;
