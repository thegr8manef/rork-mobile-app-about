import React, { useMemo } from "react";
import { View, TextInput, TouchableOpacity, ActivityIndicator } from "react-native";
import { User, Edit3, CheckCircle2 } from "lucide-react-native";
import { BankingColors } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { accountLabelSchema } from "@/validation/accountLabelSchema";

type Props = {
  styles: any;
  isEditing: boolean;
  isUpdating: boolean;
  value: string;
  onChange: (v: string) => void;
  onEdit: () => void;
  onSave: () => void;
};

export default function LabelCard({
  styles,
  isEditing,
  isUpdating,
  value,
  onChange,
  onEdit,
  onSave }: Props) {
  const { t } = useTranslation();

  const sanitized = useMemo(() => {
    const parsed = accountLabelSchema.safeParse({ accountLabel: value });
    return parsed.success ? parsed.data.accountLabel : value;
  }, [value]);

  const handleChange = (txt: string) => {
    // sanitize live (no error spam)
    const parsed = accountLabelSchema.safeParse({ accountLabel: txt });
    onChange(parsed.success ? parsed.data.accountLabel : txt.slice(0, 50));
  };

  const canSave = !!sanitized.trim().length && sanitized.trim().length <= 50;

  return (
    <View style={styles.labelSection}>
      <View style={styles.labelCard}>
        <View style={styles.labelHeader}>
          <User size={20} color={BankingColors.primary} />
          <TText style={styles.labelTitle} tKey="accountDetails.labelTitle" />
        </View>

        {isEditing ? (
          <View style={styles.labelEditContainer}>
            <TextInput
              style={styles.labelInput}
              value={value}
              onChangeText={handleChange}
              autoFocus
              placeholder={t("accountDetails.labelPlaceholder")}
              placeholderTextColor={BankingColors.textSecondary}
              contextMenuHidden
              maxLength={50}
            />

            <TouchableOpacity
              style={[styles.labelSaveButton, (!canSave || isUpdating) && { opacity: 0.6 }]}
              onPress={onSave}
              disabled={!canSave || isUpdating}
              activeOpacity={0.7}
            >
              {isUpdating ? (
                <ActivityIndicator size="small" color={BankingColors.white} />
              ) : (
                <CheckCircle2 size={18} color={BankingColors.white} />
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.labelDisplayContainer}>
            <TText style={styles.labelValue} numberOfLines={2}>
              {sanitized}
            </TText>

            <TouchableOpacity style={styles.labelEditButton} onPress={onEdit}>
              <Edit3 size={18} color={BankingColors.primary} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}
