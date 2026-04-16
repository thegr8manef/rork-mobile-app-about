import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Copy, CheckCircle2 } from "lucide-react-native";
import { BankingColors } from "@/constants";

type Props = {
  styles: any;
  icon: React.ReactNode;
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  numberOfLines?: number;
};

export default function DetailRow({
  styles,
  icon,
  label,
  value,
  copied,
  onCopy,
  numberOfLines = 1 }: Props) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailLeft}>
        {icon}
        <View style={styles.detailTextContainer}>
          <Text style={styles.detailLabel}>{label}</Text>
          <Text
            style={styles.detailValue}
            numberOfLines={numberOfLines}
            ellipsizeMode="middle"
          >
            {value}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.copyIconButton, copied && styles.copyIconButtonSuccess]}
        onPress={onCopy}
        activeOpacity={0.7}
      >
        {copied ? (
          <CheckCircle2 size={18} color={BankingColors.success} />
        ) : (
          <Copy size={18} color={BankingColors.primary} />
        )}
      </TouchableOpacity>
    </View>
  );
}
