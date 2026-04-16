import { z } from "zod";

const CIN_REGEX = /^\d{8}$/; // Tunisia CIN: 8 digits
const PHONE_REGEX = /^[0-9\s]{6,20}$/;
const EMAIL_REGEX =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

const forgotPasswordSchema = z
  .object({
    cin: z
      .string()
      .trim()
      .regex(CIN_REGEX, "forgotPassword.cinRequired"),
    phone: z
      .string()
      .trim()
      .min(6, "forgotPassword.phoneRequired")
      .max(20, "forgotPassword.phoneRequired")
      .regex(PHONE_REGEX, "forgotPassword.phoneRequired"),
    email: z.string().trim().optional(),
    isEmailRequired: z.boolean(),
  })
  .superRefine((data, ctx) => {
    if (data.isEmailRequired) {
      if (!data.email || !EMAIL_REGEX.test(data.email)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "forgotPassword.emailRequired",
        });
      }
    }
  });

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;