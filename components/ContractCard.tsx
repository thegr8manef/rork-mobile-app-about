import React from "react";
import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Info, Star, Trash2 } from "lucide-react-native";
import TText from "@/components/TText";
import { BillerContract } from "@/types/billers";
import {
  BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  FontFamily,
} from "@/constants";

interface ContractCardProps {
  contract: BillerContract;
  billerName: string;
  onPress: () => void;

  onToggleFavorite: () => void;
  onDelete?: () => void;

  pendingBillsCount?: number;
  logo?: string;
  disableActions?: boolean;
}

export default function ContractCard({
  contract,
  billerName,
  onPress,
  onToggleFavorite,
  onDelete,
  pendingBillsCount = 0,
  logo,
  disableActions = false,
}: ContractCardProps) {
  return (
    <Pressable
      style={styles.card}
      onPress={disableActions ? undefined : onPress}
      disabled={disableActions}
    >
      <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
        {!!onDelete && (
          <Pressable
            onPress={(e) => {
              e?.stopPropagation?.();
              if (!disableActions) onDelete?.();
            }}
            disabled={disableActions}
            hitSlop={18}
            style={({ pressed }) => [
              styles.trashButton,
              pressed && !disableActions && styles.pressed,
            ]}
          >
            <Trash2 size={IconSize.md} color={BankingColors.textGray} />
          </Pressable>
        )}

        <Pressable
          onPress={(e) => {
            e?.stopPropagation?.();
            if (!disableActions) onToggleFavorite();
          }}
          disabled={disableActions}
          hitSlop={18}
          style={({ pressed }) => [
            styles.starButton,
            pressed && !disableActions && styles.pressed,
          ]}
        >
          <Star
            size={IconSize.md}
            color={
              contract.isFavorite
                ? BankingColors.warning
                : BankingColors.disabled
            }
            fill={contract.isFavorite ? BankingColors.warning : "transparent"}
          />
        </Pressable>
      </View>

      <View style={styles.row}>
        <View style={styles.iconWrapper}>
          {!!logo ? (
            <Image
              source={{ uri: logo }}
              style={styles.icon}
              resizeMode="cover"
            />
          ) : (
            <Info size={40} color={"grey"} />
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.billerName}>{billerName ?? "-"}</Text>

          <Text style={styles.contractLabel} numberOfLines={1}>
            {contract.label ?? "-"}
          </Text>

          <Text style={styles.contractNumber}>
            N°{" "}
            {contract.searchCriterias
              ?.map((v) => v.searchCriteriaValue)
              ?.join(" ")}
          </Text>

          {pendingBillsCount > 0 && (
            <View style={styles.badge}>
              <TText
                tKey={
                  pendingBillsCount > 1
                    ? "bills.pendingBills"
                    : "bills.pendingBill"
                }
                style={styles.badgeText}
              >
                {pendingBillsCount}
              </TText>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    padding: 12,
    ...Shadow.card,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary,
    marginBottom: Spacing.md,
    position: "relative",
    paddingRight: 44,
    paddingBottom: 18,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: BankingColors.surface,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    flexShrink: 0,
  },

  icon: {
    width: 52,
    height: 52,
  },

  content: {
    flex: 1,
  },

  billerName: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: 2,
  },

  contractLabel: {
    fontSize: FontSize.sm,
    color: BankingColors.textGray,
    marginTop: 0,
    marginBottom: 2,
  },

  contractNumber: {
    fontSize: FontSize.base,
    color: BankingColors.textGray,
    marginBottom: 8,
  },

  badge: {
    alignSelf: "flex-start",
    backgroundColor: BankingColors.actionPeach,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.lg,
  },

  badgeText: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.medium,
  },

  trashButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 999,
    elevation: 10,
    padding: 4,
  },

  starButton: {
    position: "absolute",
    bottom: 10,
    right: 10,
    zIndex: 999,
    elevation: 10,
    padding: 4,
  },

  pressed: {
    opacity: 0.6,
  },
});
