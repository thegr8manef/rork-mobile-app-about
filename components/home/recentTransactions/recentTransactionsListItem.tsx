import React, { useMemo } from "react";
import TransactionItem from "@/components/TransactionItem";
import { AccountMovement } from "@/types/account.type";
import { router } from "expo-router";

type Props = {
  movement: AccountMovement; // keep 'any' if you don’t have Movement type yet
  accountId: string;
  index: number;
  onPress?: () => void;

};

export default function RecentTransactionsListItem({ movement, accountId, index, onPress }: Props) {
  const transaction = useMemo(() => {
    return {
      id: `${movement.movementNumber}-${movement.ledgerDate}`,
      accountId,
      type: movement.movementSide === "C" ? ("credit" as const) : ("debit" as const),
      amount:
        movement.movementSide === "C"
          ? parseFloat(movement.amount)
          : -parseFloat(movement.amount),
      currency: movement.currency.alphaCode,
      description: movement.eventOperation,
      category: movement.operationNature,
      ledgerDate: movement.ledgerDate,
      valueDate: movement.valueDate,
      status: "completed" as const,
      recipient: `${movement.movementNumber}-${movement.ledgerDate}` };
  }, [movement, accountId, index]);
//@ts-ignore
  return <TransactionItem transaction={transaction} onPress={() => router.navigate({ pathname: "/transaction-details", params: transaction })} />;
}
