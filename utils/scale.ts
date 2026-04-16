import { scale, vs, ms } from "react-native-size-matters";
import { Dimensions, Platform } from "react-native";

export const { width, height, fontScale } = Dimensions.get("window");

export const guidelineBaseWidth = 375;
export const guidelineBaseHeight = 812;
export const isSmallheight = height < 700;
export const isSmalWidth = width <= 375;

export const isAndroid = Platform.OS === "android";
export const isIos = Platform.OS === "ios";
export const isWeb = Platform.OS === "web";
export const verticalOffset = Platform.OS === "ios" ? 40 : 0;

export const horizontalScale = (value: number) => {
  return scale(value);
};

export const verticalScale = (value: number) => {
  return vs(value);
};

export const moderateScale = (value: number, mod = 0.5) => {
  return ms(value, mod);
};
