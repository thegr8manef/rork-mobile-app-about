/**
 * ============================================================
 * Reset Password APIs (Auth + Profile Contact Details)
 * ============================================================
 *
 * ✅ Same style as card.api.ts:
 * - Strong payload validation
 * - Debug logs (call/response/error)
 * - Uses BASE_URL + axios instance
 */

import { BASE_URL } from "@/constants/base-url";
import api from "@/services/lib/axios";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

// 1) Simple reset password (outside app / via CIN)

export type GenerateResetPasswordInitRequest = {
  cin: string;
};

export type GenerateResetPasswordInitResponse = {
  contactDetail: string; // masked value like *******331
  contactType: "mail" | "phone";
};

export type GenerateResetPasswordConfirmRequest = {
  cin: string;
  contactDetail: string; // selected contact detail (masked or actual depending backend)
};

export type GenerateResetPasswordConfirmResponse = {
  phoneNumber?: string; // masked
  email?: string; // masked
};

// 2) Reset password using resetToken from deep link

export type ResetPasswordRequest = {
  resetToken: string; // received from deep link
  newPassword: string;
  confirmPassword: string;
};

export type ResetPasswordResponse = {
  requestId: string;
};

// 3) Update password inside app (requires confirmation next step)

export type UpdatePasswordInitRequest = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  deviceId: string;
};

export type UpdatePasswordInitResponse = {
  requestId: string;
};

export type UpdatePasswordConfirmRequest = {
  newPassword: string;
  requestId: string;
  confirmationType: "TOTP";
  confirmationValue: string;
};

// unknown for now (until backend confirmed)
export type UpdatePasswordConfirmResponse = any;

// 4) Update profile contact details (init/confirm) - endpoint says PATCH

export type UpdateContactDetailsInitRequest = {
  cin: string;
  phoneNumber: string;
  mail: string;
};

// unknown for now (until backend confirmed)
export type UpdateContactDetailsInitResponse = any;

export type UpdateContactDetailsConfirmRequest = {
  totp: string;
};

// unknown for now (until backend confirmed)
export type UpdateContactDetailsConfirmResponse = any;
