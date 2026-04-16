import { SendMoneyFormValues, TransferType } from "@/types/send-money.type";
import { startOfDay } from "@/utils/account-formatters";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMemo } from "react";
import { useForm } from "react-hook-form";
import z from "zod";

export function useSendMoneyForm(
  transferType: TransferType,
  getMinExecutionDate: () => Date,
  isValidPermanentExecutionDate: (d: Date) => boolean
) {
  const schema = useMemo(() => {
    return z
      .object({
        amount: z.string().min(1),
        executionDate: z.date(),
        endDate: z.date().optional(),
        description: z.string().min(1),
      })
      .superRefine((data, ctx) => {
        const exec = startOfDay(data.executionDate);

        if (
          transferType === "permanent" &&
          !isValidPermanentExecutionDate(exec)
        ) {
          ctx.addIssue({
            path: ["executionDate"],
            message: "Date invalide",
            code: z.ZodIssueCode.custom,
          });
        }
      });
  }, [transferType]);

  return useForm<SendMoneyFormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: {
      amount: "",
      description: "",
      executionDate: getMinExecutionDate(),
    },
  });
}
