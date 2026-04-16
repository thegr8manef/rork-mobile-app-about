import React, { useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react-native";
import { BankingColors } from "@/constants";
import TText from "@/components/TText";
import type { Account, Beneficiary } from "@/types/account.type";
import { formatBalance } from "@/utils/account-formatters";

type Props = {
  selectedBeneficiary: Beneficiary | null;
  toAccount: Account | null;
  onPress: () => void;
  styles: any;
  /** When true the picker border turns red (chapter validation failed on credit side) */
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

export default function ToAccountSection({
  selectedBeneficiary,
  toAccount,
  onPress,
  styles,
  hasChapterError = false }: Props) {
  const { t } = useTranslation();
  const title = useMemo(() => {
    if (selectedBeneficiary?.fullName) return selectedBeneficiary.fullName;
    if (toAccount?.accountLabel) return toAccount.accountLabel;
    return "";
  }, [selectedBeneficiary?.fullName, toAccount?.accountLabel]);

  const initial = useMemo(() => {
    return title.trim().charAt(0).toUpperCase() || "";
  }, [title]);

  const accountRib = useMemo(() => getAccountRib(toAccount), [toAccount]);

  return (
    <View style={styles.accountSection}>
      <TText tKey="Virements.creditAccount" style={styles.sectionTitle} />

      <TouchableOpacity
        style={[
          styles.accountPicker,
          hasChapterError && styles.accountPickerError,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        {selectedBeneficiary || toAccount ? (
          <View style={styles.accountInfo}>
            <View style={styles.accountIconSmall}>
              <Text style={styles.accountIconTextSmall}>{initial}</Text>
            </View>

            <View style={styles.accountDetails}>
              {selectedBeneficiary ? (
                <>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.accountName}
                  >
                    {selectedBeneficiary.fullName}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="middle"
                    style={styles.accountNumber}
                  >
                    {selectedBeneficiary.rib}
                  </Text>
                </>
              ) : (
                <>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.accountName}
                  >
                    {toAccount?.accountLabel ?? ""}
                  </Text>

                  {!!accountRib ? (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="middle"
                      style={styles.accountNumber}
                    >
                      {accountRib}
                    </Text>
                  ) : (
                    <Text
                      numberOfLines={1}
                      ellipsizeMode="tail"
                      style={styles.accountBalance}
                    >
                      {t("etransfer.balance")} :{" "}
                      {formatBalance(
                        toAccount?.availableBalance ?? "0",
                        toAccount?.currencyAccount?.alphaCode ?? "TND"
                      )}
                    </Text>
                  )}
                </>
              )}
            </View>
          </View>
        ) : (
          <TText tKey="Virements.selectRecipient" style={styles.placeholder} />
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
          tKey="sendMoney.error.creditNotAuthorized"
        />
      )}
    </View>
  );
}