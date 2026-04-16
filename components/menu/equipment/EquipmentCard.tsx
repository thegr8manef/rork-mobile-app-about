import React, { memo } from "react";
import { View, TouchableOpacity, StyleSheet } from "react-native";
import { Package, ChevronRight } from "lucide-react-native";
import TText from "@/components/TText";
import {
  BankingColors,
  BorderRadius,
  Spacing,
  FontSize,
  IconSize,
  Shadow,
  FontFamily,
} from "@/constants";
import { ProductEquipment } from "@/types/account.type";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

interface Props {
  equipment: ProductEquipment;
  onPress: () => void;
}

const EquipmentCard = memo(({ equipment, onPress }: Props) => {
  //console.log("equipment:", equipment);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDate = (dateString?: string) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString(
      selectedLanguage ?? undefined,
    );
  };

  const getProductTypeKey = (isPack: boolean) => {
    switch (isPack) {
      case false:
        return "equipments.productTypeFile";
      case true:
        return "equipments.productTypeService";
      default:
        return undefined;
    }
  };

  const activeSubs = equipment.subscriptions.filter(
    (s) => !s.endDate || new Date(s.endDate) > new Date(),
  );

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.header}>
        <View style={styles.iconBox}>
          <Package size={24} color={BankingColors.primary} />
        </View>

        <View style={styles.headerContent}>
          <TText style={styles.title} numberOfLines={2}>
            {equipment.designation}
          </TText>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.row}>
          <TText style={styles.label} tKey="equipments.productType" />
          <TText style={styles.value}>
            {getProductTypeKey(equipment.isPack) ? (
              <TText tKey={getProductTypeKey(equipment.isPack)!} />
            ) : (
              "-"
            )}
          </TText>
        </View>

        {activeSubs.length > 0 && (
          <View style={styles.previewBox}>
            {/* <TText style={styles.previewLabel}>
              <TText tKey="equipments.lastSubscription" />{" "}
              {activeSubs[0].reference ? activeSubs[0].reference : "-"}
            </TText> */}

            {/* <TText style={styles.previewText}>
              <TText tKey="equipments.reference" />{" "}
              {activeSubs[0].invoiceAccount !== " "
                ? activeSubs[0].invoiceAccount
                : "-"}
            </TText> */}
            <TText style={styles.previewDate}>
              <TText tKey="equipments.since" />{" "}
              {formatDate(activeSubs[0].startDate)}
            </TText>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
});

export default EquipmentCard;

const styles = StyleSheet.create({
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: BankingColors.backgroundLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  headerContent: { flex: 1 },
  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
  },
  body: {
    padding: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: BankingColors.borderLight,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
  },
  label: { fontSize: FontSize.sm, color: BankingColors.textSecondary },
  value: { fontSize: FontSize.sm, fontFamily: FontFamily.semibold },
  highlight: { color: BankingColors.primary },
  previewBox: {
    marginTop: Spacing.md,
    backgroundColor: BankingColors.backgroundLight,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  previewLabel: { fontSize: FontSize.sm, color: BankingColors.textSecondary },
  previewText: { marginTop: 3, fontFamily: FontFamily.semibold },
  previewDate: { fontSize: FontSize.xs, color: BankingColors.textLight },
});
