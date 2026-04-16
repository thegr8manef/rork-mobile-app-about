import React, { useState, useEffect, useMemo, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";
import { ChevronDown, Building2, Calendar, Info } from "lucide-react-native";
import DatePicker from "react-native-date-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";

import type {
  CreateAlertRequest,
  UpdateAlertRequest,
} from "@/types/notification.type";
import type { AlertType, ReceptionChannel } from "@/types/notifications";

import {
  BankingColors,
  BorderRadius,
  FontSize,
  Spacing,
  FontFamily,
} from "@/constants";

import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import type { SelectableAccount } from "@/types/selectable-account";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import TText from "@/components/TText";
import { AlertFormField } from "@/components/menu/alerts/AlertFormField";
import CustomButton from "@/components/CustomButton";
import {
  useAlerts,
  useCreateAlert,
  useUpdateAlert,
  useEnableAlert,
} from "@/hooks/use-notifications";
import { useTranslation } from "react-i18next";
import { formatBalance } from "@/utils/account-formatters";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

/** UI format: DD/MM/YYYY */
function formatDDMMYYYY(d: Date) {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Parse UI date DD/MM/YYYY -> Date */
function parseDDMMYYYY(s: string): Date | null {
  if (!s) return null;
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const d = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const y = Number(m[3]);
  const dt = new Date(y, mo, d);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/** API format: YYYY-MM-DD */
function formatYYYYMMDD(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Parse API date (YYYY-MM-DD or ISO) -> Date */
function parseApiDateToDate(s: string): Date | null {
  if (!s) return null;

  // If it's already YYYY-MM-DD
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (m) {
    const y = Number(m[1]);
    const mo = Number(m[2]) - 1;
    const d = Number(m[3]);
    const dt = new Date(y, mo, d);
    return Number.isNaN(dt.getTime()) ? null : dt;
  }

  // fallback to Date parsing (ISO, etc.)
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

/**
 * Robust name getter (backend might not always use "name")
 * (Used only for create-mode validation + create payload.)
 */
function getAlertName(a: any): string {
  return (
    a?.name ?? a?.alertName ?? a?.label ?? a?.title ?? a?.designation ?? ""
  );
}
export default function CreateAlertScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const alertId = params.alertId as string | undefined;

  const { data: alertsRes } = useAlerts();
  const alerts = alertsRes?.data ?? [];

  const createAlertMutation = useCreateAlert();
  const updateAlertMutation = useUpdateAlert();
  const enableAlertMutation = useEnableAlert(); // ✅ activate after create

  const { data: accounts, isLoading: isAccountsLoading } =
    useCustomerAccounts();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    // name: "",
    type: "overMvtC" as AlertType,
    accountId: "",
    minAmount: "",
    maxAmount: "",
    endDate: "",
  });
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const minIncidentDate = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const existingAlert = useMemo(
    () => (alertId ? alerts.find((a) => a.id === alertId) : undefined),
    [alertId, alerts],
  );

  const isEditing = !!(alertId && existingAlert);

  /**
   * ✅ Hydrate edit form only ONCE
   * (prevents wiping user edits on refetch)
   */
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (!existingAlert) return;
    if (hydratedRef.current) return;
    hydratedRef.current = true;

    const endDt = existingAlert.endDate
      ? parseApiDateToDate(existingAlert.endDate)
      : null;

    setFormData({
      type: existingAlert.type as any,
      accountId: existingAlert.accountId,
      minAmount: existingAlert.minAmount?.toString() || "",
      maxAmount: existingAlert.maxAmount?.toString() || "",
      endDate: endDt ? formatDDMMYYYY(endDt) : "",
    });
  }, [existingAlert]);

  const getAccountName = (accountId: string) => {
    const account = accounts?.data?.find((a) => a.id === accountId);
    return account
      ? account.accountLabel
      : t("notifications.selectAccountPlaceholder");
  };

  const getAccountBalance = (accountId: string) => {
    const account = accounts?.data?.find((a) => a.id === accountId);
    return account
      ? formatBalance(
          account.availableBalance,
          account.currencyAccount.alphaCode,
        )
      : "";
  };

  // @ts-ignore
  const selectableAccounts: SelectableAccount[] =
    accounts?.data?.map((acc) => ({
      id: acc.id,
      accountNumber: acc.accountNumber || "",
      accountTitle: acc.accountLabel || "",
      ribFormatAccount: acc.accountRib || "",
      ibanFormatAccount: acc.accountRib || "",
      accountingBalance: String(acc.accountingBalance || 0),
      availableBalance: String(acc.availableBalance || 0),
      currencyAlphaCode: acc.currencyAccount.alphaCode || "TND",
      branchDesignation: acc.branch.code || "",
    })) ?? [];

  const selectedDate = parseDDMMYYYY(formData.endDate) ?? new Date();

  // ✅ Effective values (edit mode keeps existing if user cleared)
  const effectiveAccountId = isEditing
    ? formData.accountId || existingAlert!.accountId || ""
    : formData.accountId || "";

  const effectiveEndDateUI = isEditing
    ? formData.endDate ||
      (() => {
        const endDt = existingAlert?.endDate
          ? parseApiDateToDate(existingAlert.endDate)
          : null;
        return endDt ? formatDDMMYYYY(endDt) : "";
      })()
    : formData.endDate;

  const effectiveMinAmountStr = isEditing
    ? formData.minAmount.trim() ||
      (existingAlert?.minAmount != null ? String(existingAlert.minAmount) : "")
    : formData.minAmount.trim();

  const effectiveMaxAmountStr = isEditing
    ? formData.maxAmount.trim() ||
      (existingAlert?.maxAmount != null ? String(existingAlert.maxAmount) : "")
    : formData.maxAmount.trim();

  // const effectiveName = formData.name.trim(); // used ONLY for create mode

  const handleSave = () => {
    const newErrors: Record<string, string> = {};

    // ✅ In editing: no name field, so no name validation
    if (!isEditing) {
      // if (!effectiveName) newErrors.name = t("notifications.requiredFields");
    }

    if (!effectiveAccountId) {
      newErrors.accountId = t("notifications.requiredFields");
    }
    if (!effectiveEndDateUI) {
      newErrors.endDate = t("notifications.requiredFields");
    }
    if (!effectiveMinAmountStr) {
      newErrors.minAmount = t("notifications.requiredFields");
    }
    if (!effectiveMaxAmountStr) {
      newErrors.maxAmount = t("notifications.requiredFields");
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    const today = formatYYYYMMDD(new Date());

    const endDateObj = parseDDMMYYYY(effectiveEndDateUI);
    const endDate = endDateObj ? formatYYYYMMDD(endDateObj) : "";

    const minAmount = Number(effectiveMinAmountStr);
    const maxAmount = Number(effectiveMaxAmountStr);

    const receptionChannels = ["push"] as ReceptionChannel[];

    const contactDetails = {
      email: "test@mail.com",
      phoneNumber: "00000000",
    };

    // ✅ UPDATE
    if (alertId && existingAlert) {
      const payload: UpdateAlertRequest = {
        alertId,
        accountId: effectiveAccountId, // ✅ allow change
        type: formData.type as any,
        minAmount,
        maxAmount,
        startDate: today,
        endDate,
        receptionChannels: receptionChannels as any,
        contactDetails,
      };

      updateAlertMutation.mutate({ body: payload, alertId });
      router.back();
      return;
    }

    // ✅ CREATE
    const payload: CreateAlertRequest = {
      accountId: effectiveAccountId,
      type: formData.type as any,
      minAmount,
      maxAmount,
      startDate: today,
      endDate,
      receptionChannels: receptionChannels as any,
      contactDetails,
      // ...(effectiveName ? ({ name: effectiveName } as any) : {})
    };

    // ✅ Create then Enable then back
    createAlertMutation.mutate(payload, {
      onSuccess: (res: any) => {
        const createdId =
          res?.data?.id ?? res?.id ?? res?.data?.data?.id ?? res?.data?.alertId;

        if (createdId) {
          enableAlertMutation.mutate(createdId, {
            onSettled: () => router.back(),
          });
          return;
        }

        router.back();
      },
      onError: () => {
        // keep behavior; errors already handled by mutation layer if any
      },
    });
  };

  // ✅ Disable logic: in edit mode, don't require name
  const saveDisabled = isEditing
    ? !effectiveAccountId ||
      !effectiveEndDateUI ||
      !effectiveMinAmountStr ||
      !effectiveMaxAmountStr
    : !effectiveAccountId ||
      !effectiveEndDateUI ||
      !effectiveMinAmountStr ||
      !effectiveMaxAmountStr;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              title={
                alertId
                  ? t("notifications.editAlert")
                  : t("notifications.createAlert")
              }
            />
          ),
        }}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={32}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        {/* ✅ ALERT NAME (hidden in edit mode) */}
        {/* {!isEditing && (
          <View style={styles.formGroup}>
            <AlertFormField
              labelTKey="notifications.alertNameRequired"
              label=""
              value={formData.name}
              onChangeText={(text) => {
                setFormData({ ...formData, name: text });
                if (errors.name) setErrors({ ...errors, name: "" });
              }}
              placeholder={
                t("notifications.alertNamePlaceholder") || "Nom de l’alerte"
              }
              keyboardType="default"
              error={errors.name}
            />
          </View>
        )} */}

        {/* TYPE */}
        <View style={styles.formGroup}>
          <TText style={styles.formLabel} tKey="notifications.movementType" />

          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[
                styles.segmentButton,
                formData.type === "overMvtD" && styles.segmentButtonActive,
              ]}
              onPress={() =>
                setFormData({ ...formData, type: "overMvtD" as any })
              }
              activeOpacity={0.8}
            >
              <TText
                style={[
                  styles.segmentText,
                  formData.type === "overMvtD" && styles.segmentTextActive,
                ]}
                tKey="notifications.debitMovement"
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segmentButton,
                formData.type === "overMvtC" && styles.segmentButtonActive,
              ]}
              onPress={() =>
                setFormData({ ...formData, type: "overMvtC" as any })
              }
              activeOpacity={0.8}
            >
              <TText
                style={[
                  styles.segmentText,
                  formData.type === "overMvtC" && styles.segmentTextActive,
                ]}
                tKey="notifications.creditMovement"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ACCOUNT */}
        <View style={styles.formGroup}>
          <TText
            style={styles.formLabel}
            tKey="notifications.selectAccountRequired"
          />

          <TouchableOpacity
            style={[
              styles.accountSelectorCard,
              errors.accountId ? styles.accountSelectorError : null,
            ]}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.8}
          >
            <View style={styles.accountIconCircle}>
              <Building2 size={20} color={BankingColors.primary} />
            </View>

            <View style={styles.accountDetails}>
              <TText style={styles.accountNameText}>
                {formData.accountId
                  ? getAccountName(formData.accountId)
                  : t("notifications.selectAccountPlaceholder")}
              </TText>

              {formData.accountId && (
                <TText style={styles.accountBalanceText}>
                  {getAccountBalance(formData.accountId)}
                </TText>
              )}
            </View>

            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>

          {errors.accountId && (
            <TText style={styles.errorText}>{errors.accountId}</TText>
          )}
        </View>

        {/* INFO CARD */}
        <View style={styles.infoCard}>
          <View style={styles.infoIconContainer}>
            <Info size={20} color={BankingColors.primary} />
          </View>
          <View style={styles.infoTextContainer}>
            <TText
              tKey="notifications.amountInfo.title"
              style={styles.infoTitle}
            />
            <TText
              tKey="notifications.amountInfo.description"
              style={styles.infoDescription}
            />
          </View>
        </View>

        {/* AMOUNTS */}
        <View style={styles.formRow}>
          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <AlertFormField
              labelTKey="notifications.minAmountRequired"
              label=""
              value={formData.minAmount}
              onChangeText={(text) => {
                setFormData({ ...formData, minAmount: text });
                if (errors.minAmount) setErrors({ ...errors, minAmount: "" });
              }}
              placeholder="0.000"
              keyboardType="numeric"
              error={errors.minAmount}
            />
          </View>

          <View style={[styles.formGroup, styles.formGroupHalf]}>
            <AlertFormField
              labelTKey="notifications.maxAmountRequired"
              label=""
              value={formData.maxAmount}
              onChangeText={(text) => {
                setFormData({ ...formData, maxAmount: text });
                if (errors.maxAmount) setErrors({ ...errors, maxAmount: "" });
              }}
              placeholder="0.000"
              keyboardType="numeric"
              error={errors.maxAmount}
            />
          </View>
        </View>

        {/* DEADLINE */}
        <View style={styles.formGroup}>
          <View style={styles.labelContainer}>
            <TText
              style={styles.formLabel}
              tKey="notifications.deadlineRequired"
            />
          </View>

          <TouchableOpacity
            style={[
              styles.dateField,
              errors.endDate ? styles.dateFieldError : null,
            ]}
            onPress={() => setDatePickerOpen(true)}
            activeOpacity={0.8}
          >
            <Calendar
              size={18}
              color={errors.endDate ? "#ef4444" : BankingColors.textSecondary}
            />
            <TText
              style={[
                styles.dateValue,
                !formData.endDate && styles.datePlaceholder,
              ]}
            >
              {formData.endDate ? formData.endDate : "JJ/MM/AAAA"}
            </TText>
          </TouchableOpacity>

          {errors.endDate && (
            <TText style={styles.errorText}>{errors.endDate}</TText>
          )}

          <DatePicker
            modal
            mode="date"
            open={datePickerOpen}
            date={selectedDate}
            locale={selectedLanguage ?? undefined}
            minimumDate={minIncidentDate}
            confirmText={t("datePicker.confirmText")}
            cancelText={t("datePicker.cancelText")}
            title={t("datePicker.title")}
            onConfirm={(date) => {
              setDatePickerOpen(false);
              setFormData({ ...formData, endDate: formatDDMMYYYY(date) });
              if (errors.endDate) setErrors({ ...errors, endDate: "" });
            }}
            onCancel={() => setDatePickerOpen(false)}
          />
        </View>

        {/* ACTIONS */}
        <View style={styles.actions}>
          <CustomButton
            tKey="common.cancel"
            onPress={() => router.back()}
            variant="secondary"
            icon={() => null}
            style={{
              flex: 1,
              borderRadius: 12,
              backgroundColor: BankingColors.white,
              borderColor: BankingColors.border,
            }}
            textStyle={{
              color: BankingColors.text,
              fontFamily: FontFamily.bold,
            }}
          />
          <CustomButton
            style={[
              styles.saveButton,
              saveDisabled && styles.saveButtonDisabled,
            ]}
            textStyle={{
              color: BankingColors.white,
              fontFamily: FontFamily.bold,
            }}
            onPress={handleSave}
            disabled={saveDisabled}
            tKey={
              alertId
                ? "notifications.updateButton"
                : "notifications.createButton"
            }
            loading={
              createAlertMutation.isPending ||
              updateAlertMutation.isPending ||
              enableAlertMutation.isPending
            }
          />
        </View>
      </KeyboardAwareScrollView>

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={formData.accountId}
        onSelect={(accountId) => {
          setFormData({ ...formData, accountId });
          setErrors({ ...errors, accountId: "" });
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={t("notifications.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  formGroup: { marginBottom: 20 },
  formGroupHalf: { flex: 1 },
  formRow: { flexDirection: "row", gap: 12 },

  formLabel: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#1a1a1a",
    marginBottom: 6,
  },
  labelContainer: { flexDirection: "row", marginBottom: 10 },
  optionalText: { fontSize: 15, color: "#666" },

  accountSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 12,
  },
  accountSelectorError: { borderColor: "#ef4444" },
  errorText: { fontSize: 13, color: "#ef4444", marginTop: 6 },

  accountIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  accountDetails: { flex: 1 },
  accountNameText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#1a1a1a",
    marginBottom: 3,
  },
  accountBalanceText: { fontSize: 13, color: BankingColors.textSecondary },

  segmentedControl: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    overflow: "hidden",
    backgroundColor: "#fff",
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  segmentButtonActive: { backgroundColor: BankingColors.primary },
  segmentText: { fontSize: 15, fontFamily: FontFamily.semibold, color: "#666" },
  segmentTextActive: { color: "#fff" },

  dateField: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateValue: { fontSize: 15, fontFamily: FontFamily.medium, color: "#1a1a1a" },
  datePlaceholder: { color: "#999" },
  dateFieldError: { borderColor: "#ef4444" },

  actions: { flexDirection: "row", gap: 12, marginTop: 12 },

  cancelButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: BankingColors.white,
    color: "black",
  },

  saveButton: {
    flex: 1,
    borderRadius: 12,
    backgroundColor: BankingColors.primary,
  },
  saveButtonDisabled: { opacity: 0.5 },

  infoCard: {
    flexDirection: "row",
    backgroundColor: BankingColors.primary + "10",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: BankingColors.primary,
    gap: 12,
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  infoTextContainer: { flex: 1 },
  infoTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
    marginBottom: 4,
  },
  infoDescription: {
    fontSize: FontSize.xs,
    color: BankingColors.textSecondary,
    lineHeight: 18,
  },
});
