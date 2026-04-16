import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} initialRouteName="login">
      <Stack.Screen name="login" />
      <Stack.Screen name="verifymfa" />
      <Stack.Screen name="device-confidence" />
      <Stack.Screen name="setup-passcode" />
      <Stack.Screen name="setup-biometric" />
      <Stack.Screen name="passcode-login" />
      <Stack.Screen name="forgot-password" />
      <Stack.Screen name="forgot-password-contact" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="reset-password-confirm" />
      <Stack.Screen name="token-expired" options={{ gestureEnabled: false }} />
    </Stack>
  );
}