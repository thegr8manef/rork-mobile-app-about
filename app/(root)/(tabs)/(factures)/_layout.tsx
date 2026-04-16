import { router, Stack } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { FontFamily } from "@/constants";

export default function FacturesLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: BankingColors.primary,
        },
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontFamily: FontFamily.bold,
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.payment_of_bills"
              showBackButton={false}
            />
          ),
        }}
      />

      <Stack.Screen
        name="biller-contracts"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.my_contracts"
              showBackButton={true}
            />
          ),
        }}
      />

      <Stack.Screen
        name="add-biller-contract"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.add_contract"
              showBackButton={true}
            />
          ),
        }}
      />

      <Stack.Screen
        name="contract-bills"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.contract_bills"
              showBackButton={true}
            />
          ),
        }}
      />

      <Stack.Screen
        name="biller-payment-history"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.payment_history"
              showBackButton={true}
            />
          ),
        }}
      />

      <Stack.Screen
        name="facture-view-pdf"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="billing.payment_of_bills"
              showBackButton={true}
            />
          ),
        }}
      />
    </Stack>
  );
}