import { NativeModules, Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import * as Crypto from "expo-crypto";
import { Buffer } from "buffer";

const { SecureSignModule } = NativeModules;

export async function generateKeyPair(deviceId: string): Promise<string> {
  console.log("########## GENERATE KEYPAIR ##########");

  const publicKey = await SecureSignModule.generateKeyPair(deviceId);

  console.log("########## publicKey  ##########");
  console.log("publicKey:", publicKey);
  console.log("##########   ##########");

  console.log("########## KEYPAIR GENERATED ##########");
  console.log(publicKey);

  return publicKey;
}

type SignChallengeOptions = {
  requireBiometric?: boolean; // default true
};

export async function signChallenge(
  challengeId: string,
  nonceBase64: string,
  deviceId: string,
  options?: SignChallengeOptions
): Promise<string> {
  console.log("########## SIGN FLOW START ##########");

  const requireBiometric = options?.requireBiometric ?? true;

  // ✅ Require biometric only when asked
  if (requireBiometric && Platform.OS !== "web") {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      console.log("❌ No biometrics available/enrolled — blocking passkey");
      throw new Error("NO_BIOMETRIC_ENROLLED");
    }

    console.log("👉 Biometric required — prompting user");

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm to continue",
      fallbackLabel: "Cancel",
      cancelLabel: "Cancel",
    });

    if (!auth.success) {
      console.log("❌ Biometric cancelled/failed — blocking passkey");
      throw new Error("BIOMETRIC_CANCELLED");
    }

    console.log("✅ Biometric success — continuing");
  } else {
    console.log("ℹ️ Biometric prompt skipped (requireBiometric = false)");
  }

  const canonical = `${challengeId}|${nonceBase64}|${deviceId}`;

  console.log(`
=================== 🔐 CANONICAL PAYLOAD BUILD ===================

📌 challengeId
--------------------------------------------------
${challengeId}

📌 nonceBase64  (challenge from backend)
--------------------------------------------------
${nonceBase64}

📌 deviceId
--------------------------------------------------
${deviceId}

➡️ CONCAT FORMAT
--------------------------------------------------
challengeId | nonceBase64 | deviceId

`);

  console.log(`
✅ RESULT — CANONICAL STRING
--------------------------------------------------
${canonical}
==================================================
`);

  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    canonical,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  const payloadBytes = Uint8Array.from(Buffer.from(hashHex, "hex"));
  const payloadBase64 = Buffer.from(payloadBytes).toString("base64");
  console.log("✔️ SIGEND BASE 64", payloadBase64);

  const signatureBase64 = await SecureSignModule.sign(payloadBase64, deviceId);

  console.log("✔️ PASSKEY SIGNATURE GENERATED");
  console.log(signatureBase64);

  console.log("########## SIGN FLOW END ##########");

  return signatureBase64;
}
type SignTransferChallengeOptions = {
  requireBiometric?: boolean; // default true
};

export async function signTransferChallenge(
  requestId: string,
  challengeId: string,
  nonceBase64: string,
  deviceId: string,
  options?: SignTransferChallengeOptions
): Promise<string> {
  console.log("########## TRANSFER SIGN FLOW START ##########");

  const requireBiometric = options?.requireBiometric ?? true;

  if (requireBiometric && Platform.OS !== "web") {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();

    if (!hasHardware || !enrolled) {
      console.log("❌ No biometrics available/enrolled — blocking transfer signature");
      throw new Error("NO_BIOMETRIC_ENROLLED");
    }

    console.log("👉 Biometric required — prompting user (TRANSFER)");

    const auth = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm to continue",
      fallbackLabel: "Cancel",
      cancelLabel: "Cancel",
    });

    if (!auth.success) {
      console.log("❌ Biometric cancelled/failed — blocking transfer signature");
      throw new Error("BIOMETRIC_CANCELLED");
    }

    console.log("✅ Biometric success — continuing (TRANSFER)");
  } else {
    console.log("ℹ️ Biometric prompt skipped (TRANSFER) (requireBiometric = false)");
  }

  const canonical = `${requestId}|${challengeId}|${nonceBase64}|${deviceId}`;

  console.log(`
=================== 🔐 TRANSFER CANONICAL PAYLOAD BUILD ===================

📌 requestId
--------------------------------------------------
${requestId}

📌 challengeId
--------------------------------------------------
${challengeId}

📌 nonceBase64 (challenge from backend)
--------------------------------------------------
${nonceBase64}

📌 deviceId
--------------------------------------------------
${deviceId}

➡️ CONCAT FORMAT
--------------------------------------------------
requestId | challengeId | nonceBase64 | deviceId

✅ RESULT — CANONICAL STRING
--------------------------------------------------
${canonical}
==================================================
`);

  const hashHex = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    canonical,
    { encoding: Crypto.CryptoEncoding.HEX }
  );

  const payloadBytes = Uint8Array.from(Buffer.from(hashHex, "hex"));
  const payloadBase64 = Buffer.from(payloadBytes).toString("base64");

  console.log(`
=================== 🧾 TRANSFER HASH DEBUG ===================
SHA256 (hex): ${hashHex}
payloadBase64: ${payloadBase64}
==================================================
`);

  const signatureBase64 = await SecureSignModule.sign(payloadBase64, deviceId);

  console.log("✔️ TRANSFER SIGNATURE GENERATED");
  console.log(signatureBase64);
  console.log("########## TRANSFER SIGN FLOW END ##########");

  return signatureBase64;
}
