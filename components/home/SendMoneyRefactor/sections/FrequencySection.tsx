import React from "react";
import { View, TouchableOpacity, TextInput } from "react-native";
import { Calendar } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BankingColors } from "@/constants";
import type { FieldErrors } from "react-hook-form";
import type { FormValues, Frequency } from "../types";
import { formatDateFR } from "../utils";
import TText from "@/components/TText";

type Props = {
  frequency: Frequency;
  onFrequencyChange: (f: Frequency) => void;
  endDate?: Date;
  onEndDatePress: () => void;
  errors: FieldErrors<FormValues>;
  styles: any;
};

export default function FrequencySection({
  frequency,
  onFrequencyChange,
  endDate,
  onEndDatePress,
  errors,
  styles }: Props) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.section}>
        <TText tKey="sendMoney.frequency.label" style={styles.fieldLabel} />

        <View style={styles.frequencyContainer}>
          <TouchableOpacity
            style={[
              styles.frequencyPill,
              frequency === "mensuelle" && styles.frequencyPillActive,
            ]}
            onPress={() => onFrequencyChange("mensuelle")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: frequency === "mensuelle" }}
          >
            <TText
              tKey="sendMoney.frequency.monthly"
              style={[
                styles.frequencyPillText,
                frequency === "mensuelle" && styles.frequencyPillTextActive,
              ]}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.frequencyPill,
              frequency === "annuelle" && styles.frequencyPillActive,
            ]}
            onPress={() => onFrequencyChange("annuelle")}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: frequency === "annuelle" }}
          >
            <TText
              tKey="sendMoney.frequency.annual"
              style={[
                styles.frequencyPillText,
                frequency === "annuelle" && styles.frequencyPillTextActive,
              ]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <TText tKey="sendMoney.endDate.label" style={styles.fieldLabel} />

        <TouchableOpacity
          style={styles.datePickerButton}
          activeOpacity={0.8}
          onPress={onEndDatePress}
        >
          <TextInput
            style={styles.dateInput}
            value={formatDateFR(endDate)}
            placeholder={t("sendMoney.endDate.placeholder")}
            placeholderTextColor={BankingColors.textLight}
            editable={false}
            contextMenuHidden
            pointerEvents="none"
            textAlignVertical="center"
          />

          <View style={styles.calendarIconContainer}>
            <Calendar size={20} color={BankingColors.primary} />
          </View>
        </TouchableOpacity>

        {!!errors.endDate?.message && (
          <TText
            style={styles.errorText}
            tKey={String(errors.endDate.message)}
          />
        )}
      </View>
    </>
  );
}
