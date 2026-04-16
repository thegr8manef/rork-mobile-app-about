import { ColorValue } from "react-native";

export const BankingColors = {
  primary: "#E5563E",
  primaryLight: "#FD7E64",
  primaryDark: "#fe6c03",

  secondary: "#0E9F6E",
  secondaryLight: "#2DC08D",

  accent: "#F59E0B",
  accentOrange: "#FF9F43",
  accentPurple: "#8B5CF6",
  accentPink: "#EC4899",
  accentGreen: "#4CAF50",
  accentBlue: "#2196F3",

  // NEW — used for "unsecure payment" icon (#FF9800)
  accentAmber: "#FF9800",
  accentIndigo: "#6366F1",

  schooling: "#D97842",
  claims: "#C44F3D",
  loans: "#DD7143",
  installments: "#E53935",

  background: "#F8FAFC",
  backgroundLight: "#F5F5F5",
  backgroundGray: "#E5E5E5",
  backgroundDark: "#E8E8E8",
  surface: "#FFFFFF",
  surfaceSecondary: "#F1F5F9",

  text: "#0F172A",
  textPrimary: "#1A1A1A",
  textSecondary: "#595959",
  textLight: "#636363",
  textGray: "#666666",
  textMuted: "#999999",
  textTertiary: "#999999",
  textDark: "#1C1C1E",
  textMedium: "#3C3C43",
  textSlate: "#8E8E93",

  white: "#FFFFFF",

  success: "#0E9F6E",
  successLight: "#10B98115",

  error: "#EF4444",
  errorLight: "#FEE2E2",
  errorDark: "#DC2626",
  errorRed: "#FF5252",
  errorLightRed: "#FFEBEE",

  warning: "#F59E0B",
  warningLight: "#FEF3C7",
  warningLighter: "#FFF4E6",
  warningDark: "#92400E",

  info: "#3B82F6",
  infoLight: "#DBEAFE",

  border: "#E2E8F0",
  borderLight: "#F1F5F9",
  borderGray: "#E5E5E5",
  borderMedium: "#CBD5E1",
  onbordingLabel: "#5C5858",

  // NEW — slider track & some dividers (#E0E0E0)
  borderNeutral: "#E0E0E0",

  borderDark: "#E0E0E0",
  borderPale: "#F0F0F0",

  shadow: "rgba(15, 23, 42, 0.1)",
  shadowDark: "rgba(15, 23, 42, 0.2)",
  shadowBlack: "rgba(0, 0, 0, 0.1)",
  black:"#000000" ,
  overlay: "rgba(0, 0, 0, 0.5)",
  overlayLight: "rgba(0, 0, 0, 0.1)",

  whiteTransparent05: "rgba(255, 255, 255, 0.05)",
  whiteTransparent10: "rgba(255, 255, 255, 0.1)",
  whiteTransparent15: "rgba(255, 255, 255, 0.15)",
  whiteTransparent20: "rgba(255, 255, 255, 0.2)",
  whiteTransparent80: "rgba(255, 255, 255, 0.8)",
  whiteTransparent90: "rgba(255, 255, 255, 0.9)",

  successTransparent20: "rgba(16, 185, 129, 0.2)",
  successTransparent30: "rgba(16, 185, 129, 0.3)",
  errorTransparent20: "rgba(255, 82, 82, 0.2)",
  successPale: "rgba(46, 204, 113, 0.12)",
  errorPale: "rgba(231, 76, 60, 0.12)",

  actionRed: "#FFE5E5",
  actionBlue: "#E5F5FF",
  actionOrange: "#FFF4E5",
  actionGreen: "#E8F5E9",
  actionPurple: "#F3E5F5",
  actionPeach: "#FFF5F3",

  cardBackground: "#020202",
  cardGradientBrown: "#4F4236",
  cardRadialGray: "#4B4E4B",

  textLabel: "#767676",

  disabled: "#CCCCCC",
  disabledDark: "#D0D0D0",

  iconBgOrange: "#FFF1E6",
  iconBgIndigo: "#EEF0FF",
  shadowDarkSlate: "#0F172A",

  loanCompleted: "#2E7D32",
  loanCompletedLight: "#ffedde",
  loanInProgress: "#0288D1",
  loanInProgressLight: "#E1F5FE",
  loanOverdue: "#D32F2F",
  loanOverdueLight: "#FFEBEE",
  loanLabelDark: "#444444",
  loanLabelText: "#666666",
  loginSubtitle: "#060606",
  forgotPassword: "#FF1C00" };

export const gradientColors: readonly [
  ColorValue,
  ColorValue,
  ...ColorValue[],
] = [BankingColors.primary, BankingColors.accent];
