import { z } from "zod";
import type { TransferType } from "./types";
import { startOfDay } from "./utils";

const DESCRIPTION_MAX = 100;

const sanitizeDescription = (v: string) =>
  v
    .normalize("NFC")
    .replace(/[^\p{L}\p{N}\s]/gu, "") // letters + numbers + spaces only
    .replace(/\s+/g, " ")
    .trim();

// normalize: remove spaces, convert , to . for regex testing
const normalizeAmount = (v: string) =>
  v.trim().replace(/\s+/g, "").replace(",", ".");

const buildAmountRegex = (decimals: number) => {
  if (decimals <= 0) return /^\d+$/;
  return new RegExp(`^\\d+(\\.\\d{0,${decimals}})?$`);
};

type Params = {
  transferType: TransferType;
  getMinExecutionDate: () => Date;
  isDateAtLeast48h20minFromNow: (date: Date) => boolean;
  decimals?: number; // 3 for TND, 2 for others, 0 for JPY
};

export const createSendMoneySchema = ({
  transferType,
  getMinExecutionDate,
  isDateAtLeast48h20minFromNow,
  decimals = 3, // ✅ default to 3 (TND)
}: Params) => {
  const AMOUNT_REGEX = buildAmountRegex(decimals);

  const base = z.object({
    amount: z
      .string()
      .trim()
      .min(1, "sendMoney.validation.amount.required")
      .refine(
        (v: string) => {
          const normalized = normalizeAmount(v);
          // must be a valid finite positive number
          const num = Number(normalized);
          if (!Number.isFinite(num) || num <= 0) return false;
          return AMOUNT_REGEX.test(normalized);
        },
        "sendMoney.validation.amount.format",
      ),

    executionDate: z.date(),
    endDate: z.date().optional(),

 description: z
  .string()
  .trim()
  .min(1, "sendMoney.validation.description.required")
  .max(DESCRIPTION_MAX, "sendMoney.validation.description.max")
  .regex(/^[\p{L}\p{N}\s]+$/u, "sendMoney.validation.description.invalidChars")
  .transform((v) => v.normalize("NFC").replace(/\s+/g, " ").trim()) });

  return base.superRefine((data, ctx) => {
    const minExec = getMinExecutionDate();
    const execDay = startOfDay(data.executionDate);
    const minDay = startOfDay(minExec);

    if (transferType === "ponctuel") {
      if (execDay.getTime() < minDay.getTime()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["executionDate"],
          message: "sendMoney.validation.executionDate.invalid" });
      }

      if (data.endDate) {
        const endDay = startOfDay(data.endDate);
        if (endDay.getTime() < execDay.getTime()) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["endDate"],
            message: "sendMoney.validation.endDate.beforeStart" });
        }
      }
      return;
    }

    // permanent
    if (!isDateAtLeast48h20minFromNow(data.executionDate)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["executionDate"],
        message: "sendMoney.validation.executionDate.after24h" });
    }

    if (!data.endDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "sendMoney.validation.endDate.requiredForRecurring" });
      return;
    }

    const endDay = startOfDay(data.endDate);
    if (endDay.getTime() <= execDay.getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endDate"],
        message: "sendMoney.validation.endDate.afterStart" });
    }
  });
};