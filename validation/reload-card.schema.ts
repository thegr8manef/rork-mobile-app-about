// reload-card.schema.ts
import { regex, z } from "zod";

const MOTIF_MAX = 100;
// same “description” idea: letters/numbers/spaces + - /

const normalizeAmount = (v: string) =>
  v.trim().replace(/\s+/g, "").replace(",", ".");

const buildAmountRegex = (decimals: number) => {
  if (decimals <= 0) return /^\d+$/;
  return new RegExp(`^\\d+(\\.\\d{1,${decimals}})?$`);
};

type Params = {
  decimals?: number; // default 2
  minAmount?: number; // default 30
  maxAmount?: number; // default 1000
};

export const createReloadCardSchema = ({
  decimals = 2,
  minAmount = 30,
  maxAmount = 1000,
}: Params = {}) => {
  const AMOUNT_REGEX = buildAmountRegex(decimals);

  return z.object({
    amount: z
      .string()
      .trim()
      .min(1, "reloadCard.validation.amount.required")
      .refine(
        (v) => AMOUNT_REGEX.test(normalizeAmount(v)),
        "reloadCard.validation.amount.format",
      )
      .refine(
        (v) => !Number.isNaN(Number(normalizeAmount(v))),
        "reloadCard.validation.amount.invalid",
      )
      .refine(
        (v) => Number(normalizeAmount(v)) >= minAmount,
        "reloadCard.validation.amount.min",
      )
      .refine(
        (v) => Number(normalizeAmount(v)) <= maxAmount,
        "reloadCard.validation.amount.max",
      )
      .transform((v) => normalizeAmount(v)),

    // optional in your UI, but if provided must be valid
    motif: z
    .string()
  .trim()
  .min(1, "sendMoney.validation.description.required")
  .max(100, "sendMoney.validation.description.max")
  .regex(/^[\p{L}\p{N}\s]+$/u, "sendMoney.validation.description.invalidChars")
  .transform((v) => v.normalize("NFC").replace(/\s+/g, " ").trim()),
  });
};

export type ReloadCardFormValues = z.infer<
  ReturnType<typeof createReloadCardSchema>
>;
