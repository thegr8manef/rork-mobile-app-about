import { Stack } from "expo-router";

export default function SystemLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="no-internet" />
      <Stack.Screen name="maintenance" />
      <Stack.Screen name="user-blocked" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="app-blocked"
        options={{
          gestureEnabled: false,
          animation: "fade" }}
      />
      <Stack.Screen
        name="app-blocked-info"
        options={{
          gestureEnabled: false,
          animation: "slide_from_right" }}
      />

      <Stack.Screen name="account-locked" />
      <Stack.Screen name="FriendlyState" />
    </Stack>
  );
}