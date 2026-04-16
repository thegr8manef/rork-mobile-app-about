import { horizontalScale, verticalScale } from '@/utils/scale';

export const Spacing = {
  xs: horizontalScale(4),
  sm: horizontalScale(8),
  md: horizontalScale(12),
  lg: horizontalScale(16),
  xl: horizontalScale(20),
  xxl: horizontalScale(24),
  xxxl: horizontalScale(32),
  huge: horizontalScale(40),
  massive: horizontalScale(48),

  vertical: {
    xs: verticalScale(4),
    sm: verticalScale(8),
    md: verticalScale(12),
    lg: verticalScale(16),
    xl: verticalScale(20),
    xxl: verticalScale(24),
    xxxl: verticalScale(32),
    huge: verticalScale(40),
    massive: verticalScale(48) },

  screenPadding: horizontalScale(16),
  cardPadding: horizontalScale(16),
  sectionSpacing: verticalScale(24),
  itemSpacing: verticalScale(12) } as const;
