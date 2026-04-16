import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { KeyRound } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AxiosError } from "axios";
import PinPad from "@/components/PinPad";
import { useUpdatePasswordConfirm } from "@/hooks/use-resetpassword";
import useShowMessage from "@/hooks/useShowMessage";
import { getErrorMapping } from "@/utils/api-error-mapper";
import { BankingColors } from "@/constants/banking-colors";

export default function ChangePasswordConfirmScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { requestId, newPassword } = useLocalSearchParams<{
    requestId: string;
    newPassword: string;
  }>();

  const [resetKey, setResetKey] = useState(0);

  const confirmMutation = useUpdatePasswordConfirm();
  const { showMessageSuccess, showMessageError } = useShowMessage();

  const handleComplete = (otp: string) => {
    if (!requestId || !newPassword) return;

    confirmMutation.mutate(
      {
        newPassword,
        requestId,
        confirmationType: "TOTP",
        confirmationValue: otp,
      },
      {
        onSuccess: () => {
          showMessageSuccess("common.success", "changePassword.success");
          router.navigate("/(root)/(tabs)/(menu)");
        },
        onError: (err: AxiosError) => {
          const data = err.response?.data as { errorCode?: string } | undefined;
          const { titleKey, descKey } = getErrorMapping(data?.errorCode);
          showMessageError(titleKey, descKey);
          setResetKey((k) => k + 1);
        },
      },
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <PinPad
        title={t("changePassword.otpTitle")}
        subtitle={t("changePassword.otpSubtitle")}
        digits={6}
        isLoading={confirmMutation.isPending}
        onComplete={handleComplete}
        resetKey={resetKey}
        icon={KeyRound}
        iconColor={BankingColors.primary}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
});
