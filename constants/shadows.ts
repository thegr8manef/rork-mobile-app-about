import { Platform, ViewStyle } from 'react-native';
import { horizontalScale, verticalScale } from '@/utils/scale';
import { BankingColors } from './banking-colors';

type ShadowStyle = Pick<ViewStyle, 'shadowColor' | 'shadowOffset' | 'shadowOpacity' | 'shadowRadius' | 'elevation'>;

const createShadow = (
  elevation: number,
  shadowRadius: number,
  shadowOpacity: number
): ShadowStyle => {
  if (Platform.OS === 'android') {
    return { elevation };
  }
  
  return {
    shadowColor: BankingColors.text,
    shadowOffset: {
      width: 0,
      height: verticalScale(elevation / 2) },
    shadowOpacity,
    shadowRadius: horizontalScale(shadowRadius) };
};

export const Shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0 } as ShadowStyle,
  
  xs: createShadow(2, 2, 0.05),
  sm: createShadow(3, 3, 0.08),
  md: createShadow(4, 4, 0.1),
  lg: createShadow(6, 6, 0.12),
  xl: createShadow(8, 8, 0.15),
  xxl: createShadow(12, 12, 0.18),
  
  card: createShadow(3, 4, 0.08),
  button: createShadow(2, 3, 0.1),
  modal: createShadow(10, 10, 0.2) } as const;
