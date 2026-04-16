import { Stack, useRouter } from "expo-router";
import { BankingColors } from "@/constants/banking-colors";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { FontFamily } from "@/constants";

export default function CartesLayout() {
  const router = useRouter();

  return (
    <Stack
    initialRouteName="index"
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: BankingColors.primary },
        
        headerTintColor: "#FFFFFF",
        headerTitleStyle: {
          fontFamily: FontFamily.bold } }}
    >
      <Stack.Screen
        name="index"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.myCards"
              showBackButton={false}
            />
          ) }}
      />
      <Stack.Screen
        name="reload-card"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.reloadCard"
            />
          ) }}
      />
      <Stack.Screen
        name="reload-card-history"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="reloadCard.history.title"
            />
          ) }}
      />
      <Stack.Screen
        name="card-transactions"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.transactions"
            />
          ) }}
      />
      <Stack.Screen
        name="transaction-details"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.transactionDetails"
            />
          ) }}
      />
      <Stack.Screen
        name="installments"
        options={{
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="cards.installments"
            />
          ) }}
      />

      <Stack.Screen
        name="carte-history"
        options={{
          header: () => (
            <CustomHeader onBack={() => router.back()} tKey="carte.history" />
          ) }}
      />
    </Stack>
  );
}
