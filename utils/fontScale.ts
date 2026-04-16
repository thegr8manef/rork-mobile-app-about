import { Platform, PixelRatio } from 'react-native';

let deviceFontScale = 1;

if (Platform.OS !== 'web') {
  try {
    const DeviceInfo = require('react-native-device-info');
    deviceFontScale = DeviceInfo.getFontScaleSync?.() ?? PixelRatio.getFontScale();
  } catch {
    deviceFontScale = PixelRatio.getFontScale();
  }
}

export function normalizeFontSize(size: number): number {
  if (Platform.OS === 'web' || deviceFontScale === 1) return size;
  return Math.round(size / deviceFontScale);
}

export function getDeviceFontScale(): number {
  return deviceFontScale;
}
