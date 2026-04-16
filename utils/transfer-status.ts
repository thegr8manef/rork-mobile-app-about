// utils/transfer-status.ts
// Maps backend transfer statuses to UI config (icon, color, i18n keys)

import { BankingColors } from "@/constants";
import {
  Check,
  Clock,
  X,
  Loader,
  Ban } from "lucide-react-native";

export type TransferStatus =
  | "INIT"
  | "PENDING"
  | "EXECUTED"
  | "REJECTED"
  | "CANCELED";

export type TransferStatusConfig = {
  icon: typeof Check;
  color: string;
  bgColor: string;
  bgColorInner: string;
  titleKey: string;
  descKey: string;
  isSuccess: boolean;
};

export const TRANSFER_STATUS_MAP: Record<TransferStatus, TransferStatusConfig> = {
  EXECUTED: {
    icon: Check,
    color: BankingColors.success,
    bgColor: BankingColors.success + "18",
    bgColorInner: BankingColors.success + "25",
    titleKey: "transferStatus.executed.title",
    descKey: "transferStatus.executed.desc",
    isSuccess: true },
  PENDING: {
    icon: Clock,
    color: BankingColors.warning ?? "#F59E0B",
    bgColor: (BankingColors.warning ?? "#F59E0B") + "18",
    bgColorInner: (BankingColors.warning ?? "#F59E0B") + "25",
    titleKey: "transferStatus.pending.title",
    descKey: "transferStatus.pending.desc",
    isSuccess: true, // still a "success" flow, just pending
  },
  INIT: {
    icon: Loader,
    color: BankingColors.primary,
    bgColor: BankingColors.primary + "18",
    bgColorInner: BankingColors.primary + "25",
    titleKey: "transferStatus.init.title",
    descKey: "transferStatus.init.desc",
    isSuccess: true },
  REJECTED: {
    icon: X,
    color: BankingColors.error,
    bgColor: BankingColors.errorLight ?? BankingColors.error + "18",
    bgColorInner: BankingColors.error + "20",
    titleKey: "transferStatus.rejected.title",
    descKey: "transferStatus.rejected.desc",
    isSuccess: false },
  CANCELED: {
    icon: Ban,
    color: BankingColors.textSecondary,
    bgColor: BankingColors.textSecondary + "18",
    bgColorInner: BankingColors.textSecondary + "25",
    titleKey: "transferStatus.canceled.title",
    descKey: "transferStatus.canceled.desc",
    isSuccess: false } };

export const getTransferStatusConfig = (
  status?: string,
): TransferStatusConfig => {
  if (!status) return TRANSFER_STATUS_MAP.EXECUTED;
  const upper = status.toUpperCase() as TransferStatus;
  return TRANSFER_STATUS_MAP[upper] ?? TRANSFER_STATUS_MAP.EXECUTED;
};