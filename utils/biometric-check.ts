import * as LocalAuthentication from "expo-local-authentication";

export async function ensureBiometricReady() {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) {
    throw new Error("No biometric hardware available");
  }

  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!enrolled) {
    throw new Error(
      "No biometrics enrolled. Please add fingerprint or face unlock."
    );
  }

  return true;
}
