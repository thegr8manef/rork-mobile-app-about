import React from "react";
import DatePicker from "react-native-date-picker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Props = {
  visible: boolean;
  tempPickerDate: Date;
  onChange: (event: DateTimePickerEvent, selected?: Date) => void; // ✅ KEEP SAME
  onCancel: () => void; // close modal
  onConfirm: () => void; // apply selection (iOS header OK)
  minimumDate: Date;
  styles: any;
};

// ✅ helper to keep your VM logic unchanged
function makeEvent(
  type: "set" | "dismissed",
  date?: Date,
): DateTimePickerEvent {
  return {
    type,
    nativeEvent: {
      timestamp: date ? date.getTime() : Date.now(),
      utcOffset: 0,
    },
  } as unknown as DateTimePickerEvent;
}

const pickerLocale = (lng: string) => (lng || "fr").split("-")[0]; // "fr-FR" -> "fr"

export default function ExecutionDatePickerModal({
  visible,
  tempPickerDate,
  onChange,
  onCancel,
  onConfirm,
  minimumDate,
  styles,
}: Props) {
  const { t, i18n } = useTranslation();
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  if (!visible) return null;

  // ✅ ANDROID: use DatePicker modal

  return (
    <DatePicker
      modal
      open={visible}
      date={tempPickerDate}
      mode="date"
      minimumDate={minimumDate}
      locale={selectedLanguage ?? undefined}
      title={t("datePicker.title", { defaultValue: "Choisir une date" })}
      confirmText={t("common.confirm", { defaultValue: "OK" })}
      cancelText={t("common.cancel", { defaultValue: "Annuler" })}
      onConfirm={(date) => {
        onChange(makeEvent("set", date), date);
      }}
      onCancel={() => {
        onChange(makeEvent("dismissed"), undefined);
        onCancel();
      }}
    />
  );
}
