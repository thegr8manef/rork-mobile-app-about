import { router, Stack } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { FontFamily } from "@/constants";

export default function MenuLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: BankingColors.primary },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: { fontFamily: FontFamily.bold as const },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />

      <Stack.Screen
        name="loans"
        options={{ header: () => <CustomHeader tKey="loans.title.screen" /> }}
      />
      <Stack.Screen
        name="loan-details"
        options={{ title: "Détails du prêt" }}
      />

      <Stack.Screen name="schooling" options={{ title: "Scolarité" }} />
      <Stack.Screen
        name="schooling-transfer"
        options={{ title: "Virement scolaire" }}
      />
      <Stack.Screen
        name="schooling-transfer-history"
        options={{ title: "Historique transferts scolarité" }}
      />
      <Stack.Screen
        name="schooling-transfer-detail"
        options={{ title: "Détails du transfert" }}
      />

      <Stack.Screen
        name="claims-home"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="claimsHome.title"
            />
          ),
        }}
      />
      <Stack.Screen
        name="claims"
        options={{
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="claims.title" />
          ),
        }}
      />
      <Stack.Screen
        name="create-claim"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="claim.create.title"
            />
          ),
        }}
      />
      <Stack.Screen
        name="claim-details"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="claim.details.title"
            />
          ),
        }}
      />

      <Stack.Screen name="notifications" options={{ title: "Notifications" }} />
      <Stack.Screen
        name="notification-config"
        options={{ header: () => <CustomHeader title="Configuration" /> }}
      />
      <Stack.Screen
        name="cheques"
        options={{ header: () => <CustomHeader title="Chèques" /> }}
      />

      <Stack.Screen
        name="biometry-settings"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="settings.security.biometricPasskeySetup"
            />
          ),
        }}
      />

      <Stack.Screen
        name="edocs"
        options={{ header: () => <CustomHeader title="Documents" /> }}
      />
      <Stack.Screen
        name="quick-actions-config"
        options={{ title: "Actions rapides" }}
      />

      <Stack.Screen
        name="placements"
        options={{
          header: () => (
            <CustomHeader title="Placements" onBack={() => router.back()} />
          ),
        }}
      />

      <Stack.Screen
        name="exchange-rates"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="exchange-rates.title"
            />
          ),
        }}
      />

      <Stack.Screen
        name="equipements"
        options={{ header: () => <CustomHeader tKey="equipments.title" /> }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          header: () => <CustomHeader tKey="changePassword.title" />,
        }}
      />
      <Stack.Screen
        name="change-password-confirm"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="changePassword.otpTitle"
            />
          ),
        }}
      />
      <Stack.Screen
        name="edocs-list"
        options={{ header: () => <CustomHeader title="Liste des documents" /> }}
      />
      <Stack.Screen
        name="create-alert"
        options={{ title: "Créer une alerte" }}
      />
      <Stack.Screen
        name="contact-info"
        options={{ title: "Informations de contact" }}
      />

      <Stack.Screen
        name="saving-plans"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="savingPlans.title"
            />
          ),
        }}
      />
      <Stack.Screen
        name="saving-plans-create"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="savingPlans.createTitle"
            />
          ),
        }}
      />

      <Stack.Screen
        name="portfolio-titres"
        options={{
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="menu.title" />
          ),
        }}
      />

      <Stack.Screen name="bills" options={{ headerShown: false }} />

      <Stack.Screen
        name="setting-setup-passkey"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="settings.security.setupPasscode"
            />
          ),
        }}
      />
      <Stack.Screen
        name="setting-setup-biometric"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="enable.biometrics"
            />
          ),
        }}
      />
      <Stack.Screen
        name="menu-setup-biometric"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="enable.biometrics"
            />
          ),
        }}
      />
      <Stack.Screen
        name="biometric-not-available"
        options={{
          header: () => <CustomHeader onBack={() => router.back()} tKey="" />,
        }}
      />
      <Stack.Screen
        name="setting-setup-passcode"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="settings.security.setupPasscode"
            />
          ),
        }}
      />
      <Stack.Screen
        name="create-chequebook"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cheques.createChequebook"
            />
          ),
        }}
      />
      <Stack.Screen
        name="chequebook-requests-history"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cheques.history.title"
            />
          ),
        }}
      />

      <Stack.Screen
        name="customize-accounts"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="menu.customizeAccounts"
            />
          ),
        }}
      />

      <Stack.Screen
        name="language"
        options={{
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="menu.language" />
          ),
        }}
      />
      <Stack.Screen
        name="consult-rib"
        options={{
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="menu.consultRib" />
          ),
        }}
      />
    </Stack>
  );
}
