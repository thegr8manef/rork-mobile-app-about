import { z } from "zod";

export const addBeneficiarySchema = z.object({
  fullName: z
    .string()
    .min(1, "validation.beneficiary.name_required")
    .max(100, "validation.beneficiary.name_max_length")
    // ✅ RN/Hermes-friendly: French + most Latin accented letters
    .regex(
      /^[A-Za-z\u00C0-\u024F\u1E00-\u1EFF\s\-’']+$/,
      "validation.beneficiary.name_invalid_chars"
    ),

  rib: z
    .string()
    .length(20, "validation.beneficiary.rib_length")
    .regex(/^[0-9]+$/, "validation.beneficiary.rib_digits_only"),
});

export interface AddBeneficiaryFormValues
  extends z.infer<typeof addBeneficiarySchema> {}
