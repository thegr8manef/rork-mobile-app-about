import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronDown, Eye, EyeOff } from "lucide-react-native";
import { gradientColors } from "@/constants/banking-colors";
import { BankingColors, IconSize } from "@/constants";

type TxAccount = {
  accountTitle?: string;
  accountNumber?: string;
  ribFormatAccount?: string;
  availableBalance?: string;
  currencyAccount?: { alphaCode: string };
  currencyAlphaCode?: string;
};

type Props = {
  insetsTop: number;
  account: TxAccount | null | undefined;
  onBack: () => void;
  onOpenPicker: () => void;
  styles: any;
  formatBalance: (balance: string, currency: string) => string;
  showBalance: boolean;
  onToggleBalance: () => void;
};

const masked = "••••••";

export default function CustomHeaderTransactions({
  insetsTop,
  account,
  onBack,
  onOpenPicker,
  styles,
  formatBalance,
  showBalance,
  onToggleBalance }: Props) {
  const title = account?.accountTitle?.trim() || "Sélectionner";
  const rib = account?.ribFormatAccount?.trim() || "-";
  const currency =
    account?.currencyAccount?.alphaCode || account?.currencyAlphaCode || "TND";
  const balance = account?.availableBalance ?? "0";

  return (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.customHeader, { paddingTop: insetsTop + 10 }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.headerAccountCard}
            onPress={onOpenPicker}
            activeOpacity={0.9}
          >
            <View style={styles.headerAccountContent}>
              <Text style={styles.headerAccountLabel} numberOfLines={1}>
                {title}
              </Text>

              <Text
                style={styles.headerAccountNumber}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {rib}
              </Text>

              <Text style={styles.headerBalance} numberOfLines={1}>
                {account
                  ? showBalance
                    ? formatBalance(balance, currency)
                    : masked
                  : masked}
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              {/* {!!account && (
                <TouchableOpacity
                  onPress={onToggleBalance}
                  hitSlop={10}
                  activeOpacity={0.8}
                >
                  {showBalance ? (
                    <Eye size={IconSize.md} color={BankingColors.white} />
                  ) : (
                    <EyeOff size={IconSize.md} color={BankingColors.white} />
                  )}
                </TouchableOpacity>
              )} */}

              <ChevronDown size={20} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
