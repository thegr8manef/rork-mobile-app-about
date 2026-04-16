import { z } from "zod";

const parseAmount = (v: unknown) => {
  const n = Number(String(v ?? "").replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
};

export const buildLimitSchema = (min: number, max: number) =>
  z.object({
    limit: z
      .string()
      .trim()
      .min(1, "Required")
      .refine((v) => Number.isFinite(parseAmount(v)), "Invalid number")
      .transform((v) => Math.round(parseAmount(v))) // ✅ becomes number
      .refine((n) => n >= min, `Min is ${min}`)
      .refine((n) => n <= max, `Max is ${max}`),
  });

// ✅ RHF input type (what the input holds)
export type LimitFormInput = z.input<ReturnType<typeof buildLimitSchema>>; // { limit: string }

// ✅ submit type (after transform)
export type LimitFormOutput = z.output<ReturnType<typeof buildLimitSchema>>; // { limit: number }