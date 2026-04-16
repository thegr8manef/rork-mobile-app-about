import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { BankingColors, Spacing, FontSize, FontFamily } from "@/constants";
import TText from "@/components/TText";

export default function NotFoundScreen() {
  const { t } = useTranslation();

  return (
    <>
      <Stack.Screen options={{ title: t("notFound.title") }} />
      <View style={styles.container}>
        <TText style={styles.title} tKey="notFound.message" />

        <Link href="/" style={styles.link}>
          <TText style={styles.linkText} tKey="notFound.goHome" />
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.xl,
    backgroundColor: BankingColors.background },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  link: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.lg },
  linkText: {
    fontSize: FontSize.base,
    color: BankingColors.primary } });
