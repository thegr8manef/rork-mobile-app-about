// utils/buildConfig.ts
import { NativeModules, Platform } from "react-native";

const isPreviewBuild: boolean =
  Platform.OS === "android"
    ? (NativeModules.RNBuildConfig?.IS_PREVIEW_BUILD ?? false)
    : false;

export const isProductionBuild = !__DEV__ && !isPreviewBuild;

// true for ANY non-dev build: preview (closed testing) + production
export const isReleaseBuild = !__DEV__;