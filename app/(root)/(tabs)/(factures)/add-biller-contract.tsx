import React, { useState, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
} from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Stack, useRouter, useLocalSearchParams } from "expo-router";

import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { toSelectableAccount } from "@/types/selectable-account";
import AccountSelectorModal from "@/components/AccountSelectorModal";
import TText from "@/components/TText";
import AccountSelector from "@/components/factures/AccountSelector";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import { BorderRadius, IconSize, InputHeight } from "@/constants/sizes";

import { SearchCriterion } from "@/types/biller.types";
import { useTranslation } from "react-i18next";

// ✅ auth + mutation
import {
  useFetchAllBillers,
  useGetAllContracts,
  useSearchBillsMutation,
} from "@/hooks/use-billers";
import { useQueryClient } from "@tanstack/react-query";
import useShowMessage from "@/hooks/useShowMessage";

export default function AddBillerContractScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams();
  const billerId = params.billerId as string;
  const { contractId } = useLocalSearchParams<{ contractId: string }>();
  const qc = useQueryClient();

  const { data: billersResponse, isLoading, error } = useFetchAllBillers();
  const { data: contracts, isLoading: isContractsLoading } =
    useGetAllContracts();

  const accountsQuery = useCustomerAccounts();
  const accounts = accountsQuery.data?.data || [];
  const selectableAccounts = useMemo(
    () => accounts.map(toSelectableAccount),
    [accounts],
  );

  const selectedBiller = billersResponse?.find((b) => b.id === billerId);
  const contract = contracts?.find((c) => c.id === contractId);

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [selectedOptions, setSelectedOptions] = useState<
    Record<number, string>
  >({});
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const [customName, setCustomName] = useState<string>("");
  const [addToFavorites, setAddToFavorites] = useState<boolean>(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string>(
    selectableAccounts[0]?.id || "",
  );
  const [showAccountModal, setShowAccountModal] = useState<boolean>(false);

  // ✅ default account when accounts arrive
  useEffect(() => {
    if (!selectedAccountId && selectableAccounts[0]?.id) {
      setSelectedAccountId(selectableAccounts[0].id);
    }
  }, [selectableAccounts, selectedAccountId]);

  // ✅ default select options when biller arrives (async safe)
  useEffect(() => {
    if (!selectedBiller) return;

    setSelectedOptions((prev) => {
      const next = { ...prev };
      selectedBiller.searchCriteria.forEach((criterion) => {
        if (criterion.type === "select" && criterion.options.length > 0) {
          if (!next[criterion.id]) {
            next[criterion.id] = criterion.options[0].value;
          }
        }
      });
      return next;
    });
  }, [selectedBiller]);

  const selectedAccount = selectableAccounts.find(
    (a) => a.id === selectedAccountId,
  );

  const saveContractMutation = useSearchBillsMutation();
  const isSubmitting = saveContractMutation.isPending;

  // Loading/error/not found handling
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: t("bills.addContractTitle"),
            headerStyle: { backgroundColor: BankingColors.primary },
            headerTintColor: "#FFFFFF",
          }}
        />
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color={BankingColors.primary} />
        </View>
      </View>
    );
  }

  if (error || !selectedBiller) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            title: t("bills.addContractTitle"),
            headerStyle: { backgroundColor: BankingColors.primary },
            headerTintColor: "#FFFFFF",
          }}
        />
        <View style={styles.errorContainer}>
          <TText tKey="bills.billerNotFound" style={styles.errorText} />
        </View>
      </View>
    );
  }

  // group criteria for rendering
  const groupedCriteria: Record<string, SearchCriterion[]> = {};
  selectedBiller.searchCriteria.forEach((criterion) => {
    if (!groupedCriteria[criterion.groupId]) {
      groupedCriteria[criterion.groupId] = [];
    }
    groupedCriteria[criterion.groupId].push(criterion);
  });

  // detect reload amount criterion (your backend uses "amount" in some billers)
  const isReloadAmountCriterion = (c: SearchCriterion) => {
    const v = (c.label?.value || "").toLowerCase();
    const l = (c.label?.label || "").toLowerCase();
    return v === "amount" || l.includes("montant");
  };

  const normalize = (v: string) => (v ?? "").trim().toLowerCase();

  const handleSubmit = async () => {
    const group1 = selectedBiller.searchCriteria.filter(
      (c) => c.groupId === "1",
    );
    const selectCriterion = group1.find((c) => c.type === "select");
    const inputCriterion = group1.find((c) => c.type === "input");

    const searchCriteriaLabel = selectCriterion
      ? selectedOptions[selectCriterion.id] || ""
      : "";

    const searchCriteriaValue = inputCriterion
      ? (formData[inputCriterion.id.toString()] || "").trim()
      : "";

    if (!searchCriteriaLabel) {
      showMessageError("common.error", "bills.selectSearchCriteria");
      return;
    }

    if (!searchCriteriaValue) {
      showMessageError("common.error", "bills.enterIdentifier");
      return;
    }

    const alreadyExists = (contracts ?? []).some((c) => {
      if (String(c.billerId) !== String(selectedBiller.id)) return false;

      return (c.searchCriterias ?? []).some(
        (sc) =>
          normalize(sc.searchCriteria) === normalize(searchCriteriaLabel) &&
          normalize(sc.searchCriteriaValue) === normalize(searchCriteriaValue),
      );
    });

    if (alreadyExists) {
      showMessageError("common.error", "bills.contractAlreadyExists");
      return;
    }

    const reloadCriterion = selectedBiller.searchCriteria.find(
      isReloadAmountCriterion,
    );
    const reloadAmountValue = reloadCriterion
      ? (formData[reloadCriterion.id.toString()] || "").trim()
      : "";

    const contractLabel = customName.trim() || selectedBiller.billerLabel;

    const payload = {
      billerId: selectedBiller.id,
      searchCriteriaLabel,
      searchCriteriaValue,
      reloadAmount: reloadAmountValue ? reloadAmountValue : undefined,
      contractLabel,
      isFavorite: addToFavorites,
    };

    try {
      // ✅ STEP 1: verify bills exist (this mutation throws NO_BILLS_FOUND when empty)
      await saveContractMutation.mutateAsync(payload);

      // ✅ STEP 2: if your backend "create contract" is a DIFFERENT endpoint,
      // you should call the real "create contract" mutation here instead.
      // If getBills() is also the endpoint that creates the contract, then you're done.

      await qc.invalidateQueries({
        queryKey: ["contracts"],
        refetchType: "all",
      });

      showMessageSuccess("common.success", "bills.contractAddedSuccess");
      router.back();
    } catch (e: any) {
      if (e instanceof Error && e.message === "NO_BILLS_FOUND") {
        showMessageError(
          "bills.noBillFoundTitle",
          "bills.noBillFoundDescription",
        );
        //router.back();
        return;
      }

      console.error(e);
      showMessageError("common.error", "bills.unableToAddContract");
    }
  };

  const renderFormField = (criterion: SearchCriterion) => {
    if (criterion.type === "select") {
      if (criterion.options.length === 0) return null;

      return (
        <View key={criterion.id} style={styles.field}>
          {!!criterion.label.label && (
            <Text style={styles.label}>
              {criterion.label.label}
              {criterion.isRequired === "*" && (
                <Text style={styles.required}> *</Text>
              )}
            </Text>
          )}

          <View style={styles.pillsContainer}>
            {criterion.options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pill,
                  selectedOptions[criterion.id] === option.value &&
                    styles.pillSelected,
                ]}
                onPress={() => {
                  setSelectedOptions((prev) => ({
                    ...prev,
                    [criterion.id]: option.value,
                  }));
                }}
                disabled={isSubmitting}
              >
                <Text
                  style={[
                    styles.pillText,
                    selectedOptions[criterion.id] === option.value &&
                      styles.pillTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      );
    }

    if (criterion.type === "input") {
      const isNumeric = criterion.refRegexPattern === "^\\d+$";

      return (
        <View key={criterion.id} style={styles.field}>
          {!!criterion.label.label && (
            <Text style={styles.label}>
              {criterion.label.label}
              {criterion.isRequired === "*" && (
                <Text style={styles.required}> *</Text>
              )}
            </Text>
          )}

          <TextInput
            style={styles.input}
            value={formData[criterion.id.toString()] || ""}
            onChangeText={(text) =>
              setFormData((prev) => ({
                ...prev,
                [criterion.id.toString()]: text,
              }))
            }
            placeholder={
              isNumeric
                ? t("bills.enterAmountPlaceholder")
                : t("bills.enterIdentifierPlaceholder")
            }
            placeholderTextColor="#999999"
            keyboardType={isNumeric ? "numeric" : "default"}
            editable={!isSubmitting}
          />
        </View>
      );
    }

    return null;
  };

  const disableSubmit = isSubmitting || isContractsLoading;

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: t("bills.addContractTitle"),
          headerStyle: { backgroundColor: BankingColors.primary },
          headerTintColor: "#FFFFFF",
        }}
      />

      <KeyboardAwareScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={Spacing.xxxl}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.billerInfo}>
          <Image
            source={{ uri: selectedBiller.billerIcon }}
            style={styles.billerIcon}
          />
          <View style={styles.billerDetails}>
            <Text style={styles.billerName}>{selectedBiller.billerLabel}</Text>
            <Text style={styles.billerCategory}>
              {selectedBiller.billerCategory.categoryLabel}
            </Text>
          </View>
        </View>

        <View style={styles.form}>
          {Object.keys(groupedCriteria).map((groupId) => (
            <View key={groupId}>
              {groupedCriteria[groupId].map((criterion) =>
                renderFormField(criterion),
              )}
            </View>
          ))}

          <View style={styles.field}>
            <TText tKey="bills.accountToDebit" style={styles.label} />
            <AccountSelector
              selectedAccount={selectedAccount}
              onPress={() => setShowAccountModal(true)}
              placeholder={t("bills.selectAccountPlaceholder")}
            />
          </View>

          <View style={styles.toggleField}>
            <View style={styles.toggleContent}>
              <TText
                tKey="bills.addToFavoriteQuestion"
                style={styles.toggleLabel}
              />
              <TText tKey="bills.addToFavoriteHint" style={styles.toggleHint} />
            </View>

            <Switch
              value={addToFavorites}
              onValueChange={setAddToFavorites}
              trackColor={{
                false: "#E5E5E5",
                true: BankingColors.primary + "60",
              }}
              thumbColor={addToFavorites ? BankingColors.primary : "#F4F4F4"}
              disabled={disableSubmit}
            />
          </View>

          <View style={styles.field}>
            <TText tKey="bills.contractLabel" style={styles.label} />
            <TextInput
              style={styles.input}
              value={customName}
              onChangeText={setCustomName}
              placeholder={t("bills.contractLabelPlaceholder")}
              placeholderTextColor="#999999"
              editable={!disableSubmit}
            />
          </View>
        </View>
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, disableSubmit && { opacity: 0.7 }]}
            onPress={handleSubmit}
            activeOpacity={0.8}
            disabled={disableSubmit}
          >
            {isSubmitting ? (
              <ActivityIndicator color={BankingColors.white} />
            ) : (
              <TText tKey="common.validate" style={styles.submitButtonText} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>

      <AccountSelectorModal
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccountId}
        onSelect={(accountId) => {
          setSelectedAccountId(accountId);
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={t("bills.selectAccountDebit")}
        unavailable={accounts.length === 0 && !accountsQuery.isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  content: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: Spacing.xxxl,
  },
  errorText: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
    textAlign: "center" as const,
  },
  billerInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: BankingColors.white,
    padding: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  billerIcon: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.lg,
    backgroundColor: BankingColors.background,
  },
  billerDetails: {
    marginLeft: Spacing.lg,
    flex: 1,
  },
  billerName: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  billerCategory: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
  },
  form: {
    padding: Spacing.lg,
  },
  field: {
    marginBottom: Spacing.xl,
  },
  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
  },
  required: {
    color: BankingColors.error,
  },
  pillsContainer: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: Spacing.md,
  },
  pill: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  pillSelected: {
    backgroundColor: BankingColors.warning,
    borderColor: BankingColors.warning,
  },
  pillText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
  },
  pillTextSelected: {
    color: BankingColors.white,
  },
  input: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    fontSize: FontSize.md,
    color: BankingColors.text,
    borderWidth: 1,
    borderColor: BankingColors.border,
    minHeight: InputHeight.md,
  },
  toggleField: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  toggleContent: {
    flex: 1,
    marginRight: Spacing.md,
  },
  toggleLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs,
  },
  toggleHint: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    lineHeight: Spacing.lg,
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: BankingColors.white,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    ...Shadow.lg,
  },
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center" as const,
    ...Shadow.button,
    marginBottom: 30,
  },
  submitButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
  },
});
