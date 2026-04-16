  import { z } from "zod";

  export const loginSchema = z.object({
    username: z
      .string()
      .trim()
      .min(1, { message: "auth.login.username.required" })
      .max(50, { message: "auth.login.username.max_length" }) // ✅ add
      .refine(
        (v) =>
          /^[a-zA-Z0-9._-]+$/.test(v) ||
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
        { message: "auth.login.username.invalid" },
      ),

password: z
  .string()
  .trim()
  .min(1, { message: "auth.login.password.required" })
  .min(4, { message: "auth.login.password.required" })
  .max(30, { message: "auth.login.password.max_length" }),
  });
