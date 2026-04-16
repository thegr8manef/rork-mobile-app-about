export interface ClaimResponse {
  count: number;
  data: Claim[];
}

export interface Claim {
  id: string;
  accountId: string;
  incidentDate: string;
  claimSubject: string;
  description: string;
  category: string;
  categoryLabel: string;
  subCategory: string | null;
  subCategoryLabel: string | null;
  status: "PENDING" | "EXECUTED" | "REJECTED";
  creationDate: string;
  lastUpdate: string;
  deleted: boolean;
  notificationChannel: "EMAIL" | "SMS";
  notificationCoordinates: string;
  abtResponse: string | null;
  abtResponseDate: string | null;
  attachments: ClaimAttachment[];
  reference: string | null;
}

export interface ClaimAttachment {
  id: string;
  name: string;
  uploadedDate: string;
}

export interface CreateClaimBody {
  accountId: string;
  incidentDate?: string;
  claimSubject: string;
  description: string;
  categoryId: string;
  type: string;
  attachments?: File[];
}

export interface ClaimFilters {
  status?: "PENDING" | "EXECUTED" | "REJECTED";
  page?: number;
  limit?: number;
}
