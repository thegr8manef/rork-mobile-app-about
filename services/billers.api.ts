import { Biller, BillerContract, BillPayment } from "@/types/billers";
import api from "./lib/axios";
import {
  PaymentConfirmResponse,
  PaymentInitResponse,
} from "@/types/bill-payment-init.types";
import { BillApiModel } from "@/types/bills.types";
import { BASE_URL } from "@/constants/base-url";
import type {
  BillersApiResponse,
  BillPaymentsApiResponse,
  ContractsApiResponse,
  SearchBillsApiResponse,
  SearchBillsParams,
  InitBillPaymentRequest,
  ConfirmBillPaymentRequest,
} from "@/types/billers.type";

/* -------------------------------------------------------------------------- */
/*                             Debug log helpers                              */
/* -------------------------------------------------------------------------- */

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[billers.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[billers.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

// ✅ you asked: log response with JSON.stringify(data.data, null, 2)
function logApiResponse(title: string, dataData: unknown) {
  console.log(`[billers.api] ✅ ${title}\n`, JSON.stringify(dataData, null, 2));
}

// Better axios error log (shows response.data if exists)
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[billers.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

/* -------------------------------------------------------------------------- */
/*                               Mappers (UI)                                 */
/* -------------------------------------------------------------------------- */

function mapBiller(raw: BillersApiResponse["data"][number]): Biller {
  return {
    id: raw.id,
    billerLabel: raw.label,
    billerType: raw.type,
    billerCategory: raw.category,
    billerIcon: raw.iconUrl,
    clientIdentityRequired: raw.clientIdentityRequired,
    enabled: raw.enabled,
    searchCriteria: raw.searchCriteria,
  };
}

function mapContract(
  raw: ContractsApiResponse["data"][number],
): BillerContract {
  return {
    id: raw.id,
    billerId: raw.billerId,
    label: raw.label,
    searchCriterias: raw.searchCriterias,
    isFavorite: raw.isFavorite,
  };
}

function mapPayment(raw: BillPaymentsApiResponse["data"][number]): BillPayment {
  const status = raw.billPaymentStatus ?? raw.transactionStatus ?? "INIT";

  return {
    id: raw.id,
    serviceType: raw.serviceType ?? null,
    transactionCode: raw.transactionCode ?? null,
    transactionStatus: status,
    customerId: raw.customerId ?? "",
    billerId: raw.billerId,
    objectId: raw.objectId ?? "",
    objectReference: raw.objectReference ?? "",
    billerAuthIds: raw.billerAuthIds ?? [],
    rejectionReason: raw.rejectionReason ?? null,
    transactionReference: raw.transactionReference ?? null,
    originalAmount: String(raw.originalAmount ?? "0"),
    paymentAmount: String(raw.paymentAmount ?? "0"),
    taxAmount: raw.taxAmount != null ? String(raw.taxAmount) : null,
    discount: raw.discount != null ? String(raw.discount) : null,
    paymentDate: raw.paymentDate,
    sourceAccount: raw.sourceAccount ?? null,
    destinationAccount: raw.destinationAccount,
    paymentReceipt: raw.paymentReceipt ?? "{}",
    paymentCanal: raw.paymentCanal ?? null,
    paymentMode: raw.paymentMode,
    paymentMean: raw.paymentMean ?? "",
    clicToPayData: raw.clicToPayData ?? null,
    requestedAmount: String(raw.requestedAmount ?? "0"),
  };
}

function mapBill(raw: BillApiModel): BillApiModel {
  return {
    id: raw.id,
    biller: raw.biller,
    billerAuthIds: raw.billerAuthIds,
    objectRef: raw.objectRef,
    description: raw.description,
    objectOriginalAmount: raw.objectOriginalAmount,
    objectAmountToPay: raw.objectAmountToPay,
    amountDecimals: raw.amountDecimals,
    amountCurrency: raw.amountCurrency,
    paymentStatus: raw.paymentStatus,
    requestedAmount: raw.requestedAmount,
    objectDate: raw.objectDate,
    acceptedPaymentModes: raw.acceptedPaymentModes,
  };
}

/* -------------------------------------------------------------------------- */
/*                            API (Axios: api lib)                             */
/* -------------------------------------------------------------------------- */
/**
 * IMPORTANT:
 * - accessToken is NOT passed here anymore.
 * - Your `api` instance should attach Authorization header (interceptor) like in useCards.
 */

/**
 * BILLERS
 * GET /api/payment-means/bill-payments/billers
 */
export async function fetchAllBillersApi(): Promise<Biller[]> {
  const url = `${BASE_URL}/api/payment-means/bill-payments/billers`;
  logApiCall("GET billers", { url });

  try {
    const { data } = await api.get<BillersApiResponse>(url);
    logApiResponse("GET billers response (data.data)", data?.data);
    return (data?.data ?? []).map(mapBiller);
  } catch (err) {
    logApiError("GET billers failed", err);
    throw err;
  }
}

/**
 * CONTRACTS
 * GET /api/payment-means/bill-payments/contracts?isFavorite=true|false
 */
export async function fetchBillerContractsApi(
  isFavorite?: boolean,
): Promise<BillerContract[]> {
  const url = new URL(`${BASE_URL}/api/payment-means/bill-payments/contracts`);
  if (isFavorite !== undefined)
    url.searchParams.set("isFavorite", String(isFavorite));

  logApiCall("GET contracts", { url: url.toString(), isFavorite });

  try {
    const { data } = await api.get<ContractsApiResponse>(url.toString());
    logApiResponse("GET contracts response (data.data)", data?.count);
    return (data?.data ?? []).map(mapContract);
  } catch (err) {
    logApiError("GET contracts failed", err);
    throw err;
  }
}

/**
 * PAYMENTS
 * GET /api/payment-means/bill-payments?page=1&limit=10
 */
export async function getAllPaymentsApi(
  page: number = 0,
  limit: number = 10,
): Promise<BillPayment[]> {
  const url = new URL(`${BASE_URL}/api/payment-means/bill-payments`);
  url.searchParams.set("page", String(page));
  url.searchParams.set("limit", String(limit));

  logApiCall("GET bill-payments", { url: url.toString(), page, limit });

  try {
    const { data } = await api.get<BillPaymentsApiResponse>(url.toString());
    logApiResponse("GET bill-payments response (data.data)", data?.count);
    return (data?.data ?? []).map(mapPayment);
  } catch (err) {
    logApiError("GET bill-payments failed", err);
    throw err;
  }
}

/**
 * INIT BILL PAYMENT
 * POST /api/payment-means/bill-payments/init
 */
export async function initBillPaymentApi(
  body: InitBillPaymentRequest,
): Promise<PaymentInitResponse> {
  const url = `${BASE_URL}/api/payment-means/bill-payments/init`;
  logApiCall("POST bill-payments/init (body)", body);

  try {
    const { data } = await api.post<PaymentInitResponse>(url, body);
    // for this endpoint there is no data.data usually, so log full response
    console.log(
      "[billers.api] ✅ POST bill-payments/init response\n",
      JSON.stringify(data, null, 2),
    );
    return data;
  } catch (err) {
    logApiError("POST bill-payments/init failed", err);
    throw err;
  }
}
/**
 * CONFIRM BILL PAYMENT
 * POST /api/payment-means/bill-payments/confirm
 */
// export async function confirmBillPaymentApi(
//   body: ConfirmBillPaymentRequest
// ): Promise<PaymentConfirmResponse> {
//   const url = `${BASE_URL}/api/payment-means/bill-payments/confirm`;
//   logApiCall("POST bill-payments/confirm (body)", body);

//   try {
//     const { data } = await api.post<PaymentConfirmResponse>(url, body);
//     console.log("[billers.api] ✅ POST bill-payments/confirm response\n", JSON.stringify(data, null, 2));
//     return data;
//   } catch (err) {
//     logApiError("POST bill-payments/confirm failed", err);
//     throw err;
//   }
// }

/**
 * SEARCH BILLS
 * GET /api/payment-means/bill-payments/bills?billerId=...&searchCriteriaValue=...&searchCriteriaLabel=...
 */
export async function getBills(
  params: SearchBillsParams,
): Promise<BillApiModel[]> {
  const url = new URL(`${BASE_URL}/api/payment-means/bill-payments/bills`);
  url.searchParams.set("billerId", params.billerId);
  url.searchParams.set("searchCriteriaValue", params.searchCriteriaValue);
  url.searchParams.set("searchCriteriaLabel", params.searchCriteriaLabel);

  if (params.reloadAmount?.trim())
    url.searchParams.set("reloadAmount", params.reloadAmount.trim());
  if (params.contractLabel?.trim())
    url.searchParams.set("contractLabel", params.contractLabel.trim());
  if (params.isFavorite !== undefined) {
    url.searchParams.set("isFavorite", String(params.isFavorite));
  }
  logApiCall("GET bills (search)", { url: url.toString(), params });

  try {
    const { data } = await api.get<SearchBillsApiResponse>(url.toString());
    logApiResponse("GET bills response (data.data)", data?.count);
    return (data?.data ?? []).map(mapBill);
  } catch (err) {
    logApiError("GET bills failed", err);
    throw err;
  }
}

/**
 * CONFIRM BILL PAYMENT
 * POST /api/payment-means/bill-payments/confirm
 *
 * - For CHALLENGE: send challengeConfirmationValue (deviceId, challengeId, proof)
 * - For TOTP: send confirmationValue
 *
 * NOTE: ConfirmBillPaymentRequest requires confirmationValue always.
 * For CHALLENGE we will force confirmationValue = "" if not provided.
 */
export async function confirmBillPaymentApi(
  body: ConfirmBillPaymentRequest,
): Promise<PaymentConfirmResponse> {
  if (!body?.requestId) {
    throw new Error("confirmBillPaymentApi: requestId is required");
  }

  // ✅ default to CHALLENGE (your challenge screens use this)
  const confirmationMethod = (body.confirmationMethod ?? "CHALLENGE") as
    | "TOTP"
    | "CHALLENGE";

  // ✅ normalize payload (avoid sending wrong fields together)
  // Keep the SAME type shape: ConfirmBillPaymentRequest
  const normalized: ConfirmBillPaymentRequest =
    confirmationMethod === "CHALLENGE"
      ? {
          ...body,
          confirmationMethod: "CHALLENGE",
          // CHALLENGE uses challengeConfirmationValue
          challengeConfirmationValue: body.challengeConfirmationValue,
          // confirmationValue is required by type -> keep it but empty string if missing
        }
      : {
          ...body,
          confirmationMethod: "TOTP",
          // TOTP uses confirmationValue only
          confirmationValue: body.confirmationValue,
          challengeConfirmationValue: undefined,
        };

  // ✅ validations
  if (confirmationMethod === "CHALLENGE") {
    const v = normalized.challengeConfirmationValue;
    if (!v?.deviceId || !v?.challengeId || !v?.proof) {
      throw new Error(
        "confirmBillPaymentApi: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
      );
    }
  } else if (confirmationMethod === "TOTP") {
    if (
      !normalized.confirmationValue ||
      String(normalized.confirmationValue).trim().length === 0
    ) {
      throw new Error(
        "confirmBillPaymentApi: confirmationValue is required for TOTP",
      );
    }
  } else {
    throw new Error(
      `confirmBillPaymentApi: unsupported confirmationMethod: ${String(
        confirmationMethod,
      )}`,
    );
  }

  const url = `${BASE_URL}/api/payment-means/bill-payments/confirm`;

  console.log("=========== [API] confirmBillPaymentApi ===========");
  console.log("➡️ endpoint:", "/api/payment-means/bill-payments/confirm");
  console.log("➡️ payload:", normalized);
  console.log("===================================================");

  logApiCall("POST bill-payments/confirm (body)", normalized);

  try {
    const { data } = await api.post<PaymentConfirmResponse>(url, normalized);

    console.log(
      "[billers.api] ✅ POST bill-payments/confirm response\n",
      JSON.stringify(data, null, 2),
    );
    return data;
  } catch (err) {
    logApiError("POST bill-payments/confirm failed", err);
    throw err;
  }
}
/**
 * BILLERS
 * DELETE /api/payment-means//bill-payments/favorites/{billersId}
 */
export async function DeleteFavoriteBillersPaymentApi(
  contaractId: string,
): Promise<any> {
  const url = `${BASE_URL}/api/payment-means/bill-payments/favorites/${contaractId}`;
  logApiCall("Delete billers", { url });

  try {
    const { data } = await api.delete<any>(url);
    logApiResponse("Delete billers response (data.data)", data?.data);
    return (data?.data ?? []).map(mapBiller);
  } catch (err) {
    logApiError("Delete billers failed", err);
    throw err;
  }
}

/**
 * BILLERS
 * DELETE /api/payment-means//bill-payments/contracts/${contaractId}
 */
export async function DeleteContractBillersPaymentApi(
  contractId: string,
): Promise<void> {
  const url = `${BASE_URL}/api/payment-means/bill-payments/contracts/${contractId}`;
  logApiCall("Delete contract", { url, contractId });

  try {
    const response = await api.delete(url);

    console.log(
      "[billers.api] ✅ Delete contract response",
      JSON.stringify(
        {
          status: response.status,
          data: response.data,
        },
        null,
        2,
      ),
    );

    return;
  } catch (err) {
    logApiError("Delete contract failed", err);
    throw err;
  }
}

/**
 * BILLERS
 * Put /api/payment-means/bill-payments/favorites/{contaractId}
 */
export async function ToggleFavoriteBillersPaymentApi(
  contaractId: string,
  isFavorite: boolean,
): Promise<any> {
  const url = new URL(
    `${BASE_URL}/api/payment-means/bill-payments/favorites/${contaractId}`,
  );
  url.searchParams.set("isFavorite", String(isFavorite));

  logApiCall("PATCH favoris", { url: url.toString(), contaractId, isFavorite });

  try {
    const { data } = await api.patch<SearchBillsApiResponse>(url.toString());
    logApiResponse("PATCH favoris response (data.data)", data?.data);
    return (data?.data ?? []).map(mapBill);
  } catch (err) {
    logApiError("PATCH favoris failed", err);
    throw err;
  }
}
