import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
} from "react-native";
import {
  Stack,
  useLocalSearchParams,
  router,
  useFocusEffect,
} from "expo-router";
import { useTranslation } from "react-i18next";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { History, RefreshCw } from "lucide-react-native";
import { contentMaxWidth, isLarge } from "@/constants/size-scale";

import {
  AvatarSize,
  BankingColors,
  BorderRadius,
  FontSize,
  IconSize,
  Spacing,
  FontFamily,
} from "@/constants";

import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import LoadingScreen from "@/components/LoadingScreen";
import CustomHeader from "@/components/home/Notification/CustomHeader";

import FromAccountSection from "./sections/FromAccountSection";
import ToAccountSection from "./sections/ToAccountSection";
import AmountSection from "./sections/AmountSection";
import TransferTypeSection from "./sections/TransferTypeSection";
import ExecutionDateSection from "./sections/ExecutionDateSection";
import FrequencySection from "./sections/FrequencySection";
import DescriptionSection from "./sections/DescriptionSection";

import RecipientSelectionModal from "./modals/RecipientSelectionModal";
import ExecutionDatePickerModal from "./modals/ExecutionDatePickerModal";
import EndDatePickerModal from "./modals/EndDatePickerModal";

import { useSendMoney } from "@/hooks/useSendMoney";
import { horizontalScale, verticalScale } from "@/utils/scale";
import SendMoneySkeleton from "./skeleton/SendMoneySkeleton";

export default function SendMoneyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    beneficiaryId?: string | string[];
    beneficiaryRib?: string | string[];
  }>();

  const beneficiaryId = Array.isArray(params.beneficiaryId)
    ? params.beneficiaryId[0]
    : params.beneficiaryId;

  const beneficiaryRib = Array.isArray(params.beneficiaryRib)
    ? params.beneficiaryRib[0]
    : params.beneficiaryRib;

  const vm = useSendMoney({ beneficiaryId, beneficiaryRib });
  useFocusEffect(
    useCallback(() => {
      return () => {
        vm.setShowRecipientModal(false);
        vm.setShowFromAccountModal(false);
      };
    }, []),
  );

  const isDisabled = useMemo(() => {
    const amount = String(vm.amount ?? "").trim();
    const description = String(vm.description ?? "").trim();

    return (
      !vm.fromAccount ||
      !amount ||
      !description ||
      (!vm.toAccount && !vm.selectedBeneficiary) ||
      vm.isTransferring ||
      vm.accounts.length === 0
    );
  }, [
    vm.fromAccount,
    vm.amount,
    vm.description,
    vm.toAccount,
    vm.selectedBeneficiary,
    vm.isTransferring,
    vm.accounts.length,
  ]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="Virements.title"
              rightIcon={<History size={22} color={BankingColors.white} />}
              onRightPress={vm.handlePrimaryAction}
            />
          ),
        }}
      />

      {vm.isLoading ? (
        <View style={styles.loadingContainer}>
          <SendMoneySkeleton />
        </View>
      ) : (
        <>
          <KeyboardAwareScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              isLarge && contentMaxWidth
                ? {
                    alignSelf: "center",
                    width: "100%",
                    maxWidth: contentMaxWidth,
                  }
                : null,
            ]}
            showsVerticalScrollIndicator={false}
            extraScrollHeight={Spacing.xxxl}
            enableOnAndroid
            keyboardShouldPersistTaps="handled"
          >
            <FromAccountSection
              fromAccount={vm.fromAccount}
              onPress={() => vm.setShowFromAccountModal(true)}
              styles={styles}
              hasChapterError={vm.chapterError.target === "from"}
            />

            <ToAccountSection
              selectedBeneficiary={vm.selectedBeneficiary}
              toAccount={vm.toAccount}
              onPress={() => vm.setShowRecipientModal(true)}
              styles={styles}
              hasChapterError={vm.chapterError.target === "to"}
            />

            <AmountSection
              //@ts-ignore
              control={vm.control}
              errors={vm.errors as any}
              currencyAlphaCode={vm.fromAccount?.currencyAccount?.alphaCode}
              styles={styles}
            />

            <TransferTypeSection
              transferType={vm.transferType}
              onChange={vm.setTransferType}
              styles={styles}
            />

            <ExecutionDateSection
              executionDate={vm.executionDate}
              errors={vm.errors as any}
              onPress={vm.openExecutionPicker}
              styles={styles}
              tranferType={vm.transferType}
            />

            {vm.transferType === "permanent" && (
              <FrequencySection
                frequency={vm.frequency}
                onFrequencyChange={vm.setFrequency}
                endDate={vm.endDate}
                onEndDatePress={vm.openEndPicker}
                errors={vm.errors as any}
                styles={styles}
              />
            )}

            <DescriptionSection
              //@ts-ignore
              control={vm.control}
              errors={vm.errors as any}
              styles={styles}
            />

            <View
              style={[
                styles.bottomActionsContainer,
                { paddingBottom: insets.bottom },
              ]}
            >
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => router.back()}
                activeOpacity={0.85}
              >
                <Text style={styles.cancelButtonText}>
                  {t("sendMoney.cancel")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.validateButton,
                  isDisabled && styles.validateButtonDisabled,
                ]}
                onPress={() => {
                  vm.handleTransfer();
                  Keyboard.dismiss();
                }}
                disabled={isDisabled}
                activeOpacity={0.85}
              >
                <Text style={styles.validateButtonText}>
                  {vm.isTransferring
                    ? t("sendMoney.processing")
                    : t("sendMoney.validate")}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAwareScrollView>

          {/* ================= MODALS ================= */}
          <AccountSelectorBottomSheet
            visible={vm.showFromAccountModal}
            //@ts-ignore
            accounts={vm.accounts.map((acc) => ({
              id: acc.id,
              accountTitle: acc.accountLabel,
              accountNumber: acc.accountNumber,
              availableBalance: String(acc.availableBalance).split(" ")[0],
              ribFormatAccount: acc.ribFormatAccount || "",
              ibanFormatAccount: acc.ibanFormatAccount || "",
              accountingBalance: String((acc as any).accountingBalance || "0"),
              currencyAlphaCode: acc.currencyAccount.alphaCode,
              branchDesignation: acc.branch?.designation || "",
              indicativeBalance: acc.indicativeBalance || "0",
              fundReservation: String((acc as any).fundReservation ?? "0.000"),
            }))}
            selectedAccountId={vm.fromAccount?.id}
            onSelect={(accountId: string) => {
              vm.setShowFromAccountModal(false);

              const account = vm.accounts.find((acc) => acc.id === accountId);
              if (!account) return;

              vm.setFromAccount(account);

              if (vm.toAccount?.id === account.id) {
                vm.setToAccount(null);
              }
            }}
            onClose={() => vm.setShowFromAccountModal(false)}
            title={t("sendMoney.selectDebitAccount")}
            unavailable={vm.accounts.length === 0 && !vm.isLoading}
          />

          <RecipientSelectionModal
            visible={vm.showRecipientModal}
            recipientTab={vm.recipientTab}
            onChangeTab={(tab) => {
              vm.setRecipientTab(tab);
              vm.setSearchQuery("");
            }}
            searchQuery={vm.searchQuery}
            onChangeSearch={vm.setSearchQuery}
            filteredBeneficiaries={vm.filteredBeneficiaries}
            filteredAccounts={vm.filteredAccounts}
            onSelectBeneficiary={vm.handleSelectBeneficiary}
            onSelectAccount={vm.handleSelectAccount}
            onAddBeneficiary={vm.handleAddBeneficiary}
            onClose={vm.onCloseRecipientModal}
          />

          <ExecutionDatePickerModal
            visible={vm.showExecutionPicker}
            tempPickerDate={vm.tempPickerDate}
            onChange={vm.onChangePicker}
            onCancel={vm.cancelIOSPicker}
            onConfirm={vm.confirmIOSPicker}
            minimumDate={vm.minExecutionDate}
            styles={styles}
          />

          <EndDatePickerModal
            visible={vm.showEndPicker}
            tempPickerDate={vm.tempPickerDate}
            onChange={vm.onChangePicker}
            onCancel={vm.cancelIOSPicker}
            onConfirm={vm.confirmIOSPicker}
            minimumDate={vm.minEndDate}
            styles={styles}
          />

          <LoadingScreen
            visible={vm.isTransferring}
            message={t("sendMoney.loading")}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.background,
  },
  scrollContent: {
    paddingBottom: 140,
  },

  scrollView: {
    flex: 1,
  },
  section: {
    marginBottom: Spacing.xl,
    paddingHorizontal: horizontalScale(Spacing.lg),
  },

  fieldLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  accountSection: {
    marginHorizontal: horizontalScale(Spacing.lg),
    marginVertical: verticalScale(Spacing.md),
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
  },
  accountPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    gap: Spacing.md,
    minHeight: 64,
  },
  // ── Error border override for chapter validation ──────────────────
  accountPickerError: {
    borderColor: BankingColors.primaryDark,
    borderWidth: 1.5,
  },

  accountInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  accountIconSmall: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },

  accountDetails: {
    flex: 1,
    minWidth: 0,
  },

  accountName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs,
    fontFamily: FontFamily.semibold,
  },

  accountBalance: {
    fontSize: FontSize.base,
    color: BankingColors.textMedium,
    fontFamily: FontFamily.medium,
  },

  placeholder: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary,
  },

  amountInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    overflow: "hidden",
    height: AvatarSize.xl,
  },

  amountInput: {
    flex: 1,
    height: AvatarSize.xl,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 0,
  },

  currencyBadge: {
    height: AvatarSize.xl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
  },

  currencyText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },

  transferTypeToggle: {
    flexDirection: "row",
    backgroundColor: BankingColors.borderNeutral,
    borderRadius: 25,
    padding: 3,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 22,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: BankingColors.white,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  toggleButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textLight,
  },
  toggleButtonTextActive: {
    color: BankingColors.text,
    fontFamily: FontFamily.bold,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    overflow: "hidden",
    height: AvatarSize.xl,
  },

  dateInput: {
    flex: 1,
    height: AvatarSize.xl,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 0,
  },

  calendarIconContainer: {
    height: AvatarSize.xl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
  },

  descriptionInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    overflow: "hidden",
    height: AvatarSize.xl,
  },

  descriptionInput: {
    flex: 1,
    height: AvatarSize.xl,
    fontSize: FontSize.md,
    color: BankingColors.text,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 0,
  },

  descriptionIconContainer: {
    height: AvatarSize.xl,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    paddingHorizontal: Spacing.xl,
  },

  bottomActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    gap: Spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  validateButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
  },
  validateButtonDisabled: {
    backgroundColor: BankingColors.disabled,
    opacity: 0.6,
  },
  validateButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
  },

  frequencyContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  frequencyPill: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
  },
  frequencyPillActive: {
    backgroundColor: BankingColors.accentOrange,
    borderColor: BankingColors.accentOrange,
  },
  frequencyPillText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  frequencyPillTextActive: {
    color: BankingColors.white,
  },

  loadingContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    gap: Spacing.lg,
  },
  errorText: {
    marginTop: 8,
    fontSize: FontSize.sm,
    color: BankingColors.primaryDark,
  },
});
