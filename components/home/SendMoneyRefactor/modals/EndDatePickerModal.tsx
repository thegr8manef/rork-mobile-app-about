import React from "react";
import DatePicker from "react-native-date-picker";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { useTranslation } from "react-i18next";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

type Props = {
  visible: boolean;
  tempPickerDate: Date;
  onChange: (event: DateTimePickerEvent, selected?: Date) => void;
  onCancel: () => void;
  onConfirm: () => void;
  minimumDate: Date;
  maximumDate?: Date;
  styles: any;
};

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

export default function EndDatePickerModal({
  visible,
  tempPickerDate,
  onChange,
  onCancel,
  onConfirm,
  minimumDate,
  maximumDate,
  styles,
}: Props) {
  const { t, i18n } = useTranslation();
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  if (!visible) return null;
  return (
    <DatePicker
      modal
      open={visible}
      date={tempPickerDate}
      mode="date"
      minimumDate={minimumDate}
      maximumDate={maximumDate}
      locale={selectedLanguage ?? undefined}
      title={t("datePicker.title")}
      confirmText={t("common.confirm")}
      cancelText={t("common.cancel")}
      onConfirm={(date) => {
        onChange(makeEvent("set", date), date);
        onCancel(); // ✅ close sheet
      }}
      onCancel={() => {
        onChange(makeEvent("dismissed"), undefined);
        onCancel();
      }}
    />
  );
}
