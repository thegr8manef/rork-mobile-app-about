import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { useTranslation } from "react-i18next";
import type { TransferType } from "../types";

type Props = {
  transferType: TransferType;
  onChange: (t: TransferType) => void;
  styles: any;
};

export default function TransferTypeSection({
  transferType,
  onChange,
  styles }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.section}>
      <Text style={styles.fieldLabel}>
        {t("sendMoney.transferTypeLabel", "Sélectionner le type de virement")}
      </Text>

      <View style={styles.transferTypeToggle}>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            transferType === "ponctuel" && styles.toggleButtonActive,
          ]}
          onPress={() => onChange("ponctuel")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: transferType === "ponctuel" }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              transferType === "ponctuel" && styles.toggleButtonTextActive,
            ]}
          >
            {t("sendMoney.transferType.once", "Ponctuel")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.toggleButton,
            transferType === "permanent" && styles.toggleButtonActive,
          ]}
          onPress={() => onChange("permanent")}
          activeOpacity={0.85}
          accessibilityRole="button"
          accessibilityState={{ selected: transferType === "permanent" }}
        >
          <Text
            style={[
              styles.toggleButtonText,
              transferType === "permanent" && styles.toggleButtonTextActive,
            ]}
          >
            {t("sendMoney.transferType.permanent", "Permanent")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
