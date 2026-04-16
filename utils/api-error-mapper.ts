// utils/api-error-mapper.ts
// Maps backend errorCode values to i18n keys for user-facing messages.
// Covers: bill payments, card reload, schooling, chequebook, transfers.

export type ErrorMapping = {
  titleKey: string;
  descKey: string;
};

/**
 * Maps a backend errorCode to the appropriate i18n keys.
 * Falls back to a generic error if the code is unknown.
 */
export const getErrorMapping = (errorCode?: string | null): ErrorMapping => {
  if (!errorCode) return FALLBACK;

  const code = errorCode.trim();
  return ERROR_CODE_MAP[code] ?? FALLBACK;
};

const FALLBACK: ErrorMapping = {
  titleKey: "apiErrors.generic.title",
  descKey: "apiErrors.generic.desc",
};

const ERROR_CODE_MAP: Record<string, ErrorMapping> = {
  // ─── Bill Payment ───
  INVALID_INPUT: {
    titleKey: "apiErrors.invalidInput.title",
    descKey: "apiErrors.invalidInput.desc",
  },
  PAYMENT_NOT_FOUND: {
    titleKey: "apiErrors.paymentNotFound.title",
    descKey: "apiErrors.paymentNotFound.desc",
  },
  PAYMENT_CONFIRMATION_FAILED: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  AUTH_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  ACCOUNT_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  PAYMENT_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },

  // ─── Card Reload ───
  CARD_NOT_FOUND_BY_ID: {
    titleKey: "apiErrors.cardNotFound.title",
    descKey: "apiErrors.cardNotFound.desc",
  },
  INVALID_RELOAD_CARD: {
    titleKey: "apiErrors.cardNotFound.title",
    descKey: "apiErrors.cardNotFound.desc",
  },
  RELOAD_CARD_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  RELOAD_CARD_FAILED: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  GET_PROFILE_BY_USER_ID: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },

  // ─── Schooling ───
  SCHOOLING_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  UPLOAD_DOCUMENT_SHAREPOINT: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  INVALID_CONFIRMATION_VALUE: {
    titleKey: "apiErrors.invalidConfirmation.title",
    descKey: "apiErrors.invalidConfirmation.desc",
  },
  INVALID_OTP: {
    titleKey: "apiErrors.invalidOtp.title",
    descKey: "apiErrors.invalidOtp.desc",
  },
  TRANSFER_REQUEST_NOT_FOUND: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  CONFIRM_SCHOOLING_REQUEST: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  DOWNLOAD_DOCUMENT_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  SCHOOLING_TRANSFER_FAILED: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },

  // ─── Chequebook ───
  CREATE_CHEQUE_BOOK_ERROR: {
    titleKey: "apiErrors.chequebookPending.title",
    descKey: "apiErrors.chequebookPending.desc",
  },
  CHAPTER_CHEQUEBOOK_REQUEST_NOT_FOUND: {
    titleKey: "apiErrors.chequebookUnauthorized.title",
    descKey: "apiErrors.chequebookUnauthorized.desc",
  },
  CHEQUEBOOK_REQUEST_NOT_FOUND: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  CHEQUE_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },

  // ─── Add Beneficiary ───
  BENEFICIARY_ALREADY_EXISTS: {
    titleKey: "apiErrors.beneficiaryAlreadyExists.title",
    descKey: "apiErrors.beneficiaryAlreadyExists.desc",
  },
  ACCOUNT_BELONGS_TO_SAME_CLIENT: {
    titleKey: "apiErrors.accountBelongsToSameClient.title",
    descKey: "apiErrors.accountBelongsToSameClient.desc",
  },
  ACCOUNT_CLOSED: {
    titleKey: "apiErrors.accountClosed.title",
    descKey: "apiErrors.accountClosed.desc",
  },
  BENEFICIARY_NOT_FOUND: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },

  // ─── Transfer ───
  UNAUTHORIZED_CREDITOR_ACCOUNT_TYPE: {
    titleKey: "apiErrors.unauthorizedCreditor.title",
    descKey: "apiErrors.unauthorizedCreditor.desc",
  },
  CREDITOR_ACCOUNT_UNAUTHORIZED: {
    titleKey: "apiErrors.unauthorizedCreditor.title",
    descKey: "apiErrors.unauthorizedCreditor.desc",
  },
  UNAUTHORIZED_CREDITOR_ACCOUNT_TRANSFER: {
    titleKey: "apiErrors.creditorSameClient.title",
    descKey: "apiErrors.creditorSameClient.desc",
  },
  UNAUTHORIZED_DEBTOR_ACCOUNT_TRANSFER: {
    titleKey: "apiErrors.debtorSameClient.title",
    descKey: "apiErrors.debtorSameClient.desc",
  },
  UNAUTHORIZED_DEBTOR_ACCOUNT_TYPE: {
    titleKey: "apiErrors.debtorUnauthorized.title",
    descKey: "apiErrors.debtorUnauthorized.desc",
  },
  UNAUTHORIZED_DEBTOR_ACCOUNT: {
    titleKey: "apiErrors.debtorUnauthorized.title",
    descKey: "apiErrors.debtorUnauthorized.desc",
  },
  INVALID_CREDITOR_ACCOUNT: {
    titleKey: "apiErrors.invalidCreditor.title",
    descKey: "apiErrors.invalidCreditor.desc",
  },
  INVALID_DEBTOR_ACCOUNT: {
    titleKey: "apiErrors.debtorUnauthorized.title",
    descKey: "apiErrors.debtorUnauthorized.desc",
  },
  TRANSFER_SERVICE_ERROR: {
    titleKey: "apiErrors.generic.title",
    descKey: "apiErrors.generic.desc",
  },
  UNAUTHORIZED_REQUEST: {
    titleKey: "apiErrors.cardlimitUnauth.title",
    descKey: "apiErrors.cardlimitUnauth.desc",
  },
  DAILY_LIMIT_INSUFFICIENT: {
    titleKey: "apiErrors.transfer.dailyLimitInsufficient.title",
    descKey: "apiErrors.transfer.dailyLimitInsufficient.desc",
  },
  DAILY_CEILING_EXCEEDED: {
    titleKey: "apiErrors.transfer.dailyCeilingExceeded.title",
    descKey: "apiErrors.transfer.dailyCeilingExceeded.desc",
  },
  // ─── Card Actions ───
  INVALID_ACTION: {
    titleKey: "apiErrors.cardActionFailed.title",
    descKey: "apiErrors.cardActionFailed.desc",
  },
  CARD_LIMIT_UPDATE_FAILED: {
    titleKey: "apiErrors.cardLimitFailed.title",
    descKey: "apiErrors.cardLimitFailed.desc",
  },
  CARD_RESET_PIN_FAILED: {
    titleKey: "apiErrors.cardResetPinFailed.title",
    descKey: "apiErrors.cardResetPinFailed.desc",
  },
  CARD_3DSECURE_FAILED: {
    titleKey: "apiErrors.card3DSecureFailed.title",
    descKey: "apiErrors.card3DSecureFailed.desc",
  },
  CARD_ACTIVATION_FAILED: {
    titleKey: "apiErrors.cardActivationFailed.title",
    descKey: "apiErrors.cardActivationFailed.desc",
  },
  CARD_REPLACE_FAILED: {
    titleKey: "apiErrors.cardReplaceFailed.title",
    descKey: "apiErrors.cardReplaceFailed.desc",
  },
};
