/**
 * ============================================================
 * Term Deposits APIs
 * ============================================================
 */

/* -------------------------------------------------------------------------- */
/*                             Debug log helpers                              */
/* -------------------------------------------------------------------------- */

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[deposite.api] ▶ ${title}`);
    return;
  }
  console.log(
    `\n[deposite.api] ▶ ${title}\n`,
    JSON.stringify(payload, null, 2),
  );
}

// ✅ you asked: log response with JSON.stringify(data.data, null, 2)
function logApiResponse(title: string, dataData: unknown) {
  console.log(
    `[deposite.api] ✅ ${title}\n`,
    JSON.stringify(dataData, null, 2),
  );
}

// Better axios error log (shows response.data if exists)
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[profile.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

import { DepositResponse } from "@/types/deposite.type";
import api from "./lib/axios";

/**
 * Get all term deposits for the customer
 *
 * GET /api/financial-products/term-deposits
 */
export const getTermDeposits = async (): Promise<DepositResponse> => {
  console.log("[API] Fetching term deposits list");
  const { data } = await api.get<DepositResponse>(
    "/api/financial-products/term-deposits",
  );

  console.log("[API] Term deposits fetched:", data.data);
  logApiResponse("GET deposits response (data)", data);

  return data;
};

/**
 * Get term deposit details by deposit ID
 *
 * GET /api/financial-products/term-deposits/{depositId}
 */
export const getTermDepositDetails = async (
  depositId: string,
): Promise<DepositResponse["data"][0]> => {
  console.log("[API] Fetching term deposit details:", depositId);

  const { data } = await api.get<DepositResponse["data"][0]>(
    `/api/financial-products/term-deposits/${depositId}`,
  );

  return data;
};
