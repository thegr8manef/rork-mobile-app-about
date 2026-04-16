import React from "react";
import { View, Text, TouchableOpacity, TextInput } from "react-native";
import { Calendar } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BankingColors } from "@/constants";
import type { FieldErrors } from "react-hook-form";
import type { FormValues, TransferType } from "../types";
import { formatDateFR } from "../utils";
import TText from "@/components/TText";

type Props = {
  executionDate?: Date;
  errors: FieldErrors<FormValues>;
  onPress: () => void;
  styles: any;
  tranferType: TransferType;
};

export default function ExecutionDateSection({
  executionDate,
  errors,
  onPress,
  styles,
  tranferType }: Props) {
  const { t } = useTranslation();
  // console.log("🚀 ~ ExecutionDateSection ~ tranferType:", tranferType);

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>
        {tranferType === "permanent"
          ? t("etransfer.startExecutionDate")
          : t("sendMoney.executionDate.label")}
      </Text>

      <TouchableOpacity
        style={styles.datePickerButton}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <TextInput
          style={styles.dateInput}
          value={formatDateFR(executionDate)}
          placeholder={t("sendMoney.executionDate.placeholder", "JJ/MM/AAAA")}
          placeholderTextColor={BankingColors.textSecondary}
          editable={false}
          contextMenuHidden
          pointerEvents="none" // ✅ prevent focusing (Android)
          textAlignVertical="center"
        />

        <View style={styles.calendarIconContainer}>
          <Calendar size={20} color={BankingColors.primary} />
        </View>
      </TouchableOpacity>

      {!!errors.executionDate?.message && (
        <TText
          style={styles.errorText}
          tKey={String(errors.executionDate.message)}
        />
      )}
    </View>
  );
}
