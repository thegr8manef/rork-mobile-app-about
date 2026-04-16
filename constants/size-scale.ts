
import { scale, vs, ms } from "react-native-size-matters";
import { Dimensions, Platform } from "react-native";
import { Spacing } from "./spacing";
export const { width, height, fontScale } = Dimensions.get("window");


export const guidelineBaseWidth = 375;
export const guidelineBaseHeight = 812;
export const isSmallheight = height < 700;
export const isSmalWidth = width <= 375;
  export const isSmall = width < 360;
  export const isLarge = width >= 768;

 export  const contentMaxWidth = isLarge ? 720 : undefined;
  export const headerGap = isSmall ? Spacing.sm : Spacing.md;

export const isAndroid = Platform.OS === "android";
export const isIos = Platform.OS === "ios";
export const verticalOffset = Platform.OS === "ios" ? 40 : 0;
export const horizontalScale = (value: number) => {
  return scale(value);
};
export const verticalScale = (value: number) => {
  return vs(value);
};
export const moderateScale = (value: number, mod: number) => {
  return ms(value, mod);
};





