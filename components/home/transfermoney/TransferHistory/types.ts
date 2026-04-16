// components/home/transfermoney/TransferHistory/types.ts
import type { GetTransferRequestsParams, TransferRequestStatus } from "@/types/account.type";

export type TransferTypeUI = "ponctuel" | "permanent";
export type LocalSort = "executionDateDesc" | "executionDateAsc";

export type FiltersDraft = {
  selectedMonth: string;
  minAmount: string;
  maxAmount: string;
  status?: string;
  sort?: GetTransferRequestsParams["sort"];
  order?: GetTransferRequestsParams["order"];
  // ✅ Backend type filter (independent from UI toggle)
  requestType?: GetTransferRequestsParams["type"]; // "DEFERRED" | "PERMANENT" | "UNIT"
  // ✅ Convenience preset (maps to type + status)
  preset?: "all" | "pending" | "deferredCanceled" | "deferredRejected";
  startDate: Date | null;
  endDate: Date | null;
  localSort?: LocalSort;
};

export type UITransfer = {
  id: string;

  displayTitle: string;
  displaySubtitle?: string;

  executionDateISO: string;
  createdAtISO?: string;
  endExecutionDateISO?: string;

  amount: number;
  currency: string;

  status: TransferRequestStatus;
  transferTypeUi: TransferTypeUI;

  rawTransferType: string;

  debtorAccountRib: string;
  creditorAccountRib: string;

  debtorName?: string;
  creditorName?: string;
  beneficiaryFullName?: string;

  debtorAccountLabel?: string;

  // ✅ Display properties for modal
  debtorDisplay?: string;
  creditorDisplay?: string;
  beneficiaryDisplay?: string;
beneficiaryId?: string;

  motif?: string;
  frequency?: string;

  // ✅ allow "other" because inferNature returns it for permanent / unknown dates
  nature?: "immediate" | "deferred" | "other";

  bmcReference?: string;
};

export type ListRow =
  | { kind: "header"; id: string; title: string }
  | { kind: "item"; id: string; transfer: UITransfer };
