import { moderateScale } from '@/utils/scale';
import { Platform } from 'react-native';
import { normalizeFontSize } from '@/utils/fontScale';

export const FontSize = {
  xs: normalizeFontSize(moderateScale(10, 0.3)),
  sm: normalizeFontSize(moderateScale(12, 0.3)),
  base: normalizeFontSize(moderateScale(14, 0.3)),
  md: normalizeFontSize(moderateScale(15, 0.3)),
  lg: normalizeFontSize(moderateScale(18, 0.3)),
  xl: normalizeFontSize(moderateScale(20, 0.3)),
  xxl: normalizeFontSize(moderateScale(24, 0.3)),
  xxxl: normalizeFontSize(moderateScale(28, 0.3)),
  huge: normalizeFontSize(moderateScale(32, 0.3)),
  display: normalizeFontSize(moderateScale(40, 0.3)),
} as const;

export const FontWeight = {
  light: '300' as const,
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
} as const;

export const FontFamily = {
  extraLight: Platform.select({ web: 'SourceSans3-ExtraLight, sans-serif', default: 'ExtraLight' }) as string,
  light: Platform.select({ web: 'SourceSans3-Light, sans-serif', default: 'Light' }) as string,
  regular: Platform.select({ web: 'SourceSans3-Regular, sans-serif', default: 'Regular' }) as string,
  medium: Platform.select({ web: 'SourceSans3-Medium, sans-serif', default: 'Medium' }) as string,
  semibold: Platform.select({ web: 'SourceSans3-SemiBold, sans-serif', default: 'SemiBold' }) as string,
  bold: Platform.select({ web: 'SourceSans3-Bold, sans-serif', default: 'Bold' }) as string,
  extrabold: Platform.select({ web: 'SourceSans3-ExtraBold, sans-serif', default: 'ExtraBold' }) as string,
  black: Platform.select({ web: 'SourceSans3-Black, sans-serif', default: 'Black' }) as string,
  italic: Platform.select({ web: 'SourceSans3-Italic, sans-serif', default: 'Italic' }) as string,
  mediumItalic: Platform.select({ web: 'SourceSans3-MediumItalic, sans-serif', default: 'MediumItalic' }) as string,
  semiboldItalic: Platform.select({ web: 'SourceSans3-SemiBoldItalic, sans-serif', default: 'SemiBoldItalic' }) as string,
  boldItalic: Platform.select({ web: 'SourceSans3-BoldItalic, sans-serif', default: 'BoldItalic' }) as string,
} as const;

export type FontFamilyKey = keyof typeof FontFamily;

const weightToFamilyMap: Record<string, string> = {
  '300': FontFamily.light,
  '400': FontFamily.regular,
  '500': FontFamily.medium,
  '600': FontFamily.semibold,
  '700': FontFamily.bold,
  '800': FontFamily.extrabold,
  '900': FontFamily.black,
  normal: FontFamily.regular,
  bold: FontFamily.bold,
};

export function resolveFontFamily(weight?: string): string {
  if (!weight) return FontFamily.regular;
  return weightToFamilyMap[weight] ?? FontFamily.regular;
}

export const LineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
} as const;
