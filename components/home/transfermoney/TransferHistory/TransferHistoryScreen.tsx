import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  Platform,
  Modal,
  StyleSheet,
  Keyboard,
  LayoutAnimation,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, SlidersHorizontal, X } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { Buffer } from "buffer";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing, BorderRadius, FontSize, FontFamily } from "@/constants";
import { moderateScale, verticalScale } from "@/utils/scale";
import TText from "@/components/TText";

import {
  transferQueryKeys,
  useTransferCancel,
  useTransferHistoryInfinite,
  TRANSFER_HISTORY_MAX_AUTO_PAGES,
} from "@/hooks/useTransfer";
import {
  useBeneficiaries,
  useCustomerAccounts,
} from "@/hooks/use-accounts-api";
import type {
  GetTransferRequestsParams,
  TransferHistoryItem,
} from "@/types/account.type";

import type {
  FiltersDraft,
  ListRow,
  TransferTypeUI,
  UITransfer,
} from "./types";
import {
  canCancelDeferred24h,
  formatGroupHeader,
  inferNature,
  normalizeRibForCompare,
  parseApiDate,
  toYMD,
} from "./utils";

import TransferHistoryList, { type TransferHistoryListRef } from "./components/TransferHistoryList";
import TransferDetailModal from "./components/TransferDetailModal";
import TransferHistoryFilterModal from "./components/TransferHistoryFilterModal";

import { getTransferPdf } from "@/services/account.api";
import { useSavePdfToDevice } from "@/hooks/useSavePdfToDevice";
import useShowMessage from "@/hooks/useShowMessage";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";
import { se } from "date-fns/locale";

const PAGE_SIZE = 20;

const DEFAULT_FILTERS: FiltersDraft = {
  selectedMonth: "all",
  minAmount: "",
  maxAmount: "",
  status: undefined,
  sort: undefined,
  order: undefined,
  startDate: null,
  endDate: null,
  requestType: undefined,
  preset: "all",
  localSort: "executionDateDesc",
};

type TransferHistoryParams = Omit<GetTransferRequestsParams, "page"> & {
  startDate?: string;
  endDate?: string;
};

function cleanParams(p: TransferHistoryParams): TransferHistoryParams {
  const out: any = { ...p };
  Object.keys(out).forEach((k) => {
    const v = out[k];
    if (v === "" || v === null || v === undefined) delete out[k];
    if (typeof v === "number" && Number.isNaN(v)) delete out[k];
  });
  return out as TransferHistoryParams;
}

function extractRows(resp: any): TransferHistoryItem[] {
  if (!resp) return [];
  if (Array.isArray(resp?.data)) return resp.data as TransferHistoryItem[];
  if (Array.isArray(resp?.data?.data))
    return resp.data.data as TransferHistoryItem[];
  return [];
}

const sanitizeSearch = (v: string) =>
  v
    .replace(/[^\p{L}\p{N} ]+/gu, "")
    .replace(/\s+/g, " ")
    .trimStart();

function thLog(title: string, payload?: any) {
  const ts = new Date().toISOString().split("T")[1]?.replace("Z", "");
  const tag = `[TH ${ts}]`;
  if (payload === undefined) {
    console.log(`${tag} ${title}`);
    return;
  }
  try {
    const safe =
      typeof payload === "string"
        ? payload
        : JSON.stringify(payload, null, 2).slice(0, 3500);
    console.log(`${tag} ${title}`, safe);
  } catch {
    console.log(`${tag} ${title}`, payload);
  }
}

// ✅ null-safe JSON stringify + circular guard
function safeStringify(obj: any, space = 2) {
  const seen = new WeakSet();
  return JSON.stringify(
    obj,
    (key, value) => {
      if (value === undefined) return null;
      if (typeof value === "object" && value !== null) {
        if (seen.has(value)) return "[Circular]";
        seen.add(value);
      }
      return value;
    },
    space,
  );
}

export default function TransferHistoryScreen() {
  const params = useLocalSearchParams<{
    beneficiaryRib?: string;
  }>();
  console.log("=======================================");
  console.log("🚀 ~ TransferHistoryScreen ~ params:", params);
  console.log("=======================================");

  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const locale =
    (i18n.language || "fr").split("-")[0] === "en" ? "en-US" : "fr-FR";

  const savePdf = useSavePdfToDevice();
  const queryClient = useQueryClient();

  // ============================================================================
  // STATE
  // ============================================================================
  const [activeTab, setActiveTab] = useState<"accounts" | "beneficiaries">(
    "accounts",
  );
  const [transferType, setTransferType] = useState<TransferTypeUI>("ponctuel");
  const [searchQuery, setSearchQuery] = useState("");
  const [creditorRibFilter, setCreditorRibFilter] = useState<
    string | undefined
  >(params.beneficiaryRib || undefined);
  const [showFilter, setShowFilter] = useState(false);
  const [draftFilters, setDraftFilters] =
    useState<FiltersDraft>(DEFAULT_FILTERS);
  const [appliedFilters, setAppliedFilters] =
    useState<FiltersDraft>(DEFAULT_FILTERS);

  const [refreshing, setRefreshing] = useState(false);

  const [detailVisible, setDetailVisible] = useState(false);
  const [currentTransfer, setCurrentTransfer] = useState<UITransfer | null>(
    null,
  );

  const [queryEnabled, setQueryEnabled] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<UITransfer | null>(null);

  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const { showMessageError, showMessageSuccess } = useShowMessage();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  // ============================================================================
  // API TYPE MAPPING
  // ============================================================================
  const apiType: GetTransferRequestsParams["type"] | undefined = useMemo(() => {
    if (appliedFilters.requestType) return appliedFilters.requestType;
    return transferType === "permanent" ? "PERMANENT" : undefined;
  }, [appliedFilters.requestType, transferType]);

  const formatDateChip = useCallback(
    (d: Date) =>
      d.toLocaleDateString(selectedLanguage ?? undefined, {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }),
    [],
  );

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      appliedFilters.status ||
      appliedFilters.startDate ||
      appliedFilters.endDate ||
      (appliedFilters.minAmount && appliedFilters.minAmount.trim()) ||
      (appliedFilters.maxAmount && appliedFilters.maxAmount.trim()),
    );
  }, [appliedFilters]);

  const activeFilterChips = useMemo(() => {
    const chips: { key: string; label: string }[] = [];
    if (appliedFilters.status) {
      const statusLabel =
        appliedFilters.status === "EXECUTED"
          ? t("transferHistory.status.executed", "Exécuté")
          : appliedFilters.status === "PENDING"
            ? t("transferHistory.status.pending", "En attente")
            : appliedFilters.status === "CANCELED"
              ? t("transferHistory.status.canceled", "Annulé")
              : appliedFilters.status === "REJECTED"
                ? t("transferHistory.status.rejected", "Rejeté")
                : appliedFilters.status;
      chips.push({
        key: "status",
        label: `${t("transferHistory.filters.status", "Statut")}: ${statusLabel}`,
      });
    }
    if (appliedFilters.startDate) {
      chips.push({
        key: "start",
        label: `${t("transferHistory.filters.startDate", "Date début")}: ${formatDateChip(appliedFilters.startDate)}`,
      });
    }
    if (appliedFilters.endDate) {
      chips.push({
        key: "end",
        label: `${t("transferHistory.filters.endDate", "Date fin")}: ${formatDateChip(appliedFilters.endDate)}`,
      });
    }
    if (appliedFilters.minAmount && appliedFilters.minAmount.trim()) {
      chips.push({
        key: "min",
        label: `${t("transferHistory.filters.min", "Min")}: ${appliedFilters.minAmount} DT`,
      });
    }
    if (appliedFilters.maxAmount && appliedFilters.maxAmount.trim()) {
      chips.push({
        key: "max",
        label: `${t("transferHistory.filters.max", "Max")}: ${appliedFilters.maxAmount} DT`,
      });
    }
    return chips;
  }, [appliedFilters, t, formatDateChip]);

  const removeFilter = useCallback((key: string) => {
    setAppliedFilters((prev) => {
      const next = { ...prev };
      if (key === "status") next.status = undefined;
      if (key === "start") next.startDate = null;
      if (key === "end") next.endDate = null;
      if (key === "min") next.minAmount = "";
      if (key === "max") next.maxAmount = "";
      return next;
    });
  }, []);

  const statusChips = useMemo(
    () => [
      {
        key: "EXECUTED",
        label: t("transferHistory.status.executed", "Exécuté"),
      },
      {
        key: "PENDING",
        label: t("transferHistory.status.pending", "En attente"),
      },
      {
        key: "CANCELED",
        label: t("transferHistory.status.canceled", "Annulé"),
      },
      {
        key: "REJECTED",
        label: t("transferHistory.status.rejected", "Rejeté"),
      },
    ],
    [t],
  );

  const sortChips = useMemo(
    () => [
      {
        key: "executionDate",
        label: t("transferHistory.sort.executionDate", "Date"),
      },
      { key: "amount", label: t("transferHistory.sort.amount", "Montant") },
    ],
    [t],
  );

  const orderChips = useMemo(
    () => [
      { key: "desc", label: t("transferHistory.order.desc", "Décroissant") },
      { key: "asc", label: t("transferHistory.order.asc", "Croissant") },
    ],
    [t],
  );

  // ============================================================================
  // BUILD API PARAMS
  // ============================================================================
  const baseParams = useMemo<TransferHistoryParams>(() => {
    const min = appliedFilters.minAmount.trim();
    const max = appliedFilters.maxAmount.trim();

    const base: TransferHistoryParams = {
      size: PAGE_SIZE,
      type: apiType,
      creditorAccount: creditorRibFilter,
      minAmount: min ? Number(min) : undefined,
      maxAmount: max ? Number(max) : undefined,
      status: appliedFilters.status?.trim() || undefined,
      startDate: appliedFilters.startDate
        ? toYMD(appliedFilters.startDate)
        : undefined,
      endDate: appliedFilters.endDate
        ? toYMD(appliedFilters.endDate)
        : undefined,
      sort: appliedFilters.sort,
      order: appliedFilters.order,
    };

    return cleanParams(base);
  }, [appliedFilters, apiType, creditorRibFilter]);

  // ============================================================================
  // REACT QUERY HOOKS
  // ============================================================================
  const historyQuery = useTransferHistoryInfinite(baseParams as any, {
    enabled: queryEnabled,
  });
  const cancelMutation = useTransferCancel();

  const { data: accountsResponse, isLoading: isAccountsLoading } =
    useCustomerAccounts();
  const accounts = useMemo(
    () => accountsResponse?.data || [],
    [accountsResponse?.data],
  );

  const { data: beneficiariesResponse } = useBeneficiaries();
  const beneficiaries = useMemo(
    () => beneficiariesResponse?.data || [],
    [beneficiariesResponse?.data],
  );

  // Pre-fill search with beneficiary name if param exists
  useEffect(() => {
    if (!params.beneficiaryRib) return;
    if (beneficiaries.length === 0) return;

    const found = beneficiaries.find(
      (b) =>
        normalizeRibForCompare(b.rib) ===
        normalizeRibForCompare(params.beneficiaryRib!),
    );

    const query = found?.fullName?.trim() || "";
    if (query) setSearchQuery(query);

    setCreditorRibFilter(params.beneficiaryRib);
  }, [params.beneficiaryRib, beneficiaries]);

  // ============================================================================
  // ACCOUNT/BENEFICIARY LOOKUPS (used as fallback only)
  // ============================================================================
  const accountByRib = useMemo(() => {
    const m = new Map<string, { title?: string; label?: string }>();
    accounts.forEach((a: any) => {
      [a?.accountRib, a?.ribFormatAccount, a?.ibanFormatAccount]
        .filter(Boolean)
        .forEach((rib: string) => {
          const key = normalizeRibForCompare(rib);
          if (!key) return;
          m.set(key, {
            title: a?.accountTitle ? String(a.accountTitle) : undefined,
            label: a?.accountLabel ? String(a.accountLabel) : undefined,
          });
        });
    });
    return m;
  }, [accounts]);

  const beneficiaryById = useMemo(() => {
    const m = new Map<string, { fullName: string; rib: string }>();
    beneficiaries.forEach((b: any) => {
      const id = b?.id != null ? String(b.id) : "";
      if (!id) return;
      m.set(id, {
        fullName: String(b.fullName ?? ""),
        rib: String(b.rib ?? ""),
      });
    });
    return m;
  }, [beneficiaries]);

  const beneficiaryByRib = useMemo(() => {
    const m = new Map<string, { fullName: string; rib: string }>();
    beneficiaries.forEach((b: any) => {
      const key = normalizeRibForCompare(b?.rib);
      if (!key) return;
      m.set(key, {
        fullName: String(b.fullName ?? ""),
        rib: String(b.rib ?? ""),
      });
    });
    return m;
  }, [beneficiaries]);

  const myAccountsRibsSet = useMemo(() => {
    const s = new Set<string>();
    accounts.forEach((a: any) => {
      [a?.accountRib, a?.ribFormatAccount, a?.ibanFormatAccount]
        .filter(Boolean)
        .forEach((rib: string) => {
          const key = normalizeRibForCompare(rib);
          if (key) s.add(key);
        });
    });
    return s;
  }, [accounts]);

  // ============================================================================
  // RESOLVER FUNCTIONS (fallback when API doesn't provide the name)
  // ============================================================================
  const resolveAccountName = useCallback(
    (rib: string) => {
      const key = normalizeRibForCompare(rib);
      const acc = key ? accountByRib.get(key) : undefined;
      return acc?.title || acc?.label || undefined;
    },
    [accountByRib],
  );

  const resolveAccountLabel = useCallback(
    (rib: string) => {
      const key = normalizeRibForCompare(rib);
      const acc = key ? accountByRib.get(key) : undefined;
      return acc?.label || acc?.title || undefined;
    },
    [accountByRib],
  );

  const resolveBeneficiaryName = useCallback(
    (beneficiaryId?: string, creditorRib?: string) => {
      if (beneficiaryId) {
        const b = beneficiaryById.get(String(beneficiaryId));
        if (b?.fullName) return b.fullName;
      }
      if (creditorRib) {
        const b = beneficiaryByRib.get(normalizeRibForCompare(creditorRib));
        if (b?.fullName) return b.fullName;
      }
      return undefined;
    },
    [beneficiaryById, beneficiaryByRib],
  );

  // ============================================================================
  // TRANSFORM API DATA TO UI FORMAT
  // ============================================================================
  const pages = historyQuery.data?.pages ?? [];
  const allRows: TransferHistoryItem[] = useMemo(
    () => pages.flatMap((p: any) => extractRows(p)),
    [pages],
  );

  const transfers: UITransfer[] = useMemo(() => {
    return allRows.map((it: any, idx: number) => {
      const beneficiaryId =
        it?.beneficiaryId != null ? String(it.beneficiaryId) : undefined;

      // ──────────────────────────────────────────────────────────────────────
      // ✅ FIX 1: Read beneficiaryName directly from API response
      // The API sends "beneficiaryName" on each item (e.g. "abdallah prod")
      // ──────────────────────────────────────────────────────────────────────
      const apiBeneficiaryName =
        String(it?.beneficiaryName ?? "").trim() || undefined;

      const rawType = String(
        it?.transferType ??
          it?.type ??
          it?.requestType ??
          it?.transferRequestType ??
          "",
      );
      const rawTypeUpper = rawType.toUpperCase();

      const frequency =
        String(
          it?.frequency ?? it?.periodicity ?? it?.recurrence ?? "",
        ).trim() || undefined;
      const isPermanent = rawTypeUpper.includes("PERMANENT") || !!frequency;
      const transferTypeUi: TransferTypeUI = isPermanent
        ? "permanent"
        : "ponctuel";

      const creditorRib = String(it?.creditorAccountRib ?? "");
      const debtorRib = String(it?.debtorAccountRib ?? "");

      // Fallback lookups from local account/beneficiary lists
      const creditorNameResolved = resolveAccountName(creditorRib);
      const debtorNameResolved = resolveAccountName(debtorRib);
      const debtorAccountLabel = resolveAccountLabel(debtorRib);

      // ✅ FIX 2: Use API beneficiaryName first, then fallback to local lookup
      const beneficiaryFullName =
        apiBeneficiaryName ||
        resolveBeneficiaryName(beneficiaryId, creditorRib);

      const creditorDisplay = creditorNameResolved?.trim()
        ? creditorNameResolved
        : creditorRib?.trim()
          ? creditorRib
          : "-";

      const debtorDisplay = debtorNameResolved?.trim()
        ? debtorNameResolved
        : debtorRib?.trim()
          ? debtorRib
          : "-";

      const rawMotif = String(
        it?.motif ?? it?.reason ?? it?.description ?? "",
      ).trim();
      const motif = rawMotif === "undefined" ? "" : rawMotif;

      // ✅ FIX 3: displayTitle — use API beneficiaryName for beneficiaries tab
      let displayTitle = creditorDisplay;

      if (activeTab === "beneficiaries") {
        displayTitle = beneficiaryFullName?.trim()
          ? beneficiaryFullName
          : creditorRib?.trim()
            ? creditorRib
            : "-";
      } else {
        displayTitle = creditorNameResolved?.trim()
          ? creditorNameResolved
          : creditorRib?.trim()
            ? creditorRib
            : "-";
      }

      const displaySubtitle = motif
        ? motif
        : debtorDisplay && debtorDisplay !== "-"
          ? debtorDisplay
          : undefined;

      const id = String(it?.requestId ?? it?.id ?? `${idx}`);

      // ──────────────────────────────────────────────────────────────────────
      // ✅ FIX 4: Read "reference" from API (the field name in the response)
      // API sends: "reference": "BMC000017713356..."
      // ──────────────────────────────────────────────────────────────────────
      const bmcReference =
        String(
          it?.reference ??
            it?.bmcReference ??
            it?.bmcRef ??
            it?.referenceBmc ??
            it?.refBmc ??
            it?.bmcRequestId ??
            it?.bmcId ??
            "",
        ).trim() || undefined;

      const executionDateISO = String(
        it?.requestExecutionDate ?? it?.executionDate ?? "",
      );

      // ✅ FIX 5: Read createdAt properly from API
      const createdAtISO =
        String(
          it?.createdAt ?? it?.requestCreationDate ?? it?.creationDate ?? "",
        ).trim() || undefined;

      const endExecutionDateISO =
        String(
          it?.requestEndExecutionDate ??
            it?.endExecutionDate ??
            it?.endDate ??
            "",
        ).trim() || undefined;

      return {
        id,
        displayTitle,
        displaySubtitle,
        executionDateISO,
        createdAtISO,
        endExecutionDateISO,
        amount: Number(it?.amount ?? 0),
        currency: String(it?.currency ?? "DT"),
        status: it?.status,
        transferTypeUi,
        rawTransferType: rawType,
        debtorAccountRib: debtorRib,
        creditorAccountRib: creditorRib,
        debtorName: debtorNameResolved,
        creditorName: creditorNameResolved,
        beneficiaryFullName,
        debtorAccountLabel,
        debtorDisplay,
        creditorDisplay,
        // ✅ FIX 6: beneficiaryDisplay uses API name first
        beneficiaryDisplay: beneficiaryFullName,
        motif: motif || undefined,
        frequency,
        nature: inferNature(transferTypeUi, executionDateISO),
        bmcReference,
        beneficiaryId,
      };
    });
  }, [
    allRows,
    activeTab,
    resolveAccountName,
    resolveAccountLabel,
    resolveBeneficiaryName,
  ]);

  // ============================================================================
  // CLIENT-SIDE FILTERING
  // ============================================================================
  const filteredTransfers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const byTab = transfers.filter((tr) => {
      // ✅ Don't filter by account ownership while accounts are still loading.
      // myAccountsRibsSet would be empty/incomplete and hide valid results,
      // causing fewer items to show on first render than after accounts load.
      if (isAccountsLoading) return true;

      const c = normalizeRibForCompare(tr.creditorAccountRib);
      const creditorIsMine = !!c && myAccountsRibsSet.has(c);
      if (activeTab === "accounts") return creditorIsMine;

      const d = normalizeRibForCompare(tr.debtorAccountRib);
      const debtorIsMine = !!d && myAccountsRibsSet.has(d);
      return debtorIsMine && !creditorIsMine;
    });

    const byOther = byTab.filter((tr) => {
      const matchesSearch =
        !q ||
        tr.displayTitle.toLowerCase().includes(q) ||
        (tr.displaySubtitle?.toLowerCase().includes(q) ?? false) ||
        tr.creditorAccountRib.toLowerCase().includes(q) ||
        tr.debtorAccountRib.toLowerCase().includes(q) ||
        // ✅ FIX 7: Also search by beneficiaryFullName & bmcReference
        (tr.beneficiaryFullName?.toLowerCase().includes(q) ?? false) ||
        (tr.bmcReference?.toLowerCase().includes(q) ?? false);

      const matchesType = tr.transferTypeUi === transferType;

      return matchesSearch && matchesType;
    });

    const sorted = [...byOther].sort((a, b) => {
      const da = parseApiDate(a.executionDateISO)?.getTime() ?? 0;
      const db = parseApiDate(b.executionDateISO)?.getTime() ?? 0;
      if (appliedFilters.localSort === "executionDateAsc") return da - db;
      return db - da;
    });

    return sorted;
  }, [
    activeTab,
    appliedFilters.localSort,
    isAccountsLoading,
    myAccountsRibsSet,
    searchQuery,
    transferType,
    transfers,
  ]);

  // ============================================================================
  // GROUP TRANSFERS BY DATE FOR LIST
  // ============================================================================
  const listRows: ListRow[] = useMemo(() => {
    const out: ListRow[] = [];
    const groups: Record<string, UITransfer[]> = {};

    filteredTransfers.forEach((tr) => {
      const key = formatGroupHeader(tr.executionDateISO, locale, t);
      if (!groups[key]) groups[key] = [];
      groups[key].push(tr);
    });

    Object.keys(groups).forEach((g) => {
      out.push({ kind: "header", id: `h-${g}`, title: g });
      groups[g].forEach((tr) =>
        out.push({ kind: "item", id: `i-${tr.id}`, transfer: tr }),
      );
    });

    return out;
  }, [filteredTransfers, locale, t]);

  // ============================================================================
  // LOADING STATES
  // ============================================================================
  const isInitialLoading =
    (historyQuery.isLoading && allRows.length === 0) ||
    (historyQuery.isFetching && allRows.length === 0) ||
    (refreshing && allRows.length === 0);

  // ============================================================================
  // ENABLE QUERY ON MOUNT
  // ============================================================================
  useEffect(() => {
    if (params.beneficiaryRib) {
      setActiveTab("beneficiaries");
    }
  }, [params.beneficiaryRib]);

  const listRef = useRef<TransferHistoryListRef>(null);
  const enabledOnce = useRef(false);
  useEffect(() => {
    if (enabledOnce.current) return;
    enabledOnce.current = true;
    thLog("ENABLE_QUERY");
    setQueryEnabled(true);
  }, []);

  // ✅ Auto-fetch next page only if zero items are visible after the first page.
  // A single visible item is enough — user can scroll for more.
  // This avoids burning multiple API calls on mount due to client-side filtering.
  const MIN_VISIBLE_ITEMS = 1;
  useEffect(() => {
    if (isAccountsLoading) return;              // accounts not ready yet
    if (historyQuery.isFetching) return;        // already fetching
    if (!historyQuery.hasNextPage) return;      // no more pages (server end)
    if ((historyQuery.data?.pages.length ?? 0) >= TRANSFER_HISTORY_MAX_AUTO_PAGES) return; // auto-fetch limit reached, user must scroll manually
    if (filteredTransfers.length >= MIN_VISIBLE_ITEMS) return; // enough visible items

    thLog("AUTO_FETCH_NEXT — visible items below MIN", {
      visible: filteredTransfers.length,
      min: MIN_VISIBLE_ITEMS,
    });
    historyQuery.fetchNextPage();
  }, [
    filteredTransfers.length,
    historyQuery.isFetching,
    historyQuery.hasNextPage,
    isAccountsLoading,
  ]);

  // Scroll to top whenever the user switches tab or transfer type
  useEffect(() => {
    listRef.current?.scrollToTop();
  }, [activeTab, transferType]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================
  const handleRefresh = useCallback(async () => {
    thLog("REFRESH_START");
    setRefreshing(true);
    try {
      await historyQuery.refetch();
    } finally {
      setRefreshing(false);
      thLog("REFRESH_DONE");
    }
  }, [historyQuery]);

  const handleLoadMore = useCallback(() => {
    if (
      historyQuery.isFetching ||
      refreshing ||
      !historyQuery.hasNextPage ||
      historyQuery.isFetchingNextPage ||
      allRows.length === 0 ||
      listRows.length === 0
    ) {
      return;
    }
    thLog("LOAD_MORE");
    historyQuery.fetchNextPage();
  }, [historyQuery, refreshing, allRows.length, listRows.length]);

  const openDetailModal = useCallback((transfer: UITransfer) => {
    setCurrentTransfer(transfer);
    setDetailVisible(true);
  }, []);

  const closeDetailModal = useCallback(() => {
    setDetailVisible(false);
    setCurrentTransfer(null);
  }, []);

  const handleAnnuler = useCallback((transfer: UITransfer) => {
    setCancelTarget(transfer);
    setCancelConfirmVisible(true);
  }, []);

  const closeCancelConfirm = useCallback(() => {
    setCancelConfirmVisible(false);
    setCancelTarget(null);
  }, []);

  const confirmCancel = useCallback(async () => {
    if (!cancelTarget) return;

    const id = cancelTarget.id;

    setCancelConfirmVisible(false);
    setCancellingId(id);

    try {
      await cancelMutation.mutateAsync(id);

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);

      queryClient.setQueriesData(
        { queryKey: transferQueryKeys.history() },
        (old: any) => {
          if (!old?.pages) return old;

          return {
            ...old,
            pages: old.pages.map((page: any) => {
              const rows = page?.data?.data ?? page?.data ?? null;
              if (!Array.isArray(rows)) return page;

              const updatedRows = rows.map((it: any) => {
                const rid = String(it?.requestId ?? it?.id ?? "");
                if (rid !== String(id)) return it;
                return { ...it, status: "CANCELED" };
              });

              if (Array.isArray(page?.data?.data)) {
                return {
                  ...page,
                  data: { ...page.data, data: updatedRows },
                };
              }
              if (Array.isArray(page?.data)) {
                return { ...page, data: updatedRows };
              }
              return page;
            }),
          };
        },
      );

      showMessageSuccess(
        "transferHistory.cancel.success.title",
        "transferHistory.cancel.success.desc",
      );
    } catch (e) {
      showMessageError(
        "transferHistory.cancel.error.title",
        "transferHistory.cancel.error.desc",
      );
    } finally {
      setCancellingId(null);
      setCancelTarget(null);
    }
  }, [
    cancelTarget,
    cancelMutation,
    queryClient,
    showMessageSuccess,
    showMessageError,
  ]);

  const handleDownload = useCallback(
    async (transfer: UITransfer) => {
      if (!transfer?.id) return;
      if (isDownloadingPdf) return;

      setIsDownloadingPdf(true);
      thLog("PDF_DOWNLOAD_START", { id: transfer.id });

      try {
        const arrayBuffer = await getTransferPdf(transfer.id, "PDF");
        const base64 = Buffer.from(arrayBuffer).toString("base64");

        await savePdf(
          base64,
          `transfer_${transfer.id}.pdf`,
          "Enregistrer le reçu de virement",
        );

        thLog("PDF_DOWNLOAD_DONE", { id: transfer.id });
      } catch (error) {
        console.error("PDF download/save error:", error);
        thLog("PDF_DOWNLOAD_ERROR", {
          id: transfer.id,
          error: String(error),
        });
      } finally {
        setIsDownloadingPdf(false);
      }
    },
    [isDownloadingPdf, savePdf],
  );

  // ============================================================================
  // FILTER MODAL HANDLERS
  // ============================================================================
  const openFilterModal = useCallback(() => {
    Keyboard.dismiss();
    setDraftFilters({ ...appliedFilters });
    setShowFilter(true);
  }, [appliedFilters]);

  const applyModalFilters = useCallback(() => {
    thLog("APPLY_FILTERS", draftFilters);

    let start = draftFilters.startDate;
    let end = draftFilters.endDate;
    if (start && end && end.getTime() < start.getTime()) {
      const tmp = start;
      start = end;
      end = tmp;
    }

    let nextLocalSort = draftFilters.localSort ?? "executionDateDesc";
    if (draftFilters.sort === "executionDate") {
      nextLocalSort =
        draftFilters.order === "asc" ? "executionDateAsc" : "executionDateDesc";
    }

    setAppliedFilters({
      ...draftFilters,
      startDate: start,
      endDate: end,
      localSort: nextLocalSort,
    });
    setShowFilter(false);
  }, [draftFilters]);

  const resetModalFilters = useCallback(() => {
    thLog("RESET_FILTERS");
    setDraftFilters(DEFAULT_FILTERS);
    setAppliedFilters(DEFAULT_FILTERS);
    setShowFilter(false);
  }, []);

  const resetAllFilters = useCallback(() => {
    setAppliedFilters(DEFAULT_FILTERS);
    setDraftFilters(DEFAULT_FILTERS);
    setShowFilter(false);
    setSearchQuery("");
  }, []);

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <>
      <View style={styles.container}>
             <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "accounts" && styles.tabActive]}
            onPress={() => {
              Keyboard.dismiss();
              resetAllFilters();
              setActiveTab("accounts");
            }}
          >
            <TText
              tKey="transfer.toMyAccounts"
              numberOfLines={2}
              style={[
                styles.tabText,
                activeTab === "accounts" && styles.tabTextActive,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "beneficiaries" && styles.tabActive,
            ]}
            onPress={() => {
              Keyboard.dismiss();
              resetAllFilters();
              setActiveTab("beneficiaries");
            }}
          >
            <TText
              tKey="transfer.toMyBeneficiaries"
              numberOfLines={2}
              style={[
                styles.tabText,
                activeTab === "beneficiaries" && styles.tabTextActive,
              ]}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchBox}>
              <Search size={18} color={BankingColors.textSecondary} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("portfolio.search", "Rechercher...")}
                placeholderTextColor={BankingColors.textLight}
                value={searchQuery}
                onChangeText={(v) => {
                  const sanitized = sanitizeSearch(v);
                  setSearchQuery(sanitized);
                  if (!sanitized) {
                    setCreditorRibFilter(undefined);
                  }
                }}
                returnKeyType="search"
                autoCorrect={false}
                autoCapitalize="none"
                numberOfLines={1}
              />
              {!!searchQuery && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery("");
                    setCreditorRibFilter(undefined);
                  }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={BankingColors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={openFilterModal}
              activeOpacity={0.85}
              style={[
                styles.filterIconBtn,
                hasActiveFilters && styles.filterIconBtnActive,
              ]}
            >
              <SlidersHorizontal
                size={20}
                color={
                  hasActiveFilters ? BankingColors.white : BankingColors.primary
                }
              />
            </TouchableOpacity>
          </View>

          {activeFilterChips.length > 0 && (
            <View style={styles.appliedFiltersRow}>
              <View style={styles.appliedFiltersHeader}>
                <TText style={styles.appliedFiltersLabel}>
                  {t("common.filter", "Filtres")}
                </TText>
                <TText style={styles.appliedFiltersCount}>
                  {activeFilterChips.length}{" "}
                  {t("transferHistory.filtersActive", "actif(s)")}
                </TText>
              </View>
              <View style={styles.chipsList}>
                {activeFilterChips.map((chip) => (
                  <View key={chip.key} style={styles.activeChip}>
                    <TText style={styles.activeChipText}>{chip.label}</TText>
                    <TouchableOpacity
                      onPress={() => removeFilter(chip.key)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={14} color={BankingColors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>
          )}

          <TText style={styles.resultsText}>
            {filteredTransfers.length}{" "}
            {t("transferHistory.results", "résultat(s)")}
          </TText>
        </View>

        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              transferType === "ponctuel" && styles.toggleButtonActive,
            ]}
            onPress={() => setTransferType("ponctuel")}
          >
            <TText
              style={[
                styles.toggleText,
                transferType === "ponctuel" && styles.toggleTextActive,
              ]}
            >
              {t("transferHistory.type.ponctuel", "Ponctuel")}
            </TText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              transferType === "permanent" && styles.toggleButtonActive,
            ]}
            onPress={() => setTransferType("permanent")}
          >
            <TText
              style={[
                styles.toggleText,
                transferType === "permanent" && styles.toggleTextActive,
              ]}
            >
              {t("transferHistory.type.permanent", "Permanent")}
            </TText>
          </TouchableOpacity>
        </View>

        <TransferHistoryList
          ref={listRef}
          data={listRows}
          onOpen={openDetailModal}
          onCancel={handleAnnuler}
          canCancel={(tr) =>
            canCancelDeferred24h(
              tr.rawTransferType,
              tr.executionDateISO,
              tr.status,
            )
          }
          cancelling={cancelMutation.isPending}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          onEndReached={handleLoadMore}
          isFetchingNextPage={!!historyQuery.isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          contentPaddingBottom={insets.bottom + 65}
          cancellingId={cancellingId}
          accountsUnavailable={
            accounts.length === 0 && !isAccountsLoading && queryEnabled
          }
        />

        <TransferDetailModal
          visible={detailVisible}
          transfer={currentTransfer}
          onClose={closeDetailModal}
        />

        <Modal
          visible={cancelConfirmVisible}
          transparent
          animationType="fade"
          onRequestClose={closeCancelConfirm}
        >
          <View style={styles.detailModalOverlay}>
            <View style={styles.detailModalContent}>
              <TText style={styles.detailModalTitle}>
                {t("transferHistory.cancel.title", "Annuler le virement ?")}
              </TText>

              <TText style={styles.detailNote}>
                {t(
                  "transferHistory.cancel.confirmText",
                  "Êtes-vous sûr de vouloir annuler ce virement ?",
                )}
              </TText>

              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={[
                    styles.okButton,
                    { flex: 1, backgroundColor: BankingColors.border },
                  ]}
                  onPress={closeCancelConfirm}
                  disabled={cancelMutation.isPending}
                >
                  <TText
                    style={[styles.okButtonText, { color: BankingColors.text }]}
                  >
                    {t("common.no", "Non")}
                  </TText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.okButton, { flex: 1 }]}
                  onPress={confirmCancel}
                  disabled={cancelMutation.isPending}
                >
                  <TText style={styles.okButtonText}>
                    {cancelMutation.isPending
                      ? t("common.loading", "Chargement…")
                      : t("common.yes", "Oui")}
                  </TText>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>

      <TransferHistoryFilterModal
        visible={showFilter}
        locale={locale}
        title={t("transferHistory.filters.title", "Filtrer les virements")}
        statusChips={statusChips}
        sortChips={sortChips}
        orderChips={orderChips}
        draftFilters={draftFilters}
        setDraftFilters={setDraftFilters}
        onClose={() => setShowFilter(false)}
        onReset={resetModalFilters}
        onApply={applyModalFilters}
        t={t}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
   tabsContainer: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: verticalScale(10),
    paddingHorizontal: moderateScale(Spacing.sm),
    alignItems: "center",
    justifyContent: "center",
    minHeight: verticalScale(48),
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: { borderBottomColor: BankingColors.primary },
  tabText: {
    fontSize: moderateScale(13, 0.3),
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    textAlign: "center",
  },
  tabTextActive: { color: BankingColors.primary },
  searchSection: {
    paddingTop: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    color: BankingColors.text,
    fontSize: FontSize.md,
  },
  filterIconBtn: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary,
  },
  filterIconBtnActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  appliedFiltersRow: {
    marginBottom: Spacing.md,
  },
  appliedFiltersHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  appliedFiltersLabel: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  appliedFiltersCount: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  chipsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.surfaceSecondary,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  activeChipText: {
    fontSize: FontSize.sm,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
  },
  resultsText: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium,
    marginBottom: Spacing.sm,
  },
  toggleContainer: {
    flexDirection: "row",
    padding: 14,
    gap: 10,
    backgroundColor: "#FFFFFF",
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: BankingColors.primary,
    borderColor: BankingColors.primary,
  },
  toggleText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  toggleTextActive: { color: "#FFFFFF" },
  detailModalOverlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  detailModalContent: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
  },
  detailModalTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: Spacing.xl,
    textAlign: "center",
  },
  detailNote: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.xl,
    lineHeight: 18,
    textAlign: "center",
  },
  okButton: {
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: "center",
  },
  okButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
});
