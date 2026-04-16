import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Pressable,
} from "react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";
import { useHaptic } from "@/utils/useHaptic";
import { formatBalance } from "@/utils/account-formatters";

type PaymentStatus = "PAID" | "INIT" | "REJECTED";

interface PaymentCardProps {
  logo?: string;
  reference: string;
  date: string;
  amount: string;
  transactionStatus: PaymentStatus;
  onPress?: () => void;
}

export default function PaymentCard({
  logo,
  reference,
  date,
  amount,
  transactionStatus,
  onPress,
}: PaymentCardProps) {
  const { triggerLightHaptic } = useHaptic();

  const handlePress = () => {
    triggerLightHaptic();
    onPress?.();
  };

  const getStatusColor = () => {
    switch (transactionStatus) {
      case "PAID":
        return "#10B981";
      case "REJECTED":
        return "#EF4444";
      case "INIT":
      default:
        return "#F59E0B";
    }
  };

  const renderStatusLabel = () => {
    switch (transactionStatus) {
      case "PAID":
        return <TText tKey="billers.paid" />;
      case "REJECTED":
        return <TText tKey="bills.failed" />;
      case "INIT":
      default:
        return <TText tKey="bills.inProgress" />;
    }
  };

  const statusColor = getStatusColor();

  return (
    <Pressable style={styles.container}>
      <View style={[styles.borderLeft, { backgroundColor: statusColor }]} />

      <View style={styles.iconWrapper}>
        {logo ? (
          <Image
            source={{ uri: logo }}
            style={styles.icon}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.iconFallback} />
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.reference}>
          <TText tKey="contract.reference" />{" "}
          {reference ? `${reference.slice(-5)}...` : "---"}
        </Text>
        <Text style={styles.date}>{date}</Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.amount}>{formatBalance(amount, "TND")}</Text>
        <Text style={[styles.statusText, { color: statusColor }]}>
          {renderStatusLabel()}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.border,
    position: "relative",
    ...Shadow.card,
  },
  borderLeft: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: Spacing.xs,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  iconWrapper: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.lg,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    marginLeft: Spacing.sm,
  },
  icon: {
    width: IconSize.huge,
    height: IconSize.huge,
  },
  iconFallback: {
    width: IconSize.huge,
    height: IconSize.huge,
    backgroundColor: BankingColors.surfaceSecondary,
  },
  info: {
    flex: 1,
  },
  reference: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  date: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  right: {
    alignItems: "flex-end",
  },
  amount: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  statusText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },
});
