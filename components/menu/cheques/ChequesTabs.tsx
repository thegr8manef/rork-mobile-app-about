import React from "react";
import { View, TouchableOpacity } from "react-native";
import TText from "@/components/TText";
import { useHaptic } from "@/utils/useHaptic";

type Props = {
  activeTab: "payer" | "encaisser";
  onChange: (tab: "payer" | "encaisser") => void;
  styles: any;
};

export default function ChequesTabs({ activeTab, onChange, styles }: Props) {
  const { triggerLightHaptic } = useHaptic();

  const handleTabChange = (tab: "payer" | "encaisser") => {
    triggerLightHaptic();
    onChange(tab);
  };

  return (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === "payer" && styles.tabActive]}
        onPress={() => handleTabChange("payer")}
      >
        <TText
          tKey="cheques.toPay"
          style={[
            styles.tabText,
            activeTab === "payer" && styles.tabTextActive,
          ]}
        />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.tab, activeTab === "encaisser" && styles.tabActive]}
        onPress={() => handleTabChange("encaisser")}
      >
        <TText
          tKey="cheques.toDeposit"
          style={[
            styles.tabText,
            activeTab === "encaisser" && styles.tabTextActive,
          ]}
        />
      </TouchableOpacity>
    </View>
  );
}
