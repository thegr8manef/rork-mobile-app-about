import {
  SavingPlan,
  SavingPlansResponse,
  CreateSavingPlanRequest,
  UpdateSavingPlanRequest,
  GlobalSavingPlanResponse,
  GlobalSavingPlanConfirmRequest,
} from "@/types/saving-plan.type";
import api from "./lib/axios";
import { BASE_URL } from "@/constants/base-url";
import { AxiosError, AxiosResponse } from "axios";

export type CallType = "CREATING" | "UPDATING";
export interface ResignSavingPlanRequest {
  savingsAccountId: string;
  cardId: string;
  savingsPlanStatus: "RE";
}
function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[savingPlan.api] ▶ ${title}`);
    return;
  }
  console.log(
    `\n[savingPlan.api] ▶ ${title}\n`,
    JSON.stringify(payload, null, 2),
  );
}

function logApiResponse(title: string, dataData: unknown) {
  console.log(
    `[savingPlan.api] ✅ ${title}\n`,
    JSON.stringify(dataData, null, 2),
  );
}

function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(
    `[savingPlan.api] ❌ ${title}\n`,
    JSON.stringify(payload, null, 2),
  );
}

export const getSavingPlans = async (): Promise<SavingPlansResponse> => {
  //logBaseUrl();
  console.log("[API] Fetching saving plans");

  const { data } = await api.get<SavingPlansResponse>(
    "/api/accounts/savings-plan",
  );

  console.log("[API] Saving plans fetched:", data.data);
  return data;
};

export async function initSavingPlansGlobal(
  body: CreateSavingPlanRequest,
  callType: CallType,
  savingPlanId?: string,
): Promise<GlobalSavingPlanResponse> {
  const isCreating = callType === "CREATING";
  const isUpdating = callType === "UPDATING";

  if (!isCreating && !isUpdating) {
    throw new Error(
      `[initSavingPlansGlobal] Unsupported callType: ${String(callType)}`,
    );
  }

  if (isUpdating && !savingPlanId) {
    throw new Error(
      "[initSavingPlansGlobal] savingPlanId is required when callType is UPDATING",
    );
  }

  const url = isCreating
    ? `${BASE_URL}/api/accounts/savings-plan/init`
    : `${BASE_URL}/api/accounts/savings-plan/${encodeURIComponent(String(savingPlanId))}/init`;

  const headers = { "Content-Type": "application/json" as const };

  // Helpful for debugging without flooding logs with huge payloads
  logApiCall("INIT saving-plan (json)", {
    url,
    callType,
    savingPlanId: savingPlanId ?? null,
    body: {
      ...body,
      // if you ever log sensitive fields, mask them here
      // cardId: body.cardId ? "***" : undefined,
    },
  });

  try {
    const request: Promise<AxiosResponse<GlobalSavingPlanResponse>> = isCreating
      ? api.post(url, body, { headers })
      : api.patch(url, body, { headers });

    const { data } = await request;

    logApiResponse("INIT saving-plan response (data)", data);
    return data;
  } catch (e: unknown) {
    const err = e as AxiosError<any>;

    // Provide richer context for troubleshooting
    logApiError("INIT saving-plan failed", {
      message: err.message,
      url,
      callType,
      savingPlanId: savingPlanId ?? null,
      status: err.response?.status,
      response: err.response?.data,
    });

    // Re-throw original error to keep existing behavior
    throw e;
  }
}

export async function confirmSavingPlansGlobal(
  body: GlobalSavingPlanConfirmRequest,
  callType: CallType,
  savingPlanId?: string,
  accountId?: string,
): Promise<SavingPlan> {
  if (!body?.requestId)
    throw new Error("SavingPlansCreation: requestId is required");

  const confirmationMethod = (body.confirmationMethod ?? "CHALLENGE") as
    | "TOTP"
    | "CHALLENGE";

  const normalized: GlobalSavingPlanConfirmRequest =
    confirmationMethod === "CHALLENGE"
      ? {
          ...body,
          confirmationMethod: "CHALLENGE",
          challengeConfirmationValue: body.challengeConfirmationValue,
        }
      : {
          ...body,
          confirmationMethod: "TOTP",
          confirmationValue: body.confirmationValue,
        };

  if (confirmationMethod === "CHALLENGE") {
    const v = normalized.challengeConfirmationValue;
    if (!v?.deviceId || !v?.challengeId || !v?.proof) {
      throw new Error(
        "confirmSavingPlans: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
      );
    }
  } else {
    if (
      !normalized.confirmationValue ||
      String(normalized.confirmationValue).trim().length === 0
    ) {
      throw new Error(
        "confirmSavingPlans: confirmationValue is required for TOTP",
      );
    }
    (normalized as any).challengeConfirmationValue = undefined;
  }

  let url = `${BASE_URL}/api/accounts/savings-plan/confirm`;
  if (callType !== "CREATING") {
    url = `${BASE_URL}/api/accounts/savings-plan/${savingPlanId}/confirm${
      accountId ? `?accountId=${accountId}` : ""
    }`;
  }

  logApiCall("CONFIRM saving-plan (body)", {
    url,
    callType,
    savingPlanId,
    accountId,
    normalized,
  });

  try {
    let data: SavingPlan;

    if (callType === "CREATING") {
      ({ data } = await api.post<SavingPlan>(url, normalized));
    } else {
      ({ data } = await api.patch<SavingPlan>(url, normalized));
    }

    logApiResponse("CONFIRM saving-plan response (data)", data);
    return data;
  } catch (err) {
    logApiError("CONFIRM saving-plan failed", err);
    throw err;
  }
}

export async function initSavingPlansResign(
  body: ResignSavingPlanRequest,
  savingPlanId?: string,
): Promise<SavingPlan> {
  const url = `${BASE_URL}/api/accounts/savings-plan/${savingPlanId}/resign/init`;

  logApiCall("INIT saving-plan (json)", { url, savingPlanId, body });

  try {
    // ✅ send JSON (not multipart)
    const { data } = await api.patch<any>(url, body, {
      headers: { "Content-Type": "application/json" },
    });

    logApiResponse("INIT saving-plan response (data)", data);
    return data;
  } catch (err) {
    logApiError("INIT saving-plan failed", err);
    throw err;
  }
}

export async function confirmSavingPlansResign(
  body: GlobalSavingPlanConfirmRequest,
  savingPlanId?: string,
): Promise<SavingPlan> {
  const confirmationMethod = (body.confirmationMethod ?? "CHALLENGE") as
    | "TOTP"
    | "CHALLENGE";

  const normalized: GlobalSavingPlanConfirmRequest =
    confirmationMethod === "CHALLENGE"
      ? {
          ...body,
          confirmationMethod: "CHALLENGE",
          challengeConfirmationValue: body.challengeConfirmationValue,
        }
      : {
          ...body,
          confirmationMethod: "TOTP",
          confirmationValue: body.confirmationValue,
        };

  if (confirmationMethod === "CHALLENGE") {
    const v = normalized.challengeConfirmationValue;
    if (!v?.deviceId || !v?.challengeId || !v?.proof) {
      throw new Error(
        "confirmSavingPlans: challengeConfirmationValue{deviceId,challengeId,proof} is required for CHALLENGE",
      );
    }
  } else {
    if (
      !normalized.confirmationValue ||
      String(normalized.confirmationValue).trim().length === 0
    ) {
      throw new Error(
        "confirmSavingPlans: confirmationValue is required for TOTP",
      );
    }
    (normalized as any).challengeConfirmationValue = undefined;
  }

  const url = `${BASE_URL}/api/accounts/savings-plan/${savingPlanId}/resign/confirm`;

  logApiCall("CONFIRM saving-plan (body)", {
    url,
    savingPlanId,
    normalized,
  });

  try {
    const { data } = await api.patch<SavingPlan>(url, normalized);

    logApiResponse("CONFIRM saving-plan response (data)", data);
    return data;
  } catch (err) {
    logApiError("CONFIRM saving-plan failed", err);
    throw err;
  }
}
