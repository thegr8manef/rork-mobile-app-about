// services/edocs.api.ts
import api from "./lib/axios";
import { BASE_URL } from "@/constants/base-url";

function logApiCall(title: string, payload?: unknown) {
  if (payload === undefined) {
    console.log(`\n[edocs.api] ▶ ${title}`);
    return;
  }
  console.log(`\n[edocs.api] ▶ ${title}\n`, JSON.stringify(payload, null, 2));
}

function logApiResponse(title: string, dataData: unknown) {
  console.log(`[edocs.api] ✅ ${title}\n`, JSON.stringify(dataData, null, 2));
}

function logApiError(title: string, err: any) {
  const payload = err?.response?.data ?? err?.message ?? err;
  console.log(`[edocs.api] ❌ ${title}\n`, JSON.stringify(payload, null, 2));
}

export type DocumentType =
  | "RELEVE_COMPTE"
  | "RELEVE_ANNUEL_COMMISSIONS"
  | "AVIS_DEBIT"
  | "AVIS_CREDIT";

export interface ApiDocumentItem {
  id: string;
  docType: DocumentType;
  docNumber: string | null;
  accountId: string;
  accountNumber: string;
  extension: string;
  documentCustomerCode: string | null;
  documentBranchCode: string;
  documentDate: string;
}

export interface DocumentResult {
  id: string;
  name: string;
  type: DocumentType;
  date: string;
  accountNumber: string;
  extension: string;
  branchCode: string;
}

export type DocumentsApiResponse = {
  count: number;
  data: ApiDocumentItem[];
};

export type GetDocumentsParams = {
  accountId: string;
  documentType: DocumentType;
  startDate?: string;
  endDate?: string;
};

const YMD_REGEX = /^\d{4}-\d{2}-\d{2}$/;

function assertYmd(name: string, value?: string) {
  if (value === undefined || value === null || value === "") return;
  if (!YMD_REGEX.test(value)) {
    throw new Error(`[edocs.api] ${name} must be yyyy-MM-dd, got: ${value}`);
  }
}

function formatDocumentName(doc: ApiDocumentItem): string {
  const typeLabels: Record<DocumentType, string> = {
    RELEVE_COMPTE: "Relevé de compte",
    RELEVE_ANNUEL_COMMISSIONS: "Relevé annuel commissions",
    AVIS_DEBIT: "Avis de débit",
    AVIS_CREDIT: "Avis de crédit",
  };

  const dateFormatted = new Date(doc.documentDate).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return `${typeLabels[doc.docType]} - ${dateFormatted}`;
}

function mapDocument(raw: ApiDocumentItem): DocumentResult {
  return {
    id: raw.id,
    name: formatDocumentName(raw),
    type: raw.docType,
    date: raw.documentDate,
    accountNumber: raw.accountNumber,
    extension: raw.extension,
    branchCode: raw.documentBranchCode,
  };
}

export async function getAccountDocumentsApi(
  params: GetDocumentsParams,
): Promise<{ count: number; data: DocumentResult[] }> {
  assertYmd("startDate", params.startDate);
  assertYmd("endDate", params.endDate);

 

  logApiCall("GET documents", { url: `${BASE_URL}/api/accounts/documents`, params });

  try {
    const { data } = await api.get<DocumentsApiResponse>(`${BASE_URL}/api/accounts/documents`, {
          params: {
            accountId: params.accountId,
            documentType: params.documentType,
            startDate: params.startDate,
            endDate: params.endDate,
          },
    });
    logApiResponse("GET documents response", data);
    return {
      count: data?.count ?? 0,
      data: (data?.data ?? []).map(mapDocument),
    };
  } catch (err) {
    logApiError("GET documents failed", err);
    throw err;
  }
}

export type DownloadDocumentParams = {
  docId: string;
};

export async function downloadAccountDocumentApi(
  params: DownloadDocumentParams,
): Promise<string> {
  const url = `${BASE_URL}/api/accounts/documents/${params.docId}/download`;

  logApiCall("GET document download", { url, params });

  try {
    const { data } = await api.get<string>(url, {
      headers: {
        "Content-Type": "application/octet-stream",
      },
    });

    logApiResponse("GET document download success", { length: data?.length });
    return data;
  } catch (err) {
    logApiError("GET document download failed", err);
    throw err;
  }
}
