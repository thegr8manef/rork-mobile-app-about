import { useEffect, useMemo, useState } from "react";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { isAxiosError } from "axios";
import type { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import {
  useCustomerAccounts,
  useBeneficiaries } from "@/hooks/use-accounts-api";
import type {
  Account,
  ApiErrorResponse,
  Beneficiary,
  TransferInitRequest } from "@/types/account.type";

import type { FormValues, Frequency, TransferType } from "../types";
import { createSendMoneySchema } from "../validation";
import {
  formatDateToYYYYMMDD,
  getMinEndDate,
  getMinExecutionDate as getMinExecutionDateBase,
  isDateAtLeast48h20minFromNow,
  startOfDay } from "../utils";
import { useTransferInit } from "@/hooks/useTransfer";
import useShowMessage from "@/hooks/useShowMessage";

type RecipientTab = "beneficiaries" | "accounts";

export const useSendMoney = (beneficiaryId?: string) => {
  const { data: accountsData, isLoading: isLoadingAccounts } =
    useCustomerAccounts();
  const { data: beneficiariesData, isLoading: isLoadingBeneficiaries } =
    useBeneficiaries();
  // console.log("===========================================================");

  // console.log("🚀 ~ useSendMoney ~ beneficiariesData:", beneficiariesData);
  // console.log("===========================================================");
  const { showMessageError } = useShowMessage();
  const transferInitMutation = useTransferInit();

  const accounts = useMemo(() => accountsData?.data || [], [accountsData]);
  const beneficiaries = useMemo(
    () => beneficiariesData?.data ?? [],
    [beneficiariesData],
  );

  const [fromAccount, setFromAccount] = useState<Account | null>(null);
  const [toAccount, setToAccount] = useState<Account | null>(null);
  const [selectedBeneficiary, setSelectedBeneficiary] =
    useState<Beneficiary | null>(null);

  const [transferType, setTransferType] = useState<TransferType>("ponctuel");
  const [frequency, setFrequency] = useState<Frequency>("mensuelle");

  const [showExecutionPicker, setShowExecutionPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [tempPickerDate, setTempPickerDate] = useState<Date>(new Date());
  const [tempPickerMode, setTempPickerMode] = useState<"execution" | "end">(
    "execution",
  );

  const [showFromAccountModal, setShowFromAccountModal] = useState(false);
  const [showRecipientModal, setShowRecipientModal] = useState(false);
  const [recipientTab, setRecipientTab] =
    useState<RecipientTab>("beneficiaries");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBeneficiaries = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return beneficiaries;

    return beneficiaries.filter((b) => {
      const name = b.fullName.toLowerCase();
      const bank = b.bankName.toLowerCase();
      const rib = b.rib.toLowerCase();

      return name.includes(q) || bank.includes(q) || rib.includes(q);
    });
  }, [beneficiaries, searchQuery]);

  const filteredAccounts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = accounts || [];
    const filtered = list.filter((a: Account) => a.id !== fromAccount?.id);
    if (!q) return filtered;
    return filtered.filter((a: Account) => {
      const label = (a.accountLabel || "").toLowerCase();
      const num = (a.accountNumber || "").toLowerCase();
      return label.includes(q) || num.includes(q);
    });
  }, [accounts, searchQuery, fromAccount?.id]);

  const getMinExecutionDate = useMemo(() => {
    return () => getMinExecutionDateBase(transferType);
  }, [transferType]);

  const schema = useMemo(() => {
    return createSendMoneySchema({
      transferType,
      getMinExecutionDate,
      isDateAtLeast48h20minFromNow });
  }, [transferType, getMinExecutionDate]);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
    trigger,
    resetField } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      amount: "",
      description: "",
      executionDate: getMinExecutionDate(),
      endDate: undefined },
    mode: "onChange" });

  const executionDate = watch("executionDate");
  const endDate = watch("endDate");
  const amount = watch("amount");
  const description = watch("description");

  useEffect(() => {
    console.log(
      "[SendMoney] transferType changed =>",
      JSON.stringify(transferType),
    );

    if (accounts.length && !fromAccount) setFromAccount(accounts[0]);
  }, [accounts, fromAccount]);

  useEffect(() => {
    if (!beneficiaryId) return;
    const b = beneficiaries.find((x) => x.id === beneficiaryId);
    if (b) setSelectedBeneficiary(b);
  }, [beneficiaryId, beneficiaries]);

  useEffect(() => {
    const minExec = getMinExecutionDate();
    const currentExec = executionDate ?? minExec;

    if (transferType === "ponctuel") {
      if (startOfDay(currentExec).getTime() < startOfDay(minExec).getTime()) {
        setValue("executionDate", minExec, {
          shouldValidate: true,
          shouldDirty: true });
      }
      resetField("endDate");
    } else {
      if (!isDateAtLeast48h20minFromNow(currentExec)) {
        setValue("executionDate", minExec, {
          shouldValidate: true,
          shouldDirty: true });
      }
    }

    setTimeout(() => trigger(["executionDate", "endDate"]), 0);
  }, [
    transferType,
    executionDate,
    getMinExecutionDate,
    resetField,
    setValue,
    trigger,
  ]);

  const openExecutionPicker = () => {
    setTempPickerMode("execution");
    setTempPickerDate(executionDate || getMinExecutionDate());
    setShowExecutionPicker(true);
  };

  const openEndPicker = () => {
    setTempPickerMode("end");
    setTempPickerDate(endDate || executionDate || new Date());
    setShowEndPicker(true);
  };

  const minEndDate = useMemo(
    () => getMinEndDate(transferType, executionDate),
    [transferType, executionDate],
  );

  const onChangePicker = (_event: DateTimePickerEvent, selected?: Date) => {
    if (selected) setTempPickerDate(selected);

    if (Platform.OS === "android") {
      if (!_event || _event.type === "dismissed") {
        setShowExecutionPicker(false);
        setShowEndPicker(false);
        return;
      }

      const picked = selected ?? tempPickerDate;

      if (tempPickerMode === "execution") {
        setValue("executionDate", picked, {
          shouldValidate: true,
          shouldDirty: true });
        setShowExecutionPicker(false);

        const currentEnd = endDate;
        if (currentEnd) {
          if (transferType === "ponctuel") {
            if (
              startOfDay(currentEnd).getTime() < startOfDay(picked).getTime()
            ) {
              setValue("endDate", undefined, {
                shouldValidate: true,
                shouldDirty: true });
            }
          } else {
            if (
              startOfDay(currentEnd).getTime() <= startOfDay(picked).getTime()
            ) {
              setValue("endDate", undefined, {
                shouldValidate: true,
                shouldDirty: true });
            }
          }
        }

        setTimeout(() => trigger(["executionDate", "endDate"]), 0);
      } else {
        setValue("endDate", picked, {
          shouldValidate: true,
          shouldDirty: true });
        setShowEndPicker(false);
        setTimeout(() => trigger(["executionDate", "endDate"]), 0);
      }
    }
  };

  const confirmIOSPicker = () => {
    const picked = tempPickerDate;

    if (tempPickerMode === "execution") {
      setValue("executionDate", picked, {
        shouldValidate: true,
        shouldDirty: true });
      setShowExecutionPicker(false);

      const currentEnd = endDate;
      if (currentEnd) {
        if (transferType === "ponctuel") {
          if (startOfDay(currentEnd).getTime() < startOfDay(picked).getTime()) {
            setValue("endDate", undefined, {
              shouldValidate: true,
              shouldDirty: true });
          }
        } else {
          if (
            startOfDay(currentEnd).getTime() <= startOfDay(picked).getTime()
          ) {
            setValue("endDate", undefined, {
              shouldValidate: true,
              shouldDirty: true });
          }
        }
      }

      setTimeout(() => trigger(["executionDate", "endDate"]), 0);
    } else {
      setValue("endDate", picked, { shouldValidate: true, shouldDirty: true });
      setShowEndPicker(false);
      setTimeout(() => trigger(["executionDate", "endDate"]), 0);
    }
  };

  const cancelIOSPicker = () => {
    setShowExecutionPicker(false);
    setShowEndPicker(false);
  };

  const handlePrimaryAction = () => {
    router.replace("/(root)/(tabs)/(home)/transfer-history");
  };

  const submit = handleSubmit(async (data) => {
    if (!fromAccount) return;
    if (!selectedBeneficiary) {
      showMessageError("Erreur", "Veuillez sélectionner un bénéficiaire.");
      return;
    }

    // ✅ robust check (trim to avoid "permanent ")
    const isPermanent = String(transferType).trim() === "permanent";

    const apiFrequency: "MONTHLY" | "ANNUAL" | "once" = !isPermanent
      ? "once"
      : frequency === "annuelle"
        ? "ANNUAL"
        : "MONTHLY";

    console.log("[SendMoney] isPermanent =", isPermanent);
    console.log("[SendMoney] apiFrequency =", apiFrequency);

    const payload: TransferInitRequest = {
      executionDate: formatDateToYYYYMMDD(data.executionDate),
      motif: data.description,
      amount: Number(String(data.amount).replace(",", ".")),
      debtorAccountId: fromAccount.id,
      beneficiaryId: selectedBeneficiary.id,

      ...(isPermanent ? { frequency: apiFrequency } : {}),
      ...(isPermanent && data.endDate
        ? { endDate: formatDateToYYYYMMDD(data.endDate) }
        : {}) };

    console.log("[SendMoney] payload =", payload);

    const response = await transferInitMutation.mutateAsync(payload);
    // ...
  });

  const handleTransfer = submit;

  const handleSelectBeneficiary = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setToAccount(null);
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const handleSelectAccount = (account: Account) => {
    setToAccount(account);
    setSelectedBeneficiary(null);
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const handleAddBeneficiary = () => {
    setShowRecipientModal(false);
    setSearchQuery("");
    router.push("/add-beneficiary");
  };

  const onCloseRecipientModal = () => {
    setShowRecipientModal(false);
    setSearchQuery("");
  };

  const isLoading = isLoadingAccounts || isLoadingBeneficiaries;
  const isTransferring = transferInitMutation.isPending;

  return {
    accounts,
    beneficiaries,
    fromAccount,
    toAccount,
    selectedBeneficiary,
    control,
    errors,
    isValid,
    amount,
    description,
    executionDate,
    endDate,
    transferType,
    setTransferType,
    frequency,
    setFrequency,
    showExecutionPicker,
    showEndPicker,
    tempPickerDate,
    tempPickerMode,
    setTempPickerMode,
    setTempPickerDate,
    openExecutionPicker,
    openEndPicker,
    onChangePicker,
    confirmIOSPicker,
    cancelIOSPicker,
    minExecutionDate: getMinExecutionDate(),
    minEndDate,
    showFromAccountModal,
    setShowFromAccountModal,
    showRecipientModal,
    setShowRecipientModal,
    recipientTab,
    setRecipientTab,
    searchQuery,
    setSearchQuery,
    filteredBeneficiaries,
    filteredAccounts,
    onCloseRecipientModal,
    setFromAccount,
    setToAccount,
    setSelectedBeneficiary,
    handleSelectBeneficiary,
    handleSelectAccount,
    handleAddBeneficiary,
    handleTransfer,
    handlePrimaryAction,
    isLoading,
    isTransferring };
};
