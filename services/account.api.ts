import {
  AccountDetail,
  AccountMovementsResponse,
  AccountResponse,
  AddBeneficiaryInitBody,
  AddBeneficiaryInitResponse,
  AddBeneficiaryConfirmBody,
  AddBeneficiaryConfirmResponse,
  GetBeneficiariesResponse,
  TransferRequestInitBody,
  TransferRequestInitResponse,
  TransferRequestConfirmBody,
  TransferRequestConfirmResponse,
  ProductSubscriptionsResponse,
  TransferInitRequest,
  TransferInitResponse,
  TransferConfirmRequest,
  TransferConfirmResponse,
  TransferHistoryResponse,
  ExchangeRatesResponse,
  GetTransferRequestsParams,
  TransferInitChallengeBody,
  TransferInitCHALLENGEesponse,
  TransferConfirmWithCHALLENGEequest,
  BeneficiaryConfirmWithChallengeRequest,
  BeneficiaryConfirmResponse,
  Profile,
  User,
  Contact,
  UpdateAccountsBody,
} from "@/types/account.type";
import api from "./lib/axios";
import { BASE_URL } from "@/constants/base-url";
import { Buffer } from "buffer";

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
const logBaseUrl = () => {
  console.log("[API BASE URL]", api.defaults.baseURL);
};

/* -------------------------------------------------------------------------- */
/*                             Debug log helpers                              */
/* -------------------------------------------------------------------------- */

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[profile.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[profile.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

// ✅ you asked: log response with JSON.stringify(data.data, null, 2)
function logApiResponse(title: string, dataData: unknown) {
  console.log(`[profile.api] ✅ ${title}\n`, JSON.stringify(dataData, null, 2));
}

// Better axios error log (shows response.data if exists)
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[profile.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

export interface MovementsQueryParams {
  startDate?: string;
  endDate?: string;

  page?: number;
  limit?: number;

  minAmount?: number;
  maxAmount?: number;
}

// If your API response shape differs from Profile (e.g. snake_case), define a RawProfile type.
// For now, we’ll treat it as "Profile-like" coming from the API:
type RawProfile = {
  id?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  lasEventType?: string | null;
  lastEventAt?: string | null;
  contractId?: string | null;
  cli?: string | null;
  users?: RawUser[] | null;
};

type RawUser = {
  userId?: string | null;
  defaultUser?: string | null;
  subscription?: string | null;
  updatedAt?: string | null;
  lastDateConnexion?: string | null;
  contact?: RawContact | null;
  cin?: string | null;
  login?: string | null;
  mdp?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  deviceId?: string | null;
};

type RawContact = {
  mail?: string | null;
  telNumber?: string | null;
};

function mapContact(raw?: RawContact | null): Contact {
  return {
    mail: raw?.mail ?? null,
    telNumber: raw?.telNumber ?? null,
  };
}

function mapUser(raw: RawUser): User {
  return {
    userId: raw.userId ?? null,
    defaultUser: raw.defaultUser ?? null,
    subscription: raw.subscription ?? null,
    updatedAt: raw.updatedAt ?? null,
    lastDateConnexion: raw.lastDateConnexion ?? null,
    contact: mapContact(raw.contact),
    cin: raw.cin ?? null,
    login: raw.login ?? null,
    mdp: raw.mdp ?? null,
    firstName: raw.firstName ?? null,
    lastName: raw.lastName ?? null,
    deviceId: raw.deviceId ?? null,
  };
}

export function mapProfile(raw: RawProfile): Profile {
  return {
    id: raw.id ?? null,
    createdAt: raw.createdAt ?? null,
    updatedAt: raw.updatedAt ?? null,
    lasEventType: raw.lasEventType ?? null,
    lastEventAt: raw.lastEventAt ?? null,
    contractId: raw.contractId ?? null,
    cli: raw.cli ?? null,
    users: (raw.users ?? []).map(mapUser),
  };
}

/**
 * PROFILE
 * GET /api/contract/profile
 */
export async function getProfile(): Promise<Profile> {
  const url = `${BASE_URL}/api/contract/profile`;
  logApiCall("GET profile", { url });

  try {
    const { data } = await api.get<RawProfile>(url);
    // logApiResponse("GET profile response (data)", data);
    return mapProfile(data ?? {});
  } catch (err) {
    logApiError("GET profile failed", err);
    throw err;
  }
}

/* ------------------------------------------------------------------ */
/* Accounts                                                           */
/* ------------------------------------------------------------------ */
export const getAccounts = async (): Promise<AccountResponse> => {
  logBaseUrl();
  console.log("[API] Fetching accounts");

  const { data } = await api.get<AccountResponse>("/api/accounts");
  // logApiResponse("GET account response (data)", data);
  console.log("[API] Accounts fetched:", data.data?.length);
  // console.log("[API] Accounts:", data.data);
  return data;
};

export const getAccountDetail = async (
  accountId: string,
): Promise<AccountDetail> => {
  if (!accountId) {
    throw new Error("accountId is required");
  }

  logBaseUrl();
  console.log("[API] Fetching account details:", accountId);

  const { data } = await api.get<AccountDetail>(`/api/accounts/${accountId}`);

  return data;
};

export const getAccountMovements = async (
  accountId: string,
  params?: MovementsQueryParams,
): Promise<AccountMovementsResponse> => {
  if (!accountId) {
    throw new Error("accountId is required");
  }

  logBaseUrl();

  const queryParams: MovementsQueryParams = {
    limit: params?.limit ?? 10,
    page: params?.page,
    startDate: params?.startDate,
    endDate: params?.endDate,
    minAmount: params?.minAmount,   // ✅ add
    maxAmount: params?.maxAmount,   // ✅ add
  };

  // console.log("[API] Fetching movements", { accountId, queryParams });

  const { data } = await api.get<AccountMovementsResponse>(
    `/api/accounts/${accountId}/movements`,
    { params: queryParams },
  );

  // console.log("[API] Movements fetched:", data.data.length);
  return data;
};

/* ------------------------------------------------------------------ */
/* Beneficiaries                                                       */
/* ------------------------------------------------------------------ */
export const getBeneficiaries = async (): Promise<GetBeneficiariesResponse> => {
  logBaseUrl();
  console.log("[API] Fetching beneficiaries");

  const { data } = await api.get<GetBeneficiariesResponse>(
    "/api/payment-means/beneficiaries",
  );

  return data;
};

export const addBeneficiaryInit = async (
  body: AddBeneficiaryInitBody,
): Promise<AddBeneficiaryInitResponse> => {
  logBaseUrl();
  console.log("[API] addBeneficiaryInit", body);

  const { data } = await api.post<AddBeneficiaryInitResponse>(
    "/api/payment-means/beneficiaries/init",
    body,
  );

  return data;
};

export const confirmBeneficiary = async (
  body: AddBeneficiaryConfirmBody,
): Promise<AddBeneficiaryConfirmResponse> => {
  console.log("##########################################################");
  console.log("[API] confirmBeneficiary", body);
  console.log("##########################################################");

  logBaseUrl();

  const res = await api.post<AddBeneficiaryConfirmResponse>(
    "/api/payment-means/beneficiaries/confirm",
    body,
  );

  return res.data; // ✅ return only data
};

/* ------------------------------------------------------------------ */
/* Transfers                                                          */
/**
 * Initialize a transfer request
 */
export const transferInit = async (
  payload: TransferInitRequest,
): Promise<TransferInitResponse> => {
  const base: Record<string, any> = {
    executionDate: payload.executionDate,
    motif: payload.motif,
    amount: String(payload.amount),
    debtorAccountId: payload.debtorAccountId,
  };

  // ✅ correct field name for API
  if (payload.endExecutionDate) {
    base.endExecutionDate = payload.endExecutionDate;
  }

  // ✅ include frequency when present
  if (payload.frequency) {
    base.frequency = payload.frequency;
  }

  const body =
    "beneficiaryId" in payload
      ? { ...base, beneficiaryId: payload.beneficiaryId }
      : { ...base, creditorAccountId: payload.creditorAccountId };
  console.log("====================================");
  console.log("[TransferInit] body: inside api.account.ts transferinit", body);

  console.log("====================================");

  const { data } = await api.post<TransferInitResponse>(
    "/api/payment-means/transfer-requests/init",
    body,
  );

  return data;
};

/**
 * Confirm a transfer request (OTP)
 */
export const transferConfirm = async (
  payload: TransferConfirmRequest,
): Promise<TransferConfirmResponse> => {
  if (!payload?.requestId) {
    throw new Error("transferConfirm: requestId is required");
  }

  console.log("====================================");
  console.log(
    "🔵 [API] Confirming transfer request WITH OTP :",
    payload.requestId,
  );
  console.log("✅ PAYLOAD:");
  console.log(JSON.stringify(payload, null, 2));
  console.log("====================================");

  const { data } = await api.post<TransferConfirmResponse>(
    "/api/payment-means/transfer-requests/confirm",
    payload,
  );

  console.log("====================================");
  console.log("🟢 [API] transferConfirm RESULT:", payload.requestId);
  console.log("✅ RESPONSE:");
  console.log(JSON.stringify(data, null, 2));
  console.log("====================================");

  return data;
};

/**
 * Get transfer requests (history)
 */
export const getTransferRequests = async (
  params?: GetTransferRequestsParams,
): Promise<TransferHistoryResponse> => {
  // console.log("====================================");
  // console.log(
  //   "[API] Fetching transfer requests history\n",
  //   JSON.stringify(params, null, 2),
  // );

  // console.log("====================================");

  const { data } = await api.get<TransferHistoryResponse>(
    "/api/payment-means/transfer-requests",
    {
      params,
      // optional: avoid sending empty strings if you pass "" sometimes
      paramsSerializer: {
        serialize: (p) =>
          new URLSearchParams(
            Object.entries(p ?? {}).reduce<Record<string, string>>(
              (acc, [k, v]) => {
                if (v === undefined || v === null || v === "") return acc;
                acc[k] = String(v);
                return acc;
              },
              {},
            ),
          ).toString(),
      },
    },
  );

  return data;
};

/* ------------------------------------------------------------------ */
/* Product Subscriptions (Equipements)                                */
/* ------------------------------------------------------------------ */
export const getProductSubscriptions =
  async (): Promise<ProductSubscriptionsResponse> => {
    logBaseUrl();
    console.log("[API] Fetching product subscriptions");

    const { data } = await api.get<ProductSubscriptionsResponse>(
      "/api/contract/product-subscription",
    );

    console.log("[API] Product subscriptions fetched:", data.count);
    return data;
  };

/* ------------------------------------------------------------------ */
/* Exchange Rates                                                      */
/* ------------------------------------------------------------------ */
export const getExchangeRates = async (
  type: "" | "BBE" = "",
): Promise<ExchangeRatesResponse> => {
  logBaseUrl();
  console.log("[API] Fetching exchange rates", { type });

  const { data } = await api.get<ExchangeRatesResponse>(
    "/api/payment-means/exchange-rates",
    { params: { type } },
  );

  console.log("[API] Exchange rates fetched:", data.count);
  return data;
};

/* ------------------------------------------------------------------ */
/* Cancel Transfer                                                     */
/* ------------------------------------------------------------------ */

export const cancelTransferRequest = async (
  requestId: string,
): Promise<void> => {
  await api.patch<void>(
    `/api/payment-means/transfer-requests/${requestId}/cancel`,
  );
};

/* ------------------------------------------------------------------ */
/* Transfers - Challenge APIs                                          */
/* ------------------------------------------------------------------ */

/**
 * Init transfer transaction challenge (CHALLENGE)
 * POST /api/v1/auth/init-transaction-challenge
 */
export const transferInitChallenge = async (
  body: TransferInitChallengeBody,
): Promise<TransferInitCHALLENGEesponse> => {
  if (!body?.deviceId || !body?.requestId) {
    throw new Error(
      "transferInitChallenge: deviceId and requestId are required",
    );
  }

  // ensure correct constant
  const payload: TransferInitChallengeBody = {
    deviceId: body.deviceId,
    requestId: body.requestId,
    challengeType: "CHALLENGE",
  };

  console.log("[API] transferInitChallenge", payload);

  const { data } = await api.post<TransferInitCHALLENGEesponse>(
    "/api/v1/auth/init-transaction-challenge",
    payload,
  );

  return data;
};

/**
 * Confirm transfer request using CHALLENGE / PINCODE / TOTP
 * POST /api/payment-means/transfer-requests/confirm
 *
 * - For CHALLENGE: send challengeConfirmationValue (deviceId, challengeId, proof)
 * - For PINCODE/TOTP: send confirmationValue
 */
export const transferConfirmWithChallenge = async (
  payload: TransferConfirmWithCHALLENGEequest,
): Promise<TransferRequestConfirmResponse> => {
  if (!payload?.requestId) {
    throw new Error("transferConfirmWithChallenge: requestId is required");
  }

  // your type already forces this, but keep it for safety
  if (payload.confirmationMethod !== "CHALLENGE") {
    throw new Error(
      `transferConfirmWithChallenge: unsupported confirmationMethod: ${String(
        payload.confirmationMethod,
      )}`,
    );
  }

  const v = payload.challengeConfirmationValue;
  if (!v?.deviceId || !v?.challengeId || !v?.proof) {
    throw new Error(
      "transferConfirmWithChallenge: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
    );
  }

  console.log("=========== [API] transferConfirmWithChallenge ===========");
  console.log("➡️ endpoint:", "/api/payment-means/transfer-requests/confirm");
  console.log("➡️ payload:", payload);

  const { data } = await api.post<TransferRequestConfirmResponse>(
    "/api/payment-means/transfer-requests/confirm",
    payload,
  );

  console.log("✅ [API] transferConfirmWithChallenge response:", data);
  console.log("==========================================================");

  return data;
};

export const beneficiaryConfirmWithChallenge = async (
  payload: BeneficiaryConfirmWithChallengeRequest,
): Promise<BeneficiaryConfirmResponse> => {
  if (!payload?.requestId) {
    throw new Error("beneficiaryConfirmWithChallenge: requestId is required");
  }

  if (payload.confirmationMethod !== "CHALLENGE") {
    throw new Error(
      `beneficiaryConfirmWithChallenge: unsupported confirmationMethod: ${String(
        payload.confirmationMethod,
      )}`,
    );
  }

  const v = payload.challengeConfirmationValue;
  if (!v?.deviceId || !v?.challengeId || !v?.proof) {
    throw new Error(
      "beneficiaryConfirmWithChallenge: challengeConfirmationValue{deviceId,challengeId,proof} is required",
    );
  }

  console.log("=========== [API] beneficiaryConfirmWithChallenge ===========");
  console.log("➡️ endpoint:", "/api/payment-means/beneficiaries/confirm");
  console.log("➡️ payload:", payload);

  const { data } = await api.post<BeneficiaryConfirmResponse>(
    "/api/payment-means/beneficiaries/confirm",
    payload,
  );

  console.log("✅ [API] beneficiaryConfirmWithChallenge response:", data);
  console.log("============================================================");

  return data;
};

/* ------------------------------------------------------------------ */
/* Delete Beneficiary                                                  */
/* ------------------------------------------------------------------ */

export const deleteBeneficiaryRequest = async (
  beneficiaryId: string,
): Promise<void> => {
  await api.delete<void>(`/api/payment-means/beneficiaries/${beneficiaryId}`);
};


/**
 * Download transfer PDF document
 * GET /api/payment-means/docs/UNIT_TRANSFER
 */
// services/account.api.ts
export const getTransferPdf = async (
  transferId: string,
  reportType: "PDF" = "PDF"
): Promise<ArrayBuffer> => {
  console.log("====================================");
  console.log("[API] Downloading transfer PDF", { transferId, reportType });
  console.log("====================================");

  const { data } = await api.get("/api/payment-means/docs/UNIT_TRANSFER", {
    params: { reportType, transferId },
    responseType: "arraybuffer",
    headers: { Accept: "application/pdf" },
  });

  return data;
};

export const getTransferPdfBase64 = async (
  transferId: string,
  reportType: "PDF" = "PDF",
): Promise<string> => {
  const res = await api.get("/api/payment-means/docs/UNIT_TRANSFER", {
    params: { reportType, transferId },
    responseType: "arraybuffer",
  });

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};

export const getRechargeCartePdfBase64 = async (
  reloadId: string,
  reportType: "PDF" = "PDF",
): Promise<string> => {
  const config = {
    url: "/api/payment-means/cards/docs/CARD_RELOAD",
    method: "get" as const,
    params: { reportType, reloadId },
    responseType: "arraybuffer" as const,
  };

  console.log("[getRechargeCartePdfBase64] full URL:", api.getUri(config));
  console.log("[getRechargeCartePdfBase64] params:", config.params);

  const res = await api.request(config);

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};

export const getFacturePdfBase64 = async (
  paymentId: string,
  reportType: "PDF" = "PDF"
): Promise<string> => {
  const config = {
    url: "/api/payment-means/docs/PAYMENT_RECEIPT",
    method: "get" as const,
    params: { reportType, paymentId },
    responseType: "arraybuffer" as const,
  };

  console.log("[getFacturePdfBase64] full URL:", api.getUri(config));
  console.log("[getFacturePdfBase64] params:", config.params);

  const res = await api.request(config);

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};

export type AccountStatementReportType = "PDF" | "EXCEL";

export interface DownloadAccountStatementParams {
  accountId: string;
  startDate: string;
  endDate: string;
  reportType: AccountStatementReportType;
}

export const downloadAccountStatementBase64 = async (
  params: DownloadAccountStatementParams,
): Promise<string> => {
  console.log("[API] Downloading account statement", params);

  const res = await api.get("/api/accounts/docs/ACCOUNT_STATEMENT", {
    params: {
      id: params.accountId,
      startDate: params.startDate,
      endDate: params.endDate,
      reportType: params.reportType,
    },
    responseType: "arraybuffer",
  });

  const data: ArrayBuffer = res.data;
  const base64 = Buffer.from(new Uint8Array(data)).toString("base64");
  console.log("[API] Account statement downloaded, base64 length:", base64.length);
  return base64;
};

export const getAccountRibPdfBase64 = async (
  accountId: string,
  reportType: "PDF" = "PDF"
): Promise<string> => {
  const res = await api.get("/api/accounts/docs/RIB", {
    params: { reportType, id: accountId },
    responseType: "arraybuffer",
  });

  const data: ArrayBuffer = res.data;
  return Buffer.from(new Uint8Array(data)).toString("base64");
};



/**
 * Update account label + displayIndex
 * PUT /api/accounts/update
 * Body: [{ accountId, displayIndex, accountLabel }]
 * Return: 204
 */
export const updateAccounts = async (body: UpdateAccountsBody): Promise<void> => {
  const mapped = body.map(({ accountId, ...rest }) => ({
    id: accountId,
    ...rest,
  }));
  console.log("[API] updateAccounts body:", JSON.stringify(mapped));
  await api.put("/api/accounts/update", mapped);
};



/* ------------------------------------------------------------------ */
/* FCM Token                                                           */
/* ------------------------------------------------------------------ */
export const patchFcmToken = async (fcmToken: string): Promise<void> => {
  console.log("[API] PATCH fcm-token", { fcmToken: fcmToken.slice(0, 20) + "..." });
  await api.patch("/api/alerts/fcm-token", { fcmToken });
};