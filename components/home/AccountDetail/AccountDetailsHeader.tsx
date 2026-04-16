import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, ChevronDown, Eye, EyeOff } from "lucide-react-native";
import { BankingColors, IconSize } from "@/constants";
import { SelectableAccount } from "@/types/selectable-account";
import { formatBalance } from "@/utils/account-formatters";
import { contentMaxWidth, headerGap, isLarge } from "@/constants/size-scale";
import { gradientColors } from "@/constants/banking-colors";

type Props = {
  insetsTop: number;
  account: SelectableAccount;
  onBack: () => void;

  // ✅ optional
  onOpenPicker?: () => void;

  styles: any;
  showBalance: boolean;
  onToggleBalance: () => void;
};

const masked = "••••••";

export default function AccountDetailsHeader({
  insetsTop,
  account,
  onBack,
  onOpenPicker,
  styles,
  showBalance,
  onToggleBalance }: Props) {
  const rib = account.ribFormatAccount || account.ibanFormatAccount || "-";

  const Wrapper: any = onOpenPicker ? TouchableOpacity : View;

  return (
    <LinearGradient
      colors={gradientColors as any}
      style={[styles.customHeader, { paddingTop: insetsTop + 10 }]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <View
        style={[
          styles.headerInner,
          isLarge && contentMaxWidth ? { maxWidth: contentMaxWidth } : null,
        ]}
      >
        <View style={[styles.headerRow, { gap: headerGap }]}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <ChevronLeft size={IconSize.lg} color={BankingColors.white} />
          </TouchableOpacity>

          <Wrapper
            style={styles.headerAccountCard}
            {...(onOpenPicker
              ? { onPress: onOpenPicker, activeOpacity: 0.9 }
              : {})}
          >
            <View style={styles.headerAccountContent}>
              <Text style={styles.headerAccountLabel} numberOfLines={1}>
                {account.accountTitle}
              </Text>

              <Text
                style={styles.headerAccountNumber}
                numberOfLines={1}
                ellipsizeMode="middle"
              >
                {rib}
              </Text>

              <Text style={styles.headerBalance} numberOfLines={1}>
                {showBalance
                  ? formatBalance(
                      account.availableBalance,
                      account.currencyAlphaCode,
                    )
                  : masked}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              {/* <TouchableOpacity
                onPress={onToggleBalance}
                hitSlop={10}
                activeOpacity={0.8}
              >
                {showBalance ? (
                  <Eye size={IconSize.md} color={BankingColors.white} />
                ) : (
                  <EyeOff size={IconSize.md} color={BankingColors.white} />
                )}
              </TouchableOpacity> */}

              {/* ✅ show chevron only if picker exists */}
              {onOpenPicker ? (
                <ChevronDown size={IconSize.md} color={BankingColors.white} />
              ) : null}
            </View>
          </Wrapper>
        </View>
      </View>
    </LinearGradient>
  );
}
