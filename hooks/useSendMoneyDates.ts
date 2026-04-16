import { TransferType } from "@/types/send-money.type";
import { startOfDay } from "@/utils/account-formatters";
import { useCallback } from "react";
import { serverNow } from "@/utils/serverTime";

export function useSendMoneyDates(transferType: TransferType) {
  const getMinExecutionDate = useCallback(() => {
    if (transferType === "ponctuel") return startOfDay(serverNow());

    const now = serverNow();
    const min = new Date(now.getTime() + 48 * 3600_000 + 20 * 60_000);
    return startOfDay(min);
  }, [transferType]);

  const isValidPermanentExecutionDate = (date: Date) => {
    const now = serverNow();
    const min = new Date(now.getTime() + 48 * 3600_000 + 20 * 60_000);
    return startOfDay(date).getTime() >= startOfDay(min).getTime();
  };

  return { getMinExecutionDate, isValidPermanentExecutionDate };
}
