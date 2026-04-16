import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AccountDetailsHeader from "@/components/home/AccountDetail/AccountDetailsHeader";

import type { SelectableAccount } from "@/types/selectable-account";
import BillsHeaderSkeleton from "./BillsHeaderSkeleton";

type Props = {
  isLoading: boolean;
  account?: SelectableAccount;
  onBack: () => void;
  onOpenPicker: () => void;
  styles: any;
};

export default function BillsHeader({
  isLoading,
  account,
  onBack,
  onOpenPicker,
  styles }: Props) {
  const insets = useSafeAreaInsets();

  // Show skeleton while accounts are loading OR account not ready yet
  if ( !account) {
    return <BillsHeaderSkeleton insetsTop={insets.top} />;
  }

  return (
    <AccountDetailsHeader
      insetsTop={insets.top}
      account={account}
      onBack={onBack}
      onOpenPicker={onOpenPicker}
      styles={styles}
    />
  );
}
