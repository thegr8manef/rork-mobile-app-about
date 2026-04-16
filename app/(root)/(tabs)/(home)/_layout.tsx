import { Stack, router } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { History } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { FontFamily } from "@/constants";

export default function HomeLayout() {
  const { t } = useTranslation();
  return (
    <BottomSheetModalProvider>
      <Stack
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
          headerTitleStyle: {
            fontFamily: FontFamily.bold } }}
        initialRouteName="index"
      >
        <Stack.Screen
          name="index"
          options={{
            headerShown: false }}
        />
        <Stack.Screen
          name="account-details"
          options={{
            title: "Détails du compte" }}
        />
        <Stack.Screen
          name="transactions"
          options={{
            title: "Transactions" }}
        />
        <Stack.Screen name="send-money" />
        <Stack.Screen
          name="beneficiaries"
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader onBack={() => router.back()} tKey="beneficiaries.title" />
            ) }}
        />
        <Stack.Screen
          name="add-beneficiary"
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="beneficiaries.addTitle"
              />
            ) }}
        />
        <Stack.Screen
          name="transfer-history"
          options={{
            title: "Historique des virements",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="transfer-history"
              />
            ) }}
        />
        <Stack.Screen
          name="e-transfer-history"
          options={{
            title: "Historique des virements",
            header: () => (
              <CustomHeader
                onBack={() =>
                  router.replace("/(root)/(tabs)/(home)/e-transfer")
                }
                tKey="e-transafer-history"
              />
            ) }}
        />
        <Stack.Screen
          name="transaction-details"
          options={{
            title: "Détails de la transaction" }}
        />
        <Stack.Screen
          name="e-transfer"
          options={{
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="E-Transfer"
                onRightPress={() => router.navigate("/e-transfer-history")}
                rightIcon={<History size={24} color="#FFFFFF" />}
              />
            ) }}
        />
        <Stack.Screen
          name="e-transfer-payment"
          options={{
            headerShown: false }}
        />

        {/* <Stack.Screen
          name="transfer-passcode-confirm"
          options={{
            title: "transfer-passcode-confirm",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="transfer-passcode-confirm"
              />
            ) }}
        /> */}
        {/* <Stack.Screen
          name="confirm-transfer-biometric"
          options={{
            title: "confirm-transfer-biometric",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="confirm-transfer-biometric"
              />
            ) }}
        /> */}
        {/* confirm-transfer-passcode */}
        {/* <Stack.Screen
          name="beneficiary-confirm-biometric"
          options={{
            title: "beneficiary-confirm-biometric",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="beneficiary-confirm-biometric"
              />
            ) }}
        /> */}
        {/* <Stack.Screen
          name="beneficiary-passcode-confirm"
          options={{
            title: "beneficiary-passcode-confirm",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="beneficiary-passcode-confirm"
              />
            ) }}
        /> */}
        {/* <Stack.Screen
          name="beneficiary-summary"
          options={{
            title: "beneficiary-summary",
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="beneficiary-summary"
              />
            ) }}
        /> */}

        {/* transfer-view-pdf */}
        <Stack.Screen
          name="transfer-view-pdf"
          options={{
            title:(t("transferViewPdf.title"))
        
          }}
        />
        {/* view-pdf-rib. */}
        <Stack.Screen
          name="view-pdf-rib"
          options={{
            header: () => (
              <CustomHeader onBack={() => router.back()} tKey="RIB" />
            ) }}
        />
      </Stack>
    </BottomSheetModalProvider>
  );
}
