import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Image,
  Linking,
  Dimensions,
} from "react-native";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ShieldAlert, AlertTriangle } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily, LineHeight } from "@/constants/typography";
import { BorderRadius, ButtonHeight } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

export default function TokenExpiredScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const handleBackToLogin = () => {
    router.replace("/(auth)/login");
  };

  const handleHelp = async () => {
    const url = "https://www.attijariup.com.tn/landingPage.html";
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    }
  };

  return (
    <View
      style={[
        styles.container,
        { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.lg },
      ]}
    >
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@assets/images/newlogo.png")}
          style={[styles.logo, { height: SCREEN_HEIGHT < 700 ? 100 : 130 }]}
          resizeMode="contain"
        />
      </View>

      {/* Icon */}
      <View style={styles.iconCircle}>
        <ShieldAlert size={32} color={BankingColors.error} strokeWidth={1.8} />
      </View>

      {/* Title & Description */}
      <TText style={styles.title} tKey="tokenExpired.title" />
      <TText style={styles.description} tKey="tokenExpired.description" />

      {/* Que faire card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <AlertTriangle size={18} color={BankingColors.warning} />
          <TText style={styles.cardTitle} tKey="tokenExpired.whatToDo.title" />
        </View>
        <TText style={styles.cardDesc} tKey="tokenExpired.whatToDo.desc" />
      </View>

      <View style={styles.spacer} />

      {/* Back to login button */}
      <TouchableOpacity
        style={styles.button}
        onPress={handleBackToLogin}
        activeOpacity={0.85}
      >
        <TText style={styles.buttonText} tKey="tokenExpired.backToLogin" />
      </TouchableOpacity>

      {/* Besoin d'aide */}
      <TouchableOpacity style={styles.helpRow} onPress={handleHelp} activeOpacity={0.7}>
        <TText style={styles.helpText} tKey="tokenExpired.needHelp" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xxl,
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: 220,
    marginBottom: Spacing.xl,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: BankingColors.error + "12",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.vertical.lg,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: Spacing.vertical.xs,
  },
  description: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.regular,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: FontSize.md * LineHeight.normal,
    marginBottom: Spacing.vertical.xxl,
  },
  card: {
    width: "100%",
    backgroundColor: BankingColors.warning + "15",
    borderWidth: 1,
    borderColor: BankingColors.warning + "30",
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.vertical.sm,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
  },
  cardDesc: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    lineHeight: FontSize.base * LineHeight.normal,
  },
  spacer: {
    flex: 1,
  },
  button: {
    width: "100%",
    height: ButtonHeight.lg,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.vertical.md,
    ...Shadow.md,
  },
  buttonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },
  helpRow: {
    alignItems: "center",
    paddingVertical: Spacing.vertical.sm,
  },
  helpText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
  },
});
