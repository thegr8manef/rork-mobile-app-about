import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react-native";
import { BankingColors } from "@/constants";
import TText from "@/components/TText";
import type { Account } from "@/types/account.type";
import { formatBalance } from "@/utils/account-formatters";

type Props = {
  fromAccount: Account | null;
  onPress: () => void;
  styles: any;
  /** When true the picker border turns red (chapter validation failed on debit side) */
  hasChapterError?: boolean;
};

const getAccountRib = (a: Account | null | undefined) => {
  if (!a) return "";
  return (
    (a as any).ribFormatAccount ??
    (a as any).rib ??
    (a as any).accountRib ??
    ""
  );
};

export default function FromAccountSection({
  fromAccount,
  onPress,
  styles,
  hasChapterError = false }: Props) {
  const { t } = useTranslation();
  const initial = useMemo(() => {
    return (fromAccount?.accountLabel ?? "").trim().charAt(0).toUpperCase() || "";
  }, [fromAccount?.accountLabel]);

  const rib = useMemo(() => getAccountRib(fromAccount), [fromAccount]);

  return (
    <View style={styles.accountSection}>
      <TText tKey="Virements.debitAccount" style={styles.sectionTitle} />

      <TouchableOpacity
        style={[
          styles.accountPicker,
          hasChapterError && styles.accountPickerError,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {fromAccount ? (
          <View style={styles.accountInfo}>
            <View style={styles.accountIconSmall}>
              <Text style={styles.accountIconTextSmall}>{initial}</Text>
            </View>

            <View style={styles.accountDetails}>
              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.accountName}
              >
                {fromAccount.accountLabel}
              </Text>

              {!!rib ? (
                <Text
                  numberOfLines={1}
                  ellipsizeMode="middle"
                  style={styles.accountNumber}
                >
                  {rib}
                </Text>
              ) : null}

              <Text
                numberOfLines={1}
                ellipsizeMode="tail"
                style={styles.accountBalance}
              >
                {t("etransfer.balance")} :{" "}
                {formatBalance(
                  fromAccount.availableBalance,
                  fromAccount.currencyAccount?.alphaCode ?? "TND"
                )}
              </Text>
            </View>
          </View>
        ) : (
          <TText tKey="Virements.selectAccount" style={styles.placeholder} />
        )}

        <ChevronDown
          size={20}
          color={BankingColors.textSecondary}
          style={{ marginLeft: "auto" }}
        />
      </TouchableOpacity>

      {/* Show chapter error message under the picker */}
      {hasChapterError && (
        <TText
          style={styles.errorText}
          tKey="sendMoney.error.debitNotAuthorized"
        />
      )}
    </View>
  );
}