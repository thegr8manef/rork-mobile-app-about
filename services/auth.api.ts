import {
  ApiLoginError,
  AuthCredentials,
  DeviceCHALLENGEesponse,
  DeviceMetaData,
  LoginResponse } from "@/types/auth.type";
import api from "./lib/axios";
import axios from "axios";
import { BASE_URL } from "@/constants/base-url";
import DeviceInfo from "react-native-device-info";

const APP_NAME = DeviceInfo.getApplicationName();
console.log("🚀 ~ APP_NAME:", APP_NAME)

export async function loginApi(
  credentials: AuthCredentials
): Promise<LoginResponse> {
  // await new Promise((r) => setTimeout(r, 700));
  console.log('credentials:', credentials)

  const response = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Name": APP_NAME },
    body: JSON.stringify(credentials),
  });

  let body: any = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (
      body &&
      typeof body === "object" &&
      typeof body.errorCode === "string"
    ) {
      throw new ApiLoginError(
        body.message || "Unauthorized",
        response.status,
        body.errorCode,
        body.httpStatusCode
      );
    }
    throw new ApiLoginError("Unauthorized", response.status || 401);
  }

  const data = body as LoginResponse;

  console.log("=======================================================");
  console.log("🚀 ~ loginApi ~ data:", data.loginStatus);
  console.log("=======================================================");
  if (data.loginStatus === "MFA_REQUIRED") {
    data.requestId = data.requestId;
  }
  if (
    !data ||
    (data.loginStatus !== "MFA_REQUIRED" && data.loginStatus !== "LOGIN_ART_COMPLETE" &&
      data.loginStatus !== "LOGIN_COMPLETE")
  ) {
    throw new ApiLoginError("Invalid response from server", 401);
  }

  return data;
}

export async function loginApiConfirm(
  credentials: AuthCredentials
): Promise<LoginResponse> {
  console.log("📡 loginApi confirm ====> -> request", credentials);

  await new Promise((r) => setTimeout(r, 700));

  const response = await fetch(`${BASE_URL}/api/v1/auth/login/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-App-Name": APP_NAME },
    body: JSON.stringify(credentials),
  });

  let body: any = null;

  try {
    body = await response.json();
    console.log("🚀 ~ loginApiConfirm ~ body:", body);
  } catch {
    body = null;
  }

  if (!response.ok) {
    if (
      body &&
      typeof body === "object" &&
      typeof body.errorCode === "string"
    ) {
      throw new ApiLoginError(
        body.message || "Unauthorized",
        response.status,
        body.errorCode,
        body.httpStatusCode
      );
    }
    throw new ApiLoginError("Unauthorized", response.status || 401);
  }

  const data = body as LoginResponse;

  console.log("================================================");
  console.log("🚀 ~ loginApiConfirm ~ data:", data);
  console.log("================================================");

  if (
    !data ||
    (data.loginStatus !== "MFA_REQUIRED" &&
      data.loginStatus !== "LOGIN_COMPLETE")
  ) {
    throw new ApiLoginError("Invalid response from server", 401);
  }

  return data;
}

export async function requestPasswordResetApi(
  username: string
): Promise<{ transactionId: string; message: string }> {
  console.log("REQUEST PASSWORD RESET API:", { username });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!username) throw new Error("USERNAME_REQUIRED");

  return {
    transactionId: "pwd_reset_" + Date.now(),
    message: "Un code OTP a été envoyé à votre numéro de téléphone" };
}

export async function verifyPasswordResetOtpApi(
  transactionId: string,
  otp: string
): Promise<{ verified: boolean; resetToken: string }> {
  console.log("VERIFY PASSWORD RESET OTP API:", { transactionId, otp });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (otp !== "123456") throw new Error("INVALID_OTP");

  return {
    verified: true,
    resetToken: "reset_token_" + Date.now() };
}

export async function resetPasswordApi(
  resetToken: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  console.log("RESET PASSWORD API:", { resetToken, newPassword });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!newPassword || newPassword.length < 6) {
    throw new Error("INVALID_PASSWORD");
  }

  return {
    success: true,
    message: "Votre mot de passe a été modifié avec succès" };
}

export async function saveTrustedDeviceApi(
  deviceId: string,
  trusted: boolean
): Promise<{ success: boolean; message: string }> {
  console.log("SAVE TRUSTED DEVICE API:", { deviceId, trusted });

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    success: true,
    message: trusted
      ? "Appareil enregistré comme appareil de confiance"
      : "Appareil non enregistré" };
}

export async function savePasscodeApi(
  deviceId: string,
  passcode: string
): Promise<{ success: boolean; message: string }> {
  console.log("SAVE PASSCODE API:", { deviceId, passcode: "******" });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!passcode || passcode.length !== 6) throw new Error("INVALID_PASSCODE");

  return {
    success: true,
    message: "Code PIN configuré avec succès" };
}

export async function requestEmailOtpApi(
  email: string
): Promise<{ transactionId: string; message: string }> {
  console.log("REQUEST EMAIL OTP API:", { email });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!email || !email.includes("@")) throw new Error("INVALID_EMAIL");

  return {
    transactionId: "email_otp_" + Date.now(),
    message: "Un code de vérification a été envoyé à votre adresse email" };
}

export async function requestPhoneOtpApi(
  phone: string
): Promise<{ transactionId: string; message: string }> {
  console.log("REQUEST PHONE OTP API:", { phone });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (!phone) throw new Error("INVALID_PHONE");

  return {
    transactionId: "phone_otp_" + Date.now(),
    message: "Un code de vérification a été envoyé à votre numéro" };
}

export async function verifyContactOtpApi(
  transactionId: string,
  otp: string
): Promise<{ verified: boolean }> {
  console.log("VERIFY CONTACT OTP API:", { transactionId, otp });

  await new Promise((resolve) => setTimeout(resolve, 700));

  if (otp !== "123456") throw new Error("INVALID_OTP");

  return { verified: true };
}

export async function updateEmailApi(
  email: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  console.log("UPDATE EMAIL API:", { email, transactionId });

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    success: true,
    message: "Votre adresse email a été mise à jour avec succès" };
}

export async function updatePhoneApi(
  phone: string,
  transactionId: string
): Promise<{ success: boolean; message: string }> {
  console.log("UPDATE PHONE API:", { phone, transactionId });

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    success: true,
    message: "Votre numéro de téléphone a été mis à jour avec succès" };
}

/**
 * ========== TRUST DEVICE (axios) ==========
 */
export async function trustDeviceApi(
  deviceId: string,
  base64PublicKey: string,
  deviceMetaData: DeviceMetaData
): Promise<void> {
  const url = `/api/v1/auth/device/trust`;
  const payload = { deviceId, base64PublicKey, deviceMetaData };

  console.log("############### 🌐 TRUST DEVICE — REQUEST ###############");
  console.log("URL:", url);
  console.log("METHOD: POST");
  console.log("BODY:", JSON.stringify(payload, null, 2));
  console.log("#########################################################");

  try {
    const res = await api.post(url, payload);

    console.log("############### 📥 TRUST DEVICE — RESPONSE ##############");
    console.log("STATUS:", res.status);
    console.log("BODY:", res.data ?? null);
    console.log("#########################################################");

    if (res.status !== 202) {
      throw new Error(`TRUST_DEVICE_FAILED_${res.status}`);
    }

    console.log("🔐 Device trust accepted by backend (202).");
  } catch (err: any) {
    console.log("############### ❌ TRUST DEVICE FAILED ##################");
    console.log("STATUS:", err?.response?.status);
    console.log("REQUEST:", payload);
    console.log("RESPONSE BODY:", err?.response?.data);
    console.log("#########################################################");
    throw err;
  }
}

/**
 * ========== CREATE DEVICE CHALLENGE ==========
 */
export async function createDeviceChallengeApi(
  deviceId: string
): Promise<DeviceCHALLENGEesponse> {
  const payload = { deviceId };

  console.log(`
  ############### 🌐 DEVICE CHALLENGE — REQUEST ###########
  POST /api/v1/auth/device/challenge
  ${JSON.stringify(payload, null, 2)}
  #########################################################
    `);

  const res = await api.post("/api/v1/auth/device/challenge", payload);

  console.log(`
  ############### 📥 DEVICE CHALLENGE — RESPONSE ##########
  STATUS: ${res.status}
  BODY: ${JSON.stringify(res.data, null, 2)}
  #########################################################
    `);

  return res.data as DeviceCHALLENGEesponse;
}

/**
 * ========== VERIFY DEVICE ==========
 */
export async function verifyDeviceChallengeApi(
  deviceId: string,
  challengeId: string,
  proof: string
): Promise<LoginResponse> {
  const payload = { deviceId, challengeId, proof };

  console.log(`
  ############### 🌐 VERIFY DEVICE — REQUEST ##############
  POST ${BASE_URL}/api/v1/auth/device/verify
  ${JSON.stringify(payload, null, 2)}
  #########################################################
    `);

  const res = await axios.post(
    `${BASE_URL}/api/v1/auth/device/verify`,
    payload,
    {
      // 👇 IMPORTANT: ensure NO auth headers are added
      headers: {
        "Content-Type": "application/json" },
      withCredentials: false }
  );

  console.log(`
  ############### 📥 VERIFY DEVICE — RESPONSE #############
  STATUS: ${res.status}
  #########################################################
    `);

  return res.data as LoginResponse;
}

export async function initTransactionChallengeApi(
  deviceId: string,
  requestId: string,
  challengeType: "TOTP" | "CHALLENGE"
): Promise<{ success: boolean; transactionId: string }> {
  console.log("INIT TRANSACTION CHALLENGE API:", {
    deviceId,
    requestId,
    challengeType });

  const response = await api.post(
    `/api/v1/auth/init-transaction-challenge`,
      {
        deviceId,
        requestId,
        challengeType }
  );

  console.log("INIT TRANSACTION CHALLENGE RESPONSE STATUS:", response.status);

  if (!response.status || response.status > 300) {
    throw new Error("Failed to initialize transaction challenge");
  }

  return response.data;
}
// ✅ Request body (what API takes)
export interface InitTransactionChallengeBody {
  deviceId: string;
  requestId: string;
  challengeType: "CHALLENGE"; // (or "TOTP" | "CHALLENGE" if backend supports both)
}

// ✅ Response (what API returns)
export interface InitTransactionCHALLENGEesponse {
  requestId: string;
  challenge: string;
  challengeId: string;
  expiresAt: string; // keep string
}

// ✅ Typed function
export async function initTransactionChallengeApiV2(
  body: InitTransactionChallengeBody
): Promise<InitTransactionCHALLENGEesponse> {
  console.log(`
############### 🌐 INIT TX CHALLENGE — REQUEST ############
POST /api/v1/auth/init-transaction-challenge
${JSON.stringify(body, null, 2)}
###########################################################
  `);

  try {
    const res = await api.post<InitTransactionCHALLENGEesponse>(
      "/api/v1/auth/init-transaction-challenge",
      body
    );

    console.log(`
############### 📥 INIT TX CHALLENGE — RESPONSE ###########
STATUS: ${res.status}
BODY: ${JSON.stringify(res.data, null, 2)}
###########################################################
    `);

    const data = res.data;

    if (!data?.challenge || !data?.challengeId) {
      console.log("❌ Unexpected response shape:", data);
      throw new Error("Unexpected init-transaction-challenge response");
    }

    return data;
  } catch (err: any) {
    console.log(`
############### ❌ INIT TX CHALLENGE — ERROR ###############
MESSAGE: ${err?.message}
STATUS: ${err?.response?.status}
BODY: ${JSON.stringify(err?.response?.data ?? null, null, 2)}
###########################################################
    `);

    // keep a clean error for callers
    throw new Error("Failed to initialize transaction challenge");
  }
}



export async function resetPasswordInitApi(
  cin: string
): Promise<ResetPasswordInitResponse> {
  console.log("RESET PASSWORD INIT API:", { cin });
console.log("BASE_URL",BASE_URL)
  const response = await fetch(
    `${BASE_URL}/api/v1/auth/generate-reset-password/init`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
      },
      body: JSON.stringify({ cin }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    //@ts-ignore
    throw new Error(errorBody?.message || "RESET_PASSWORD_INIT_FAILED");
  }

  const data = await response.json();
  console.log("RESET PASSWORD INIT RESPONSE:", data);
  return data as ResetPasswordInitResponse;
}

export interface ResetPasswordConfirmResponse {
  contactDetail: string;
}

export async function resetPasswordConfirmApi(
  contactType: "mail" | "phone"
): Promise<ResetPasswordConfirmResponse> {
  console.log("RESET PASSWORD CONFIRM API:", { contactType });

  const response = await fetch(
    `${BASE_URL}/api/v1/auth/generate-reset-password/confirm`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
      },
      body: JSON.stringify({ contactType }),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
     //@ts-ignore
    throw new Error(errorBody?.message || "RESET_PASSWORD_CONFIRM_FAILED");
  }

  const data = await response.json();
  console.log("RESET PASSWORD CONFIRM RESPONSE:", data);
  return data as ResetPasswordConfirmResponse;
}



export interface ResetPasswordInitResponse {
  contactDetail: string;
  contactType: "mail" | "phone";
}

export interface GenerateResetPasswordInitRequest {
  identificationType: string;
  identificationNumber: string;
  deviceId: string;
  phoneNumber: string;
  mail?: string;
}

export async function generateResetPasswordInitApi(
  data: GenerateResetPasswordInitRequest
): Promise<{ success: boolean }> {
  console.log("GENERATE RESET PASSWORD INIT API:", data);

  const response = await fetch(
    `${BASE_URL}/api/v1/auth/generate-reset-password/init`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
      },
      body: JSON.stringify({
        identificationType: data.identificationType,
        identificationNumber: data.identificationNumber,
        deviceId: data.deviceId,
        phoneNumber: data.phoneNumber,
        ...(data.mail ? { mail: data.mail } : {}) }) }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.log("GENERATE RESET PASSWORD INIT ERROR:", errorBody);
    const body = errorBody as { message?: string; errorCode?: string } | null;
    const err = new Error(
      body?.message || "GENERATE_RESET_PASSWORD_INIT_FAILED"
    ) as Error & { errorCode?: string };
    // errorCode may come as a dedicated field OR as the message itself
    err.errorCode = body?.errorCode ?? body?.message;
    throw err;
  }

  console.log("GENERATE RESET PASSWORD INIT SUCCESS");
  return { success: true };
}

export interface ContactDetailsInitRequest {
  identificationType: string;
  identificationNumber: string;
  phoneNumber: string;
  email?: string;
}

export interface ContactDetailsInitResponse {
  requestId: string;
}

export async function contactDetailsInitApi(
  data: ContactDetailsInitRequest,
  accessToken: string
): Promise<ContactDetailsInitResponse> {
  console.log("CONTACT DETAILS INIT API:", data);

  const response = await fetch(
    `${BASE_URL}/api/contract/contact/init`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try { errorBody = await response.json(); } catch { errorBody = null; }
    console.log("CONTACT DETAILS INIT ERROR:", errorBody);
    throw new ApiContactError(
      errorBody?.message || "CONTACT_DETAILS_INIT_FAILED",
      response.status,
      errorBody?.errorCode
    );
  }

  const result = await response.json();
  console.log("CONTACT DETAILS INIT RESPONSE:", result);
  return result as ContactDetailsInitResponse;
}

export interface ContactDetailsConfirmRequest {
  requestId: string;
  otp: string;
}

export interface ContactDetailsConfirmResponse {
  token: string;
  noContent?: boolean;
}

export interface GenerateResetPasswordConfirmRequest {
  deviceId: string;
  token: string;
  password: string;
  confirmPassword: string;
}

export async function generateResetPasswordConfirmApi(
  data: GenerateResetPasswordConfirmRequest
): Promise<{ success: boolean }> {
  console.log("GENERATE RESET PASSWORD CONFIRM API:", { ...data, password: "***", confirmPassword: "***" });

  const response = await fetch(
    `${BASE_URL}/api/v1/auth/generate-reset-password/confirm`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.log("GENERATE RESET PASSWORD CONFIRM ERROR:", errorBody);
    const err: any = new Error(
      (errorBody as { message?: string })?.message || "GENERATE_RESET_PASSWORD_CONFIRM_FAILED"
    );
    err.errorCode = (errorBody as { errorCode?: string })?.errorCode;
    throw err;
  }

  console.log("GENERATE RESET PASSWORD CONFIRM SUCCESS");
  return { success: true };
}

export async function resendAuthOtpApi(
  requestId: string
): Promise<void> {
  console.log("RESEND AUTH OTP API:", { requestId });

  const response = await fetch(`${BASE_URL}/api/v1/auth/resend-auth-otp`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json" },
    body: JSON.stringify({ requestId }) });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.log("RESEND AUTH OTP ERROR:", errorBody);
    throw new Error(
      (errorBody as { message?: string })?.message || "RESEND_AUTH_OTP_FAILED"
    );
  }

  console.log("RESEND AUTH OTP SUCCESS");
}

export async function resendOtpApi(
  accessToken: string
): Promise<void> {
  console.log("RESEND OTP API (with bearer token)");

  const response = await fetch(`${BASE_URL}/api/v1/auth/resend-otp`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}` } });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    console.log("RESEND OTP ERROR:", errorBody);
    throw new Error(
      (errorBody as { message?: string })?.message || "RESEND_OTP_FAILED"
    );
  }

  console.log("RESEND OTP SUCCESS");
}

export async function contactDetailsConfirmApi(
  data: ContactDetailsConfirmRequest,
  accessToken: string
): Promise<ContactDetailsConfirmResponse> {
  console.log("CONTACT DETAILS CONFIRM API:", data);

  const response = await fetch(
    `${BASE_URL}/api/contract/contact/confirm`,
    {
      method: "PATCH",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-App-Name": APP_NAME,
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try { errorBody = await response.json(); } catch { errorBody = null; }
    console.log("CONTACT DETAILS CONFIRM ERROR:", errorBody);
    const err = new ApiContactError(
      errorBody?.message || "CONTACT_DETAILS_CONFIRM_FAILED",
      response.status,
      errorBody?.errorCode
    );
    throw err;
  }

  if (response.status === 204) {
    console.log("CONTACT DETAILS CONFIRM SUCCESS (204 No Content)");
    return { token: "", noContent: true } as ContactDetailsConfirmResponse;
  }

  const result = await response.json();
  console.log("CONTACT DETAILS CONFIRM SUCCESS:", result);
  return result as ContactDetailsConfirmResponse;
}

export class ApiContactError extends Error {
  status: number;
  errorCode?: string;

  constructor(message: string, status: number, errorCode?: string) {
    super(message);
    this.name = "ApiContactError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

export async function getProfileWithTokenApi(
  accessToken: string
): Promise<any> {
  console.log("GET PROFILE WITH TOKEN API");

  const response = await fetch(
    `${BASE_URL}/api/contract/profile`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}` }
    }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try { errorBody = await response.json(); } catch { errorBody = null; }
    console.log("GET PROFILE WITH TOKEN ERROR:", errorBody);
    throw new ApiContactError(
      errorBody?.message || "GET_PROFILE_FAILED",
      response.status,
      errorBody?.errorCode
    );
  }

  const result = await response.json();
  console.log("GET PROFILE WITH TOKEN SUCCESS:", result);
  return result;
}

export async function passwordArtApi(
  accessToken: string,
  password: string,
  confirmPassword: string
): Promise<{ success: boolean }> {
  console.log("PASSWORD ART API (with access token)");

  const response = await fetch(
    `${BASE_URL}/api/v1/auth/password-art`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ password, passwordConfirmation: confirmPassword }) }
  );

  if (!response.ok) {
    let errorBody: any = null;
    try { errorBody = await response.json(); } catch { errorBody = null; }
    console.log("PASSWORD ART ERROR:", errorBody);
    throw new ApiContactError(
      errorBody?.message || "PASSWORD_ART_FAILED",
      response.status,
      errorBody?.errorCode
    );
  }

  console.log("PASSWORD ART SUCCESS");
  return { success: true };
}