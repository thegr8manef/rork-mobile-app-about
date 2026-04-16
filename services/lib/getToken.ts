import { SECURE_ACCESS_TOKEN_KEY, SECURE_REFRESH_TOKEN_KEY } from "@/constants/base-url";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";




let accessTokenCache: string | null = null;
let refreshTokenCache: string | null = null;

export const clearTokenCache = () => {
  accessTokenCache = null;
  refreshTokenCache = null;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;

  if (accessTokenCache) return accessTokenCache;

  const token = await SecureStore.getItemAsync(SECURE_ACCESS_TOKEN_KEY);
  accessTokenCache = token ?? null;

  return accessTokenCache;
};

export const getRefreshToken = async (): Promise<string | null> => {
  if (Platform.OS === "web") return null;

  if (refreshTokenCache) return refreshTokenCache;

  const token = await SecureStore.getItemAsync(SECURE_REFRESH_TOKEN_KEY);
  refreshTokenCache = token ?? null;

  return refreshTokenCache;
};

export const setAccessToken = async (token: string | null) => {
  if (Platform.OS === "web") return;

  accessTokenCache = token;

  if (!token) {
    await SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY);
    return;
  }

  await SecureStore.setItemAsync(SECURE_ACCESS_TOKEN_KEY, token);
};

export const setRefreshToken = async (token: string | null) => {
  if (Platform.OS === "web") return;

  refreshTokenCache = token;

  if (!token) {
    await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
    return;
  }

  await SecureStore.setItemAsync(SECURE_REFRESH_TOKEN_KEY, token);
};

export const clearTokens = async () => {
  if (Platform.OS === "web") return;

  clearTokenCache();
  await SecureStore.deleteItemAsync(SECURE_ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(SECURE_REFRESH_TOKEN_KEY);
};
