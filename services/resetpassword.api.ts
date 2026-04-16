
/* -------------------------------------------------------------------------- */
/*                             Debug log helpers                              */
/* -------------------------------------------------------------------------- */

import { BASE_URL } from "@/constants/base-url";
import api from "@/services/lib/axios";
import { GenerateResetPasswordConfirmRequest, GenerateResetPasswordConfirmResponse, GenerateResetPasswordInitRequest, GenerateResetPasswordInitResponse, ResetPasswordRequest, ResetPasswordResponse, UpdateContactDetailsConfirmRequest, UpdateContactDetailsConfirmResponse, UpdateContactDetailsInitRequest, UpdateContactDetailsInitResponse, UpdatePasswordConfirmRequest, UpdatePasswordConfirmResponse, UpdatePasswordInitRequest, UpdatePasswordInitResponse } from "@/types/resetpassword.type";

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[resetpassword.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[resetpassword.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

function logApiResponse(title: string, dataData: unknown) {
  console.log(`[resetpassword.api] ✅ ${title}\n`, JSON.stringify(dataData, null, 2));
}

function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[resetpassword.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

/* -------------------------------------------------------------------------- */
/*                               Small validators                             */
/* -------------------------------------------------------------------------- */

function assertNonEmpty(value: unknown, name: string) {
  if (!value || String(value).trim().length === 0) {
    throw new Error(`${name} is required`);
  }
}

function assertPasswordsMatch(newPassword: string, confirmPassword: string, ctx: string) {
  assertNonEmpty(newPassword, `${ctx}.newPassword`);
  assertNonEmpty(confirmPassword, `${ctx}.confirmPassword`);
  if (newPassword !== confirmPassword) {
    throw new Error(`${ctx}: newPassword and confirmPassword do not match`);
  }
}

/* -------------------------------------------------------------------------- */
/*                                   APIs                                     */
/* -------------------------------------------------------------------------- */

/**
 * INIT simple reset password
 * POST /api/v1/auth/generate-reset-password/init
 * body: { cin }
 * response 201: { contactDetail, contactType }
 */
export async function generateResetPasswordInit(
  body: GenerateResetPasswordInitRequest
): Promise<GenerateResetPasswordInitResponse> {
  assertNonEmpty(body?.cin, "generateResetPasswordInit.cin");

  const url = `${BASE_URL}/api/v1/auth/generate-reset-password/init`;
  logApiCall("POST auth/generate-reset-password/init (body)", body);

  try {
    const { data } = await api.post<GenerateResetPasswordInitResponse>(url, body);
    logApiResponse("POST generate-reset-password/init response", data);
    return data;
  } catch (err) {
    logApiError("POST generate-reset-password/init failed", err);
    throw err;
  }
}

/**
 * CONFIRM simple reset password (select contact)
 * POST /api/v1/auth/generate-reset-password/confirm
 * body: { cin, contactDetail }
 * response 201: { phoneNumber?, email? }
 */
export async function generateResetPasswordConfirm(
  body: GenerateResetPasswordConfirmRequest
): Promise<GenerateResetPasswordConfirmResponse> {
  assertNonEmpty(body?.cin, "generateResetPasswordConfirm.cin");
  assertNonEmpty(body?.contactDetail, "generateResetPasswordConfirm.contactDetail");

  const url = `${BASE_URL}/api/v1/auth/generate-reset-password/confirm`;
  logApiCall("POST auth/generate-reset-password/confirm (body)", body);

  try {
    const { data } = await api.post<GenerateResetPasswordConfirmResponse>(url, body);
    logApiResponse("POST generate-reset-password/confirm response", data);
    return data;
  } catch (err) {
    logApiError("POST generate-reset-password/confirm failed", err);
    throw err;
  }
}

/**
 * RESET password using resetToken from deep link
 * PATCH /api/v1/auth/reset-password
 * body: { resetToken, newPassword, confirmPassword }
 * response: { requestId }
 *
 * ⚠️ NOTE:
 * After this step, backend returns requestId -> usually means there's a NEXT confirmation step
 * (CHALLENGE or OTP/TOTP) to finalize the password reset.
 * We should add an endpoint like:
 *   /api/v1/auth/reset-password/confirm  (or similar)
 * once backend confirms.
 */
export async function resetPassword(
  body: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  assertNonEmpty(body?.resetToken, "resetPassword.resetToken");
  assertPasswordsMatch(body.newPassword, body.confirmPassword, "resetPassword");

  const url = `${BASE_URL}/api/v1/auth/reset-password`;
  logApiCall("PATCH auth/reset-password (body)", {
    ...body,
    // avoid logging raw password/token in full if you want:
    // resetToken: "***",
    // newPassword: "***",
    // confirmPassword: "***",
  });

  try {
    const { data } = await api.patch<ResetPasswordResponse>(url, body);
    logApiResponse("PATCH reset-password response", data);
    return data;
  } catch (err) {
    logApiError("PATCH reset-password failed", err);
    throw err;
  }
}

/**
 * UPDATE password inside app (direct — no OTP)
 * POST /api/v1/auth/update-password
 * body: { currentPassword, newPassword, confirmPassword, deviceId }
 * errors 400: errorCode NOT_TRUSTED_DEVICE | INVALID_INPUT
 */
export async function updatePassword(
  body: UpdatePasswordInitRequest
): Promise<void> {
  assertNonEmpty(body?.currentPassword, "updatePassword.currentPassword");
  assertPasswordsMatch(body?.newPassword, body?.confirmPassword, "updatePassword");

  const url = `${BASE_URL}/api/v1/auth/update-password`;
  logApiCall("POST auth/update-password (body)", {
    ...body,
    currentPassword: "***",
    newPassword: "***",
    confirmPassword: "***",
  });

  try {
    await api.post(url, body);
    logApiResponse("POST update-password response", "OK");
  } catch (err) {
    logApiError("POST update-password failed", err);
    throw err;
  }
}

/**
 * UPDATE password inside app (init)
 * PATCH /api/v1/auth/update-password/init
 * body: { newPassword, confirmPassword }
 * response 201: { requestId }
 */
export async function updatePasswordInit(
  body: UpdatePasswordInitRequest
): Promise<UpdatePasswordInitResponse> {
  assertNonEmpty(body?.currentPassword, "updatePasswordInit.currentPassword");
  assertPasswordsMatch(body?.newPassword, body?.confirmPassword, "updatePasswordInit");

  const url = `${BASE_URL}/api/v1/auth/update-password/init`;
  logApiCall("PATCH auth/update-password/init (body)", {
    ...body,
    // newPassword: "***",
    // confirmPassword: "***",
  });

  try {
    const { data } = await api.post<UpdatePasswordInitResponse>(url, body);
    logApiResponse("PATCH update-password/init response", data);
    return data;
  } catch (err) {
    logApiError("PATCH update-password/init failed", err);
    throw err;
  }
}

/**
 * UPDATE password inside app (confirm)
 * POST /api/v1/auth/update-password/confirm
 * body: { newPassword, requestId, confirmationType: "TOTP", confirmationValue }
 * response: 204 No Content
 */
export async function updatePasswordConfirm(
  body: UpdatePasswordConfirmRequest
): Promise<UpdatePasswordConfirmResponse> {
  assertNonEmpty(body?.requestId, "updatePasswordConfirm.requestId");
  assertNonEmpty(body?.confirmationValue, "updatePasswordConfirm.confirmationValue");
  assertNonEmpty(body?.newPassword, "updatePasswordConfirm.newPassword");

  const url = `${BASE_URL}/api/v1/auth/update-password/confirm`;
  logApiCall("POST auth/update-password/confirm (body)", body);

  try {
    const { data } = await api.post<UpdatePasswordConfirmResponse>(url, body);
    logApiResponse("POST update-password/confirm response", data);
    return data;
  } catch (err) {
    logApiError("POST update-password/confirm failed", err);
    throw err;
  }
}

/**
 * UPDATE profile contact details (init)
 * PATCH /api/v1/contract/profile/contactDetails/init
 * body: { cin, phoneNumber, mail }
 * response: unknown (for now)
 */
export async function updateContactDetailsInit(
  body: UpdateContactDetailsInitRequest
): Promise<UpdateContactDetailsInitResponse> {
  assertNonEmpty(body?.cin, "updateContactDetailsInit.cin");
  assertNonEmpty(body?.phoneNumber, "updateContactDetailsInit.phoneNumber");
  assertNonEmpty(body?.mail, "updateContactDetailsInit.mail");

  const url = `${BASE_URL}/api/v1/contract/profile/contactDetails/init`;
  logApiCall("PATCH contract/profile/contactDetails/init (body)", body);

  try {
    const { data } = await api.patch<UpdateContactDetailsInitResponse>(url, body);
    logApiResponse("PATCH contactDetails/init response", data);
    return data;
  } catch (err) {
    logApiError("PATCH contactDetails/init failed", err);
    throw err;
  }
}

/**
 * UPDATE profile contact details (confirm)
 * POST /api/v1/contract/profile/contactDetails/confirm
 * body: { totp }
 * response: unknown (for now)
 *
 * NOTE: you wrote "confim" in message; I assume correct is "confirm"
 */
export async function updateContactDetailsConfirm(
  body: UpdateContactDetailsConfirmRequest
): Promise<UpdateContactDetailsConfirmResponse> {
  assertNonEmpty(body?.totp, "updateContactDetailsConfirm.totp");

  const url = `${BASE_URL}/api/v1/contract/profile/contactDetails/confirm`;
  logApiCall("POST contract/profile/contactDetails/confirm (body)", body);

  try {
    const { data } = await api.post<UpdateContactDetailsConfirmResponse>(url, body);
    logApiResponse("POST contactDetails/confirm response", data);
    return data;
  } catch (err) {
    logApiError("POST contactDetails/confirm failed", err);
    throw err;
  }
}
