import { horizontalScale, verticalScale } from "@/utils/scale";
import { width } from "./size-scale";

export const BorderRadius = {
  none: 0,
  xs: horizontalScale(4),
  sm: horizontalScale(6),
  md: horizontalScale(8),
  lg: horizontalScale(12),
  xl: horizontalScale(16),
  xxl: horizontalScale(20),
  full: 9999 } as const;

export const IconSize = {
  xs: horizontalScale(12),
  sm: horizontalScale(16),
  md: horizontalScale(20),
  lg: horizontalScale(24),
  xl: horizontalScale(28),
  xxl: horizontalScale(32),
  xxxl: horizontalScale(40),
  huge: horizontalScale(48),
  massive: horizontalScale(64) } as const;

export const AvatarSize = {
  xs: horizontalScale(24),
  sm: horizontalScale(32),
  md: horizontalScale(40),
  lg: horizontalScale(48),
  xl: horizontalScale(56),
  xxl: horizontalScale(64),
  huge: horizontalScale(80) } as const;

export const ButtonHeight = {
  sm: verticalScale(32),
  md: verticalScale(44),
  lg: verticalScale(52),
  xl: verticalScale(60) } as const;

export const InputHeight = {
  sm: verticalScale(36),
  md: verticalScale(44),
  lg: verticalScale(52) } as const;

export const CardHeight = {
  sm: verticalScale(80),
  md: verticalScale(100),
  lg: verticalScale(120),
  xl: verticalScale(150),
  xxl: verticalScale(180) } as const;

export const TabBarHeight = verticalScale(60);
export const HeaderHeight = verticalScale(56);
export const BottomSheetHandleHeight = verticalScale(4);
export const CARD_WIDTH = horizontalScale(width - 32);
