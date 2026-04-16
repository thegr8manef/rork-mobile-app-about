import { z } from "zod";

export const accountLabelSchema = z.object({
  accountLabel: z
    .string()
    .min(1, { message: "accountDetails.label.required" })
    .max(50, { message: "accountDetails.label.max_length" })
    .transform((v) =>
      v
        // keep letters/numbers/space + common safe punctuation
        .replace(/[^\p{L}\p{N}\s’’\-_/().,]/gu, "")
        .slice(0, 50),
    )
    .refine((v) => v.trim().length > 0, {
      message: "accountDetails.label.required",
    }),
});

export type AccountLabelForm = z.infer<typeof accountLabelSchema>;
