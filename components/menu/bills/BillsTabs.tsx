import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useTranslation } from "react-i18next";
import TText from "@/components/TText";

type Props = {
  activeTab: "payer" | "encaisser";
  onChange: (tab: "payer" | "encaisser") => void;
  styles: any; // comes from BillsScreen StyleSheet
};

export default function BillsTabs({ activeTab, onChange, styles }: Props) {
  const { t } = useTranslation();

  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "payer" && styles.tabActive]}
        onPress={() => onChange("payer")}
        activeOpacity={0.85}
      >
        <TText
          style={[
            styles.tabText,
            activeTab === "payer" && styles.tabTextActive,
          ]}
        >
          {t("bills.tabs.toPay")} {/* Mes effets à payer */}
        </TText>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "encaisser" && styles.tabActive]}
        onPress={() => onChange("encaisser")}
        activeOpacity={0.85}
      >
        <TText
          style={[
            styles.tabText,
            activeTab === "encaisser" && styles.tabTextActive,
          ]}
        >
          {t("bills.tabs.toCash")} {/* Mes effets à encaisser */}
        </TText>
      </TouchableOpacity>
    </View>
  );
}
