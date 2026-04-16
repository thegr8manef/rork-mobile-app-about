// components/home/transfermoney/TransferHistory/components/TransferHistoryList.tsx
import React, { useCallback, useImperativeHandle, useMemo, useRef, forwardRef } from "react";
import { FlatList, RefreshControl, View } from "react-native";

import TransactionSkeleton from "@/components/TransactionSkeleton";
import { BankingColors } from "@/constants/banking-colors";

import type { ListRow, UITransfer } from "../types";
import TransferHistoryRow from "./TransferHistoryRow";
import TransferGroupHeader from "./TransferGroupHeader";
import EmptyState from "./TransferListEmpty";

export type TransferHistoryListRef = {
  scrollToTop: () => void;
};

type Props = {
  data: ListRow[];
  onOpen: (tr: UITransfer) => void;
  onCancel: (tr: UITransfer) => void;
  canCancel: (tr: UITransfer) => boolean;
  cancelling: boolean;

  refreshing: boolean;
  onRefresh: () => void;
  onEndReached: () => void;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  contentPaddingBottom: number;
  cancellingId: string | null;
  accountsUnavailable?: boolean;
};

const TransferHistoryList = forwardRef<TransferHistoryListRef, Props>(function TransferHistoryList({
  data,
  onOpen,
  onCancel,
  canCancel,
  cancelling,
  refreshing,
  onRefresh,
  onEndReached,
  isFetchingNextPage,
  isInitialLoading,
  contentPaddingBottom,
  cancellingId,
  accountsUnavailable }: Props, ref: React.Ref<TransferHistoryListRef>) {
  const flatListRef = useRef<FlatList>(null);
  const onEndReachedCalledDuringMomentum = useRef(false);

  useImperativeHandle(ref, () => ({
    scrollToTop: () => flatListRef.current?.scrollToOffset({ offset: 0, animated: true }),
  }));

  const renderItem = useCallback(
    ({ item }: { item: ListRow }) => {
      if (item.kind === "header")
        return <TransferGroupHeader title={item.title} />;

      const transfer = item.transfer;
      return (
        <TransferHistoryRow
          transfer={transfer}
          onOpen={onOpen}
          onCancel={onCancel}
          canCancel={canCancel(transfer)}
          cancelling={cancellingId === transfer.id} // ✅ only this row
        />
      );
    },
    [onOpen, onCancel, canCancel, cancelling],
  );

  const ListEmptyComponent = useMemo(() => {
    if (isInitialLoading) return <TransactionSkeleton count={8} />;
    return <EmptyState unavailable={accountsUnavailable} />;
  }, [isInitialLoading, accountsUnavailable]);

  const handleEndReached = useCallback(() => {
    // ✅ Prevent repeated triggers while momentum scroll is active
    if (onEndReachedCalledDuringMomentum.current) return;

    // ✅ Don’t try to paginate while already fetching next page
    if (isFetchingNextPage) return;

    // ✅ If list is empty, FlatList can call onEndReached on mount -> ignore
    if (!data || data.length === 0) return;

    onEndReachedCalledDuringMomentum.current = true;
    onEndReached();
  }, [data, isFetchingNextPage, onEndReached]);

  return (
    <FlatList
      ref={flatListRef}
      style={{ flex: 1 }}
      data={data}
      keyExtractor={(item, index) => `${item.id}-${index}`}
      renderItem={renderItem}
      contentContainerStyle={{
        padding: 14,
        paddingBottom: contentPaddingBottom }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={BankingColors.primary}
          colors={[BankingColors.primary]}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
      onMomentumScrollBegin={() => {
        onEndReachedCalledDuringMomentum.current = false;
      }}
      ListEmptyComponent={ListEmptyComponent}
      ListFooterComponent={
        isFetchingNextPage ? (
          <View style={{ paddingTop: 8 }}>
            <TransactionSkeleton count={3} />
          </View>
        ) : null
      }
    />
  );
});

export default TransferHistoryList;
