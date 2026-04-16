export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  customerCode?: string;
}
export type PendingCredentials = {
  username: string;
  password: string;
};

/**
 * ✅ Preferred login method — tracks HOW the user authenticated
 * Used later in transaction-summary to show the right confirmation button
 */
export type PreferredLoginMethod = "biometric" | "passcode" | "otp" | null;

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  biometricEnabled: boolean;
  hasSeenOnboarding: boolean;
  isFirstLaunch: boolean;
  hasPasscode: boolean;
  hasTrustedDevice: boolean;
  passkeyEnabled: boolean;
  quickLoginName?: string | null;
  currentUsername?: string | null;

  /**
   * ✅ NEW: true if the device trust belongs to the CURRENT logged-in account.
   * false if another account owns the device trust (or no trust exists).
   * When false → hide passcode/biometric in transaction-summary, show only OTP.
   */
  isDeviceOwnedByCurrentUser: boolean;

  /**
   * ✅ NEW: tracks how the user last logged in (biometric, passcode, or otp).
   * Used in transaction-summary to show the preferred confirmation method.
   */
  preferredLoginMethod: PreferredLoginMethod;
}

export type LoginStatus =
  | "LOGIN_COMPLETE"
  | "MFA_REQUIRED"
  | "LOGIN_ART_COMPLETE"
  | "CONTACT_DATA_VALIDATION";

export interface AuthCredentials {
  username: string;
  password: string;
  deviceId: string | any;
  requestId?: string;
  confirmationType?: string;
  confirmationValue?: string;
}

export interface MfaRequiredResponse {
  loginStatus: "MFA_REQUIRED";
  requestId: string;
}

export interface LoginCompleteResponse {
  loginStatus: "LOGIN_COMPLETE";
  isDeviceUsedByAnotherAccount: boolean;
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface LoginArtCompleteResponse {
  loginStatus: "LOGIN_ART_COMPLETE";
  requestId?: string;
  token: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface ContactDataValidationResponse {
  loginStatus: "CONTACT_DATA_VALIDATION";
  requestId: string;
}

export type LoginResponse =
  | MfaRequiredResponse
  | LoginCompleteResponse
  | LoginArtCompleteResponse
  | ContactDataValidationResponse;

export type HttpStatusCode =
  | "UNAUTHORIZED"
  | "LOCKED"
  | "FORBIDDEN"
  | "BAD_REQUEST"
  | "INTERNAL_SERVER_ERROR";

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "ACCOUNT_BLOCKED"
  | "INVALID_OTP"
  | "ACCOUNT_LOCKED"
  | "INVALID_TRANSACTION";

export interface ApiErrorResponse {
  httpStatusCode: HttpStatusCode;
  errorCode: AuthErrorCode;
  message: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  accessToken: string | null;
}

export class ApiLoginError extends Error {
  status: number;
  errorCode?: AuthErrorCode;
  httpStatusCode?: HttpStatusCode;

  constructor(
    message: string,
    status: number,
    errorCode?: AuthErrorCode,
    httpStatusCode?: HttpStatusCode,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.httpStatusCode = httpStatusCode;
  }
}

export type DeviceMetaData = {
  os: string;
  osVersion: string;
  model: string;
  manufacturer: string;
  appVersion: string;
};

export type DeviceCHALLENGEesponse = {
  challenge: string;
  challengeId: string;
  expiresAt: string;
};
