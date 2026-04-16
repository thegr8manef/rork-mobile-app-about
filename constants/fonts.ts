// src/constants/fonts.ts

/**
 * Global font mapping for the application.
 * Using the @assets alias for consistent path resolution.
 */
export const AppFonts = {
  Black: require("@assets/fonts/SourceSans3-Black.ttf"),
  BlackItalic: require("@assets/fonts/SourceSans3-BlackItalic.ttf"),
  Bold: require("@assets/fonts/SourceSans3-Bold.ttf"),
  BoldItalic: require("@assets/fonts/SourceSans3-BoldItalic.ttf"),
  ExtraBold: require("@assets/fonts/SourceSans3-ExtraBold.ttf"),
  ExtraBoldItalic: require("@assets/fonts/SourceSans3-ExtraBoldItalic.ttf"),
  ExtraLight: require("@assets/fonts/SourceSans3-ExtraLight.ttf"),
  ExtraLightItalic: require("@assets/fonts/SourceSans3-ExtraLightItalic.ttf"),
  Italic: require("@assets/fonts/SourceSans3-Italic.ttf"),
  Light: require("@assets/fonts/SourceSans3-Light.ttf"),
  LightItalic: require("@assets/fonts/SourceSans3-LightItalic.ttf"),
  Medium: require("@assets/fonts/SourceSans3-Medium.ttf"),
  MediumItalic: require("@assets/fonts/SourceSans3-MediumItalic.ttf"),
  Regular: require("@assets/fonts/SourceSans3-Regular.ttf"),
  SemiBold: require("@assets/fonts/SourceSans3-SemiBold.ttf"),
  SemiBoldItalic: require("@assets/fonts/SourceSans3-SemiBoldItalic.ttf"),
} as const;

/**
 * Type representing the valid keys for application fonts.
 */
export type AppFontKey = keyof typeof AppFonts;