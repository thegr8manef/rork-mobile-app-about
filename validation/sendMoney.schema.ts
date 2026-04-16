// sendMoney.schema.ts
import { z } from "zod";

export const sendMoneySchema = z.object({
  fromAccountId: z.string().min(1),
  amount: z.string().refine(v => Number(v) > 0),
  description: z.string().min(1).regex(
      /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s\-’']+$/,
      "validation.beneficiary.name_invalid_chars"
    ),
  transferType: z.enum(["ponctuel", "permanent"]),
  executionDate: z.string(),
  endDate: z.string().optional(),
  beneficiaryId: z.string().optional(),
  creditorAccountId: z.string().optional(),
});

export type SendMoneyForm = z.infer<typeof sendMoneySchema>;
