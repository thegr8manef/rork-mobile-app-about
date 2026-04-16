// ============================================================
// Reset Password Hooks (React Query)
// ============================================================

import { useMutation } from "@tanstack/react-query";
import { AxiosError } from "axios";
import * as resetApi from "@/services/resetpassword.api";
import {
  GenerateResetPasswordInitRequest,
  GenerateResetPasswordInitResponse,
  GenerateResetPasswordConfirmRequest,
  GenerateResetPasswordConfirmResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  UpdatePasswordInitRequest,
  UpdatePasswordInitResponse,
  UpdatePasswordConfirmRequest,
  UpdatePasswordConfirmResponse,
  UpdateContactDetailsInitRequest,
  UpdateContactDetailsInitResponse,
  UpdateContactDetailsConfirmRequest,
  UpdateContactDetailsConfirmResponse,
} from "@/types/resetpassword.type";

// ============================================================
// Logging Helpers
// ============================================================

const logSuccess = (label: string, data: unknown) => {
  console.log(
    `
======================================================================
✅ ${label} SUCCESS
`,
    data,
    `
======================================================================`,
  );
};

const logError = (label: string, error: AxiosError) => {
  console.log(
    `
======================================================================
❌ ${label} ERROR
Status: ${error.response?.status ?? "N/A"}
Message: ${error.message}
Data:
`,
    error.response?.data,
    `
======================================================================`,
  );
};

// Mask secrets in logs
const maskResetPayload = (body: ResetPasswordRequest) => ({
  resetToken: body.resetToken ? "***" : "",
  newPassword: body.newPassword ? "***" : "",
  confirmPassword: body.confirmPassword ? "***" : "",
});

const maskUpdatePasswordInitPayload = (body: UpdatePasswordInitRequest) => ({
  currentPassword: body.currentPassword ? "***" : "",
  newPassword: body.newPassword ? "***" : "",
  confirmPassword: body.confirmPassword ? "***" : "",
});

// ============================================================
// Mutations
// ============================================================

export const useGenerateResetPasswordInit = () => {
  return useMutation<
    GenerateResetPasswordInitResponse,
    AxiosError,
    GenerateResetPasswordInitRequest
  >({
    mutationFn: (body) => resetApi.generateResetPasswordInit(body),

    onMutate: (body) => {
      console.log("🔄 [GenerateResetPasswordInit] payload:", body);
      return undefined;
    },

    onSuccess: (data) => logSuccess("GENERATE RESET PASSWORD INIT", data),
    onError: (error) => logError("GENERATE RESET PASSWORD INIT", error),
  });
};

export const useGenerateResetPasswordConfirm = () => {
  return useMutation<
    GenerateResetPasswordConfirmResponse,
    AxiosError,
    GenerateResetPasswordConfirmRequest
  >({
    mutationFn: (body) => resetApi.generateResetPasswordConfirm(body),

    onMutate: (body) => {
      console.log("🔄 [GenerateResetPasswordConfirm] payload:", body);
      return undefined;
    },

    onSuccess: (data) => logSuccess("GENERATE RESET PASSWORD CONFIRM", data),
    onError: (error) => logError("GENERATE RESET PASSWORD CONFIRM", error),
  });
};

export const useResetPassword = () => {
  return useMutation<ResetPasswordResponse, AxiosError, ResetPasswordRequest>({
    mutationFn: (body) => resetApi.resetPassword(body),

    onMutate: (body) => {
      console.log("🔄 [ResetPassword] payload:", maskResetPayload(body));
      return undefined;
    },

    onSuccess: (data) => logSuccess("RESET PASSWORD", data),
    onError: (error) => logError("RESET PASSWORD", error),
  });
};

export const useUpdatePassword = (options?: {
  onSuccess?: () => void;
  onError?: (error: AxiosError) => void;
}) => {
  return useMutation<void, AxiosError, UpdatePasswordInitRequest>({
    mutationFn: (body) => resetApi.updatePassword(body),

    onMutate: (body) => {
      console.log("🔄 [UpdatePassword] payload:", maskUpdatePasswordInitPayload(body));
      return undefined;
    },

    onSuccess: () => {
      logSuccess("UPDATE PASSWORD", "OK");
      options?.onSuccess?.();
    },
    onError: (error) => {
      logError("UPDATE PASSWORD", error);
      options?.onError?.(error);
    },
  });
};

export const useUpdatePasswordInit = (options?: {
  onSuccess?: (data: UpdatePasswordInitResponse) => void;
  onError?: (error: AxiosError) => void;
}) => {
  return useMutation<
    UpdatePasswordInitResponse,
    AxiosError,
    UpdatePasswordInitRequest
  >({
    mutationFn: (body) => resetApi.updatePasswordInit(body),

    onMutate: (body) => {
      console.log(
        "🔄 [UpdatePasswordInit] payload:",
        maskUpdatePasswordInitPayload(body),
      );
      return undefined;
    },

    onSuccess: (data) => {
      logSuccess("UPDATE PASSWORD INIT", data);
      options?.onSuccess?.(data);
    },
    onError: (error) => {
      logError("UPDATE PASSWORD INIT", error);
      options?.onError?.(error);
    },
  });
};

export const useUpdatePasswordConfirm = () => {
  return useMutation<
    UpdatePasswordConfirmResponse,
    AxiosError,
    UpdatePasswordConfirmRequest
  >({
    mutationFn: (body) => resetApi.updatePasswordConfirm(body),

    onMutate: (body) => {
      console.log("🔄 [UpdatePasswordConfirm] payload:", body);
      return undefined;
    },

    onSuccess: (data, body) => {
      console.log(
        "✅ [UpdatePasswordConfirm] success, requestId:",
        body?.requestId,
      );
      logSuccess("UPDATE PASSWORD CONFIRM", data);
    },

    onError: (error) => logError("UPDATE PASSWORD CONFIRM", error),
  });
};

export const useUpdateContactDetailsInit = () => {
  return useMutation<
    UpdateContactDetailsInitResponse,
    AxiosError,
    UpdateContactDetailsInitRequest
  >({
    mutationFn: (body) => resetApi.updateContactDetailsInit(body),

    onMutate: (body) => {
      console.log("🔄 [UpdateContactDetailsInit] payload:", body);
      return undefined;
    },

    onSuccess: (data) => logSuccess("UPDATE CONTACT DETAILS INIT", data),
    onError: (error) => logError("UPDATE CONTACT DETAILS INIT", error),
  });
};

export const useUpdateContactDetailsConfirm = () => {
  return useMutation<
    UpdateContactDetailsConfirmResponse,
    AxiosError,
    UpdateContactDetailsConfirmRequest
  >({
    mutationFn: (body) => resetApi.updateContactDetailsConfirm(body),

    onMutate: (body) => {
      console.log("🔄 [UpdateContactDetailsConfirm] payload:", body);
      return undefined;
    },

    onSuccess: (data) => logSuccess("UPDATE CONTACT DETAILS CONFIRM", data),
    onError: (error) => logError("UPDATE CONTACT DETAILS CONFIRM", error),
  });
};
