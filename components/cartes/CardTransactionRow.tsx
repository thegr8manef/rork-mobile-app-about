import React from "react";
import { View } from "react-native";
import TransactionItem from "@/components/TransactionItem";
import { Transaction } from "@/types/banking";
import { useRouter } from "expo-router";
import { Spacing } from "@/constants/spacing";

interface Props {
  item: Transaction;
}

export default function CardTransactionRow({ item }: Props) {
  const router = useRouter();
  // console.log("Rendering CardTransactionRow for transaction:", item);
  return (
    <View style={{ marginHorizontal: Spacing.lg }}>
      <TransactionItem
        transaction={item}
        onPress={() =>
          router.navigate({
            pathname: "/transaction-details",
            params: {
              id: item.id,
              type: item.type,
              amount: item.amount.toString(),
              currency: item.currency,
              description: item.description,
              category: item.category,
              date: item.ledgerDate,
              status: item.status,
              recipient: item.recipient || "",
              reference: item.reference || "",
              accountId: item.accountId } })
        }
      />
    </View>
  );
}
