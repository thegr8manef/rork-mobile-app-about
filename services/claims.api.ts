import { BASE_URL } from "@/constants/base-url";
import api from "./lib/axios";
import {
  ClaimResponse,
  Claim,
  CreateClaimBody,
  ClaimFilters,
} from "@/types/claim.type";

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[claims.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[claims.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

// ✅ you asked: log response with JSON.stringify(data.data, null, 2)
function logApiResponse(title: string, dataData: unknown) {
  console.log(`[claims.api] ✅ ${title}\n`, JSON.stringify(dataData, null, 2));
}

// Better axios error log (shows response.data if exists)
function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[claims.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}
export const getClaims = async (
  filters?: ClaimFilters,
): Promise<ClaimResponse> => {
  const params = new URLSearchParams();
  if (filters?.page) params.append("page", String(filters.page));
  if (filters?.limit) params.append("limit", String(filters.limit));
  if (filters?.status) params.append("status", filters.status);
  const { data } = await api.get<ClaimResponse>(
    `${BASE_URL}/api/claims?${params.toString()}`,
  );
  logApiCall(
    "GET claims params",
    `${BASE_URL}/api/claims?${params.toString()}`,
  );
  logApiResponse("GET claims response (data.data)", data?.count);

  return data;
};

export const getClaimById = async (claimId: string): Promise<Claim> => {
  const { data } = await api.get<Claim>(`${BASE_URL}/api/claims/${claimId}`);
  logApiResponse("get claims by ID", data);
  return data;
};

export const createClaim = async (body: CreateClaimBody): Promise<Claim> => {
  const formData = new FormData();

  formData.append("accountId", body.accountId);
  if (body.incidentDate) {
    formData.append("incidentDate", body.incidentDate);
  }
  formData.append("claimSubject", body.claimSubject);
  formData.append("description", body.description);
  formData.append("categoryId", body.categoryId);
  formData.append("type", body.type);
  if (body.attachments && body.attachments.length > 0) {
    body.attachments.forEach((file) => {
      formData.append("attachments", file as any);
    });
  }

  const { data } = await api.post<Claim>(`${BASE_URL}/api/claims`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  //logApiResponse(`Create claims `, data);

  return data;
};

export const downloadClaimAttachment = async (
  claimId: string,
  attachmentId: string,
): Promise<string> => {
  const { data } = await api.get<string>(
    `${BASE_URL}/${claimId}/attachments/${attachmentId}/download`,
    {
      responseType: "text",
    },
  );
  return data;
};
