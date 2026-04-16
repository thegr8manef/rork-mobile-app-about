import { BASE_URL } from "@/constants/base-url";
import api from "./lib/axios";

export interface SchoolingFileData {
  id: string;
  fileRef: string;
  fileYear: string;
  expiryDate: string;
  settlementAccount: string;
  settlementAccountBranch: string;
  currency: {
    alphaCode: string;
    numericCode: number;
    designation: string;
  };
  email: string;
  studentName: string;
  residentialAddress: {
    city: string;
    countryCode: number;
    postalCode: string;
  };
  bank: string;
  swift: string;
  studentAccNum: string;
  studyField: string;
  studyInstitutionName: string;
  studyInstitutionCountry: string;
  studyInstitutionBank: string;
  studyInstitutionSwift: string;
  studyInstitutionAgency: string;
  studyInstitutionAccount: string;
  completeFile: boolean;
  cardAccountNum: string;
  allowedFeeTypes: string[];
  allowedTransferTypes: string[];
  fileAmountLimit: number;
}

export interface SchoolingFilesResponse {
  count: number;
  data: SchoolingFileData[];
}

export interface ConversionTradeRequest {
  schoolingId: string;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  amount: number;
}

export interface ConversionTradeResponse {
  convertedAmount: number;
}

export interface SchoolingTransferInitRequest {
  attachment?: File | Blob;
  transferMode: string;
  transferType: string;
  amount: number;
  currency: string;
  comment?: string;
  executionDate: string;
  feeType: string;
  schoolingFileId: string;
}

export interface SchoolingTransferInitResponse {
  id: string;
  schoolingFileId: string;
  attachment?: string;
  transferMode: string;
  transferType: string;
  amount: number;
  currency: {
    alphaCode: string;
    numericCode: number;
    designation: string;
  };
  status: string;
  comment?: string;
  executionDate: string;
  feeType: string;
}

export interface SchoolingTransferConfirmRequest {
  confirmationMethod: string;
  confirmationValue: string;
  requestId: string;
  challengeConfirmationValue?: SchoolingChallengeConfirmationValue;
}
export type SchoolingChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};
export interface SchoolingTransferHistoryItem {
  id: string;

  fileId: string; // ✅ backend field
  fileRef?: string;
  fileYear?: string;

  transferType: string;
  transferMode: string;

  transferAmount: string; // ✅ backend field
  transferCurrency: {
    alphaCode: string;
    numericCode: number;
    designation: string;
    numberOfDecimals: number;
  };

  transferDate: string; // ✅ backend field
  abtStatus: string; // ✅ backend status
  feeType?: string | null;

  comment?: string | null; // not always present
  swiftMessage?: string | null;
  swiftStatus?: string | null;
  rejectionReason?: string | null;
}

export interface SchoolingTransferHistoryResponse {
  count: number;
  data: SchoolingTransferHistoryItem[];
}

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[scholling.api] ▶ ${title}`);
    return;
  }
  console.log(
    `\n[scholling.api] ▶ ${title}\n`,
    JSON.stringify(payload, null, 2),
  );
}

// ✅ you asked: log response with JSON.stringify(data.data, null, 2)
function logApiResponse(title: string, dataData: unknown) {
  console.log(
    `[scholling.api] ✅ ${title}\n`,
    JSON.stringify(dataData, null, 2),
  );
}

// Better axios error log (shows response.data if exists)
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(
    `[scholling.api] ❌ ${title}\n`,
    JSON.stringify(payload, null, 2),
  );
}

// --------------------
// Mapper(s)
// --------------------
function mapSchoolingFile(raw: SchoolingFileData): SchoolingFileData {
  return {
    id: raw.id,
    fileRef: raw.fileRef,
    fileYear: raw.fileYear,
    expiryDate: raw.expiryDate,
    settlementAccount: raw.settlementAccount,
    settlementAccountBranch: raw.settlementAccountBranch,
    currency: raw.currency,
    email: raw.email,
    studentName: raw.studentName,
    residentialAddress: {
      city: raw.residentialAddress?.city,
      countryCode: raw.residentialAddress?.countryCode,
      postalCode: raw.residentialAddress?.postalCode,
    },
    bank: raw.bank,
    swift: raw.swift,
    studentAccNum: raw.studentAccNum,
    studyField: raw.studyField,
    studyInstitutionName: raw.studyInstitutionName,
    studyInstitutionCountry: raw.studyInstitutionCountry,
    studyInstitutionBank: raw.studyInstitutionBank,
    studyInstitutionSwift: raw.studyInstitutionSwift,
    studyInstitutionAgency: raw.studyInstitutionAgency,
    studyInstitutionAccount: raw.studyInstitutionAccount,
    completeFile: raw.completeFile,
    cardAccountNum: raw.cardAccountNum,
    allowedFeeTypes: raw.allowedFeeTypes ?? [],
    allowedTransferTypes: raw.allowedTransferTypes ?? [],
    fileAmountLimit: raw.fileAmountLimit,
  };
}
function mapSchoolingTransferInitResponse(
  raw: SchoolingTransferInitResponse,
): SchoolingTransferInitResponse {
  return {
    id: raw.id,
    schoolingFileId: raw.schoolingFileId,
    attachment: raw.attachment,
    transferMode: raw.transferMode,
    transferType: raw.transferType,
    amount: raw.amount,
    currency: raw.currency,
    status: raw.status,
    comment: raw.comment,
    executionDate: raw.executionDate,
    feeType: raw.feeType,
  };
}

function mapSchoolingTransferHistoryItem(
  raw: any,
): SchoolingTransferHistoryItem {
  return {
    id: raw.id,
    fileId: raw.fileId,
    fileRef: raw.fileRef,
    fileYear: raw.fileYear,
    transferType: raw.transferType,
    transferMode: raw.transferMode,
    transferAmount: raw.transferAmount,
    transferCurrency: raw.transferCurrency,
    transferDate: raw.transferDate,
    abtStatus: raw.abtStatus,
    feeType: raw.feeType ?? null,
    comment: raw.comment ?? null,
    swiftMessage: raw.swiftMessage ?? null,
    swiftStatus: raw.swiftStatus ?? null,
    rejectionReason: raw.rejectionReason ?? null,
  };
}

function mapSchoolingTransferHistoryResponse(
  raw: SchoolingTransferHistoryResponse,
): SchoolingTransferHistoryResponse {
  return {
    count: raw?.count ?? 0,
    data: (raw?.data ?? []).map(mapSchoolingTransferHistoryItem),
  };
}

function mapSchoolingFilesResponse(
  raw: SchoolingFilesResponse,
): SchoolingFilesResponse {
  return {
    count: raw?.count ?? 0,
    data: (raw?.data ?? []).map(mapSchoolingFile),
  };
}

function mapConversionTradeResponse(
  raw: ConversionTradeResponse,
): ConversionTradeResponse {
  return {
    convertedAmount: raw.convertedAmount,
  };
}

export async function fetchSchoolingFiles(): Promise<SchoolingFilesResponse> {
  const url = `${BASE_URL}/api/payment-means/schooling`;
  logApiCall("GET scholling Files", { url });

  try {
    const { data } = await api.get<SchoolingFilesResponse>(url);
    logApiResponse("GET scholling Files response (data.data)", data?.data);
    return mapSchoolingFilesResponse(data);
  } catch (err) {
    logApiError("GET scholling Files failed", err);
    throw err;
  }
}

/**
 * CONVERSION TRADE
 * GET /api/payment-means/schooling/{schoolingId}/conversion-trade
 */
export const fetchConversionTrade = async (
  params: ConversionTradeRequest,
): Promise<ConversionTradeResponse> => {
  const url = `${BASE_URL}/api/payment-means/schooling/${params.schoolingId}/conversion-trade`;
  logApiCall("GET scholling conversion-trade", { url, params });

  try {
    const { data } = await api.get<ConversionTradeResponse>(url, {
      params: {
        sourceCurrencyCode: params.sourceCurrencyCode,
        targetCurrencyCode: params.targetCurrencyCode,
        amount: params.amount,
      },
    });

    logApiResponse("GET scholling conversion-trade response (data)", data);
    return mapConversionTradeResponse(data);
  } catch (err) {
    logApiError("GET scholling conversion-trade failed", err);
    throw err;
  }
};

/**
 * INIT SCHOOLING TRANSFER
 * POST /api/payment-means/scooling-request/init
 */
export async function initSchoolingTransfer(
  body: SchoolingTransferInitRequest,
): Promise<SchoolingTransferInitResponse> {
  const url = `${BASE_URL}/api/payment-means/schooling-request/init`;

  logApiCall("POST schooling-request/init (body)", {
    ...body,
    attachment: body.attachment ? "[File/Blob]" : undefined,
  });

  try {
    const formData = new FormData();

    if (body.attachment) formData.append("attachment", body.attachment as any);
    formData.append("transferMode", body.transferMode);
    formData.append("transferType", body.transferType);
    formData.append("amount", String(body.amount));
    formData.append("currency", body.currency);
    if (body.comment) formData.append("comment", body.comment);
    formData.append("executionDate", body.executionDate);
    formData.append("feeType", body.feeType);
    formData.append("schoolingFileId", body.schoolingFileId);

    const { data } = await api.post<SchoolingTransferInitResponse>(
      url,
      formData,
      {
        headers: { "Content-Type": "multipart/form-data" },
      },
    );

    logApiResponse("POST scooling-request/init response (data)", data);

    return mapSchoolingTransferInitResponse(data);
  } catch (err) {
    logApiError("POST scooling-request/init failed", err);
    throw err;
  }
}

/**
 * CONFIRM SCHOOLING TRANSFER
 * POST /api/payment-means/scooling-request/confirm
 *
 * - For CHALLENGE: send challengeConfirmationValue (deviceId, challengeId, proof)
 * - For TOTP: send confirmationValue
 *
 * NOTE: SchoolingTransferConfirmRequest requires confirmationValue always.
 * For CHALLENGE we will force confirmationValue = "" if not provided.
 */
export async function confirmSchoolingTransfer(
  body: SchoolingTransferConfirmRequest,
): Promise<SchoolingTransferInitResponse> {
  if (!body?.requestId) {
    throw new Error("confirmSchoolingTransfer: requestId is required");
  }

  // ✅ default to CHALLENGE
  const confirmationMethod = (body.confirmationMethod ?? "CHALLENGE") as
    | "TOTP"
    | "CHALLENGE";

  // ✅ normalize payload (avoid sending wrong fields together)
  const normalized: SchoolingTransferConfirmRequest =
    confirmationMethod === "CHALLENGE"
      ? {
          ...body,
          confirmationMethod: "CHALLENGE",
          // keep confirmationValue required by type but allow empty string
          challengeConfirmationValue: body.challengeConfirmationValue,
        }
      : {
          ...body,
          confirmationMethod: "TOTP",
          confirmationValue: body.confirmationValue,
        };

  // ✅ validations
  if (confirmationMethod === "CHALLENGE") {
    // If your schooling confirm also has challengeConfirmationValue, validate it like billers:
    const v = (normalized as any).challengeConfirmationValue;
    if (!v?.deviceId || !v?.challengeId || !v?.proof) {
      throw new Error(
        "confirmSchoolingTransfer: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
      );
    }
  } else if (confirmationMethod === "TOTP") {
    if (
      !normalized.confirmationValue ||
      String(normalized.confirmationValue).trim().length === 0
    ) {
      throw new Error(
        "confirmSchoolingTransfer: confirmationValue is required for TOTP",
      );
    }
    // If you *also* have challengeConfirmationValue on this type, ensure it’s not sent:
    (normalized as any).challengeConfirmationValue = undefined;
  } else {
    throw new Error(
      `confirmSchoolingTransfer: unsupported confirmationMethod: ${String(confirmationMethod)}`,
    );
  }

  const url = `${BASE_URL}/api/payment-means/scooling-request/confirm`;

  console.log("=========== [API] confirmSchoolingTransfer ===========");
  console.log("➡️ endpoint:", "/api/payment-means/scooling-request/confirm");
  console.log("➡️ payload:", normalized);
  console.log("======================================================");

  logApiCall("POST scooling-request/confirm (body)", normalized);

  try {
    const { data } = await api.post<SchoolingTransferInitResponse>(
      url,
      normalized,
    );

    console.log(
      "[scholling.api] ✅ POST scooling-request/confirm response\n",
      JSON.stringify(data, null, 2),
    );

    return data;
  } catch (err) {
    logApiError("POST scooling-request/confirm failed", err);
    throw err;
  }
}

/**
 * SCHOOLING TRANSFERS HISTORY
 * GET /api/payment-means/schooling/transfers?schoolingFileId=...&page=1&limit=10
 */
export async function fetchSchoolingTransferHistory(
  schoolingFileId: string,
  page: number = 1,
  limit: number = 10,
): Promise<SchoolingTransferHistoryResponse> {
  const url = new URL(`${BASE_URL}/api/payment-means/schooling/transfers`);
  url.searchParams.set("schoolingFileId", String(schoolingFileId));
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  logApiCall("GET scholling transfers history", {
    url: url.toString(),
    schoolingFileId,
    page,
    limit,
  });

  try {
    const { data } = await api.get<SchoolingTransferHistoryResponse>(
      url.toString(),
    );

    // same style as bill-payments: log "data.data"
    logApiResponse(
      "GET scholling transfers history response (data.data)",
      data?.data,
    );

    return mapSchoolingTransferHistoryResponse(data);
  } catch (err) {
    logApiError("GET scholling transfers history failed", err);
    throw err;
  }
}
