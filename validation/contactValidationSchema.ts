import { z } from "zod";

export const contactDetailsSchema = z.object({
  identificationNumber: z
    .string()
    .trim()
    .min(1, "contactValidation.idRequired")
    .max(20, "contactValidation.idTooLong")
    .regex(/^[a-zA-Z0-9]+$/, "contactValidation.idInvalid"),

  phone: z
    .string()
    .trim()
    .min(6, "contactValidation.phoneRequired")
    .regex(/^[\d\s]+$/, "contactValidation.phoneInvalid")
    .transform((v) => v.replace(/\s+/g, " ")),

  email: z
    .string()
    .trim()
    .min(1, "contactValidation.emailRequired")
    .regex(
      /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/,
      "contactValidation.emailInvalid",
    ),
});

export type ContactDetailsFormValues = z.infer<typeof contactDetailsSchema>;