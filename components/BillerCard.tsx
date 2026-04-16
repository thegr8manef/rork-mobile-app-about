import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { ChevronRight } from "lucide-react-native";
import TText from "@/components/TText";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  AvatarSize,
  FontFamily,
} from "@/constants";
import { Biller } from "@/types/billers";
import { t } from "i18next";
interface BillerCardProps {
  biller: Biller;
  onPress: () => void;
  contractCount?: number;
}

export default function BillerCard({
  biller,
  onPress,
  contractCount = 0,
}: BillerCardProps) {
  const getBillersName = (billerName: string): string => {
    const labels: Record<string, string> = {
      STEG: "billers.name.steg",
      SONEDE: "billers.name.sonede",
      "Société Tunisie Autoroutes": "billers.name.sta",
      TOPNET: "billers.name.topnet",
      "Tunisie Telecom": "billers.name.tt",
      CNSS: "billers.name.cnss",
    };
    return labels[billerName];
  };

  const getCategoryLabel = (category: string): string => {
    const labels: Record<string, string> = {
      "Energie et Eau": "billers.category.waterElectricity",
      "Internet et Téléphonie": "billers.category.telephonyInternet",
      Transport: "billers.category.transport",
    };
    return labels[category];
  };
  const categoryLabelKey = getCategoryLabel(
    biller.billerCategory.categoryLabel,
  );
  const billerName = getBillersName(biller.billerLabel);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {biller.billerIcon && (
        <Image source={{ uri: biller.billerIcon }} style={styles.logo} />
      )}
      <View style={styles.content}>
        <Text style={styles.name}>{t(billerName)}</Text>
        <Text style={styles.category}>{t(categoryLabelKey) || ""}</Text>
        {contractCount > 0 && (
          <TText
            tKey={contractCount > 1 ? "bills.contracts" : "bills.contract"}
            style={styles.contractCount}
          >
            {" " + contractCount}
          </TText>
        )}
      </View>
      <ChevronRight size={IconSize.md} color={BankingColors.disabled} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row" as const,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center" as const,
    ...Shadow.card,
  },
  logo: {
    width: AvatarSize.lg,
    height: AvatarSize.lg,
    borderRadius: AvatarSize.lg / 2,
    marginRight: Spacing.md,
    backgroundColor: BankingColors.surfaceSecondary,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: Spacing.xs,
  },
  category: {
    fontSize: FontSize.base,
    color: BankingColors.textGray,
    marginBottom: 2,
  },
  contractCount: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.medium,
  },
});
