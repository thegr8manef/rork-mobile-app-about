// app/(root)/(tabs)/(menu)/edocs.tsx  (EDocsScreen)

import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  ListRenderItemInfo,
  Platform,
  ActivityIndicator,
  ScrollView } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize,
  ButtonHeight,
  Shadow, FontFamily } from "@/constants";
import {
  Building2,
  ChevronDown,
  FileText,
  FileSpreadsheet,
  Download,
  Share2 } from "lucide-react-native";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useTranslation } from "react-i18next";
import {
  type SelectableAccount,
  toSelectableAccount } from "@/types/selectable-account";
import TText from "@/components/TText";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal } from "@gorhom/bottom-sheet";
import DateCardPicker from "@/components/DateCardPicker";
import type { DocumentType } from "@/services/edocs.api";
import useShowMessage from "@/hooks/useShowMessage";
import { formatBalance } from "@/utils/account-formatters";
import { useMutation } from "@tanstack/react-query";
import {
  downloadAccountStatementBase64,
  type AccountStatementReportType } from "@/services/account.api";
import {
  savePdfToDownloads,
  saveExcelToDownloads,
  savePdfBase64ToAppDir,
  saveFileBase64ToAppDir } from "@/utils/savePdfBase64";
import * as Sharing from "expo-sharing";
import { useDownloadNotification } from "@/hooks/useDownloadNotification";
import { requestStoragePermission } from "@/utils/mediaPermission";
import { useHaptic } from "@/utils/useHaptic";

// ── Types ──

type DocOptionId = DocumentType | "EXTRAIT_EXCEL" | "EXTRAIT_PDF";

interface DocTypeOption {
  id: DocOptionId;
  labelKey: string;
  icon: "pdf" | "excel";
}

const DOCUMENT_TYPES: DocTypeOption[] = [
  {
    id: "RELEVE_COMPTE",
    labelKey: "edocs.docTypes.RELEVE_COMPTE",
    icon: "pdf" },
  {
    id: "RELEVE_ANNUEL_COMMISSIONS",
    labelKey: "edocs.docTypes.RELEVE_ANNUEL_COMMISSIONS",
    icon: "pdf" },
  { id: "AVIS_DEBIT", labelKey: "edocs.docTypes.AVIS_DEBIT", icon: "pdf" },
  {
    id: "EXTRAIT_EXCEL",
    labelKey: "edocs.docTypes.EXTRAIT_EXCEL",
    icon: "excel" },
  { id: "EXTRAIT_PDF", labelKey: "edocs.docTypes.EXTRAIT_PDF", icon: "pdf" },
];

const EXTRAIT_TYPES: DocOptionId[] = ["EXTRAIT_EXCEL", "EXTRAIT_PDF"];

function isExtraitType(id: DocOptionId): boolean {
  return EXTRAIT_TYPES.includes(id);
}

function toYmd(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const getThreeMonthsAgo = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - 3);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getSixMonthsAgo = (): Date => {
  const d = new Date();
  d.setMonth(d.getMonth() - 6);
  d.setHours(0, 0, 0, 0);
  return d;
};

export default function EDocsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: accountsResponse, isLoading: isAccountsLoading } = useCustomerAccounts();
  const { showMessageError, showMessageSuccess } = useShowMessage();
  const { showComplete } = useDownloadNotification();
  const { triggerLightHaptic } = useHaptic();

  // ✅ read reset param (coming from edocs-list new search)
  const params = useLocalSearchParams<{ reset?: string }>();

  const accounts = useMemo(
    () => accountsResponse?.data || [],
    [accountsResponse?.data],
  );

  const selectableAccounts: SelectableAccount[] = useMemo(
    () => accounts.map(toSelectableAccount),
    [accounts],
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    null,
  );
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<DocOptionId | null>(
    null,
  );

  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  // ── Extrait-specific state ──
  const [extraitStartDate, setExtraitStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d;
  });
  const [extraitEndDate, setExtraitEndDate] = useState<Date>(new Date());
  const [savedFileUri, setSavedFileUri] = useState<string | null>(null);

  const minDate = useMemo(() => getThreeMonthsAgo(), []);
  const minDateExtrait = useMemo(() => getSixMonthsAgo(), []);
  const maxDate = useMemo(() => new Date(), []);

  const docTypeSheetRef = useRef<BottomSheetModal>(null);

  const selectedAccount = useMemo(() => {
    if (!selectedAccountId) return null;
    return selectableAccounts.find((a) => a.id === selectedAccountId) || null;
  }, [selectableAccounts, selectedAccountId]);

  const isExtrait = selectedDocType ? isExtraitType(selectedDocType) : false;

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        pressBehavior="close"
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        opacity={0.5}
      />
    ),
    [],
  );

  // ✅ RESET ALL SEARCH STATE WHEN reset=1
  const resetSearchState = useCallback(() => {
    setSelectedAccountId(null);
    setSelectedDocType(null);
    setStartDate(null);
    setEndDate(null);

    const d1 = new Date();
    d1.setMonth(d1.getMonth() - 1);
    setExtraitStartDate(d1);
    setExtraitEndDate(new Date());
    setSavedFileUri(null);

    setShowAccountModal(false);
    docTypeSheetRef.current?.dismiss();
  }, []);

  useEffect(() => {
    if (params?.reset === "1") {
      resetSearchState();
      // optional: clear param so it doesn't re-trigger
      router.setParams({ reset: undefined } as any);
    }
  }, [params?.reset, resetSearchState]);

  const handleSelectAccount = useCallback((accountId: string) => {
    setSelectedAccountId(accountId);
    setShowAccountModal(false);
    setSavedFileUri(null);
  }, []);

  const handleSelectDocType = useCallback((docType: DocOptionId) => {
    setSelectedDocType(docType);
    setSavedFileUri(null);
    docTypeSheetRef.current?.dismiss();
  }, []);

  const selectedDocTypeOption = useMemo(() => {
    if (!selectedDocType) return null;
    return DOCUMENT_TYPES.find((d) => d.id === selectedDocType) || null;
  }, [selectedDocType]);

  const selectedDocTypeLabel = useMemo(() => {
    if (!selectedDocTypeOption) return null;
    return t(selectedDocTypeOption.labelKey);
  }, [selectedDocTypeOption, t]);

  const clampDate = useCallback(
    (date: Date): Date => {
      if (date < minDateExtrait) return minDateExtrait;
      if (date > maxDate) return maxDate;
      return date;
    },
    [minDateExtrait, maxDate],
  );

  const handleExtraitStartDateChange = useCallback(
    (date: Date) => {
      const clamped = clampDate(date);
      setExtraitStartDate(clamped);
      if (clamped > extraitEndDate) setExtraitEndDate(clamped);
      setSavedFileUri(null);
    },
    [clampDate, extraitEndDate],
  );

  const handleExtraitEndDateChange = useCallback(
    (date: Date) => {
      const clamped = clampDate(date);
      setExtraitEndDate(clamped);
      if (clamped < extraitStartDate) setExtraitStartDate(clamped);
      setSavedFileUri(null);
    },
    [clampDate, extraitStartDate],
  );

  const downloadExtraitMutation = useMutation({
    mutationFn: async () => {
      if (!selectedAccount?.id) throw new Error("No account selected");

      if (Platform.OS !== "web") {
        const { granted } = await requestStoragePermission();
        if (!granted) throw new Error("STORAGE_PERMISSION_DENIED");
      }

      const reportType: AccountStatementReportType =
        selectedDocType === "EXTRAIT_EXCEL" ? "EXCEL" : "PDF";

      const base64 = await downloadAccountStatementBase64({
        accountId: selectedAccount.id,
        startDate: toYmd(extraitStartDate),
        endDate: toYmd(extraitEndDate),
        reportType });

      const ext = reportType === "PDF" ? "pdf" : "xlsx";
      const mimeType =
        reportType === "PDF"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const fileName = `extrait_${selectedAccount.id}_${toYmd(
        extraitStartDate,
      )}_${toYmd(extraitEndDate)}.${ext}`;

      if (Platform.OS === "web") {
        const byteChars = atob(base64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) {
          byteNumbers[i] = byteChars.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = (globalThis as any).document.createElement("a");
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }

      let downloadUri: string;
      let appUri: string;

      if (reportType === "PDF") {
        downloadUri = await savePdfToDownloads(base64, fileName);
        appUri = await savePdfBase64ToAppDir(base64, fileName);
      } else {
        downloadUri = await saveExcelToDownloads(base64, fileName);
        appUri = await saveFileBase64ToAppDir(base64, fileName);
      }

      setSavedFileUri(appUri);

      await showComplete(
        t("extraits.notificationTitle", "Extrait enregistré"),
        t(
          "extraits.notificationDesc",
          "L'extrait a été enregistré dans vos téléchargements.",
        ),
        appUri,
        mimeType,
      );
    },
    onSuccess: () => {
      showMessageSuccess(
        t("common.success"),
        t("extraits.downloadSuccess", "Extrait téléchargé avec succès"),
      );
    },
    onError: (error: any) => {
      if (error?.message === "STORAGE_PERMISSION_DENIED") return;
      console.log("❌ [Extrait] Download failed:", error?.message ?? error);
      showMessageError(
        t("common.error"),
        t("extraits.downloadError", "Erreur lors du téléchargement"),
      );
    } });

  const handleShareFile = useCallback(async () => {
    if (!savedFileUri) return;
    try {
      triggerLightHaptic();
      const available = await Sharing.isAvailableAsync();
      if (!available) return;

      const mimeType =
        selectedDocType === "EXTRAIT_EXCEL"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf";

      await Sharing.shareAsync(savedFileUri, {
        mimeType,
        dialogTitle: t("extraits.shareTitle", "Partager l'extrait") });
    } catch (e) {
      console.log("[EDocsScreen] share error:", e);
    }
  }, [savedFileUri, selectedDocType, triggerLightHaptic, t]);

  const isDisabled = !selectedAccount || !selectedDocType;

  const handleSearch = () => {
    if (!selectedAccount || !selectedAccountId) {
      showMessageError(t("common.error"), t("edocs.validation.selectAccount"));
      return;
    }
    if (!selectedDocType) {
      showMessageError(t("common.error"), t("edocs.validation.selectDocType"));
      return;
    }

    if (isExtrait) {
      triggerLightHaptic();
      setSavedFileUri(null);
      downloadExtraitMutation.mutate();
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      showMessageError(t("common.error"), t("edocs.validation.startBeforeEnd"));
      return;
    }

    router.navigate({
      pathname: "/(root)/(tabs)/(menu)/edocs-list" as any,
      params: {
        accountId: selectedAccount.id,
        accountName: selectedAccount.accountTitle,
        docType: selectedDocType,
        ...(startDate ? { startDate: toYmd(startDate) } : {}),
        ...(endDate ? { endDate: toYmd(endDate) } : {}) } });
  };

  const getButtonLabel = () => {
    if (isExtrait) {
      if (downloadExtraitMutation.isPending) return "extraits.downloading";
      return "extraits.download";
    }
    return "edocs.screen.search";
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="edocs.screen.title"
            />
          ) }}
      />

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.accountSection}>
          <TText
            tKey="edocs.screen.selectAccount"
            style={styles.sectionTitle}
          />
          <TouchableOpacity
            style={styles.accountPicker}
            onPress={() => setShowAccountModal(true)}
            activeOpacity={0.7}
          >
            {selectedAccount ? (
              <View style={styles.accountInfo}>
                <View style={styles.accountIconSmall}>
                  <Building2 size={20} color={BankingColors.primary} />
                </View>
                <View style={styles.accountDetails}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.accountName}
                  >
                    {selectedAccount.accountTitle}
                  </Text>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.accountNumber}
                  >
                    {selectedAccount.ribFormatAccount}
                  </Text>
                  <Text style={styles.accountBalance}>
                    {formatBalance(
                      selectedAccount.availableBalance || 0,
                      selectedAccount.currencyAlphaCode,
                    )}
                  </Text>
                </View>
              </View>
            ) : (
              <TText
                tKey="edocs.screen.chooseAccount"
                style={styles.placeholder}
              />
            )}
            <ChevronDown
              size={IconSize.md}
              color={BankingColors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        <View style={styles.accountSection}>
          <TText
            tKey="edocs.screen.selectDocType"
            style={styles.sectionTitle}
          />
          <TouchableOpacity
            style={styles.accountPicker}
            onPress={() => docTypeSheetRef.current?.present()}
            activeOpacity={0.7}
          >
            {selectedDocTypeOption ? (
              <View style={styles.accountInfo}>
                <View
                  style={[
                    styles.accountIconSmall,
                    selectedDocTypeOption.icon === "excel" &&
                      styles.excelIconBg,
                  ]}
                >
                  {selectedDocTypeOption.icon === "excel" ? (
                    <FileSpreadsheet
                      size={IconSize.md}
                      color={BankingColors.success}
                    />
                  ) : (
                    <FileText
                      size={IconSize.md}
                      color={BankingColors.primary}
                    />
                  )}
                </View>
                <View style={styles.accountDetails}>
                  <Text
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    style={styles.accountName}
                  >
                    {selectedDocTypeLabel}
                  </Text>
                </View>
              </View>
            ) : (
              <TText
                tKey="edocs.screen.chooseDocType"
                style={styles.placeholder}
              />
            )}
            <ChevronDown
              size={IconSize.md}
              color={BankingColors.textSecondary}
              style={{ marginLeft: "auto" }}
            />
          </TouchableOpacity>
        </View>

        {/* Date Pickers */}
        {isExtrait ? (
          <>
            <View style={styles.dateRow}>
              <DateCardPicker
                label={t("extraits.startDate")}
                date={extraitStartDate}
                onDateChange={handleExtraitStartDateChange}
                pickerTitle={t("extraits.startDate")}
                minimumDate={minDateExtrait}
                maximumDate={maxDate}
              />
              <DateCardPicker
                label={t("extraits.endDate")}
                date={extraitEndDate}
                onDateChange={handleExtraitEndDateChange}
                pickerTitle={t("extraits.endDate")}
                minimumDate={extraitStartDate}
                maximumDate={maxDate}
              />
            </View>
          </>
        ) : (
          <View style={styles.dateRow}>
            <DateCardPicker
              label={t("edocs.screen.startDate")}
              date={startDate}
              onDateChange={setStartDate}
              pickerTitle={t("edocs.screen.picker.startTitle")}
              placeholder={t("edocs.screen.chooseStartDate")}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
            <DateCardPicker
              label={t("edocs.screen.endDate")}
              date={endDate}
              onDateChange={setEndDate}
              pickerTitle={t("edocs.screen.picker.endTitle")}
              placeholder={t("edocs.screen.chooseEndDate")}
              minimumDate={minDate}
              maximumDate={maxDate}
            />
          </View>
        )}

        {isExtrait && savedFileUri && (
          <View style={styles.postDownloadRow}>
            <TouchableOpacity
              style={styles.shareFileButton}
              onPress={handleShareFile}
              activeOpacity={0.8}
            >
              <Share2 size={20} color={BankingColors.primary} />
              <TText style={styles.shareFileText}>
                {t("extraits.share", "Partager")}
              </TText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.bottomActionsContainer,
          { paddingBottom: insets.bottom + Spacing.xxxl },
        ]}
      >
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <TText tKey="common.cancel" style={styles.cancelButtonText} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.validateButton,
            (isDisabled || downloadExtraitMutation.isPending) &&
              styles.validateButtonDisabled,
          ]}
          onPress={handleSearch}
          disabled={isDisabled || downloadExtraitMutation.isPending}
          activeOpacity={0.7}
        >
          {downloadExtraitMutation.isPending ? (
            <ActivityIndicator size="small" color={BankingColors.white} />
          ) : isExtrait ? (
            <View style={styles.buttonWithIcon}>
              <Download size={18} color={BankingColors.white} />
              <TText
                tKey={getButtonLabel()}
                style={styles.validateButtonText}
              />
            </View>
          ) : (
            <TText tKey={getButtonLabel()} style={styles.validateButtonText} />
          )}
        </TouchableOpacity>
      </View>

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccount?.id}
        onSelect={handleSelectAccount}
        onClose={() => setShowAccountModal(false)}
        title={t("edocs.screen.modal.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      <BottomSheetModal
        ref={docTypeSheetRef}
        snapPoints={["70%"]}
        enableDynamicSizing={false}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.sheetBackground}
        handleIndicatorStyle={styles.handleIndicator}
      >
        <View style={styles.sheetContainer}>
          <TText
            style={styles.sheetTitle}
            tKey="edocs.screen.modal.selectDocType"
          />

          <TText style={styles.sheetSectionTitle}>
            {t("edocs.docSection.documents", "Documents")}
          </TText>

          <BottomSheetFlatList<DocTypeOption>
            data={DOCUMENT_TYPES}
            keyExtractor={(item: DocTypeOption) => item.id}
            renderItem={({ item }: ListRenderItemInfo<DocTypeOption>) => {
              const isSelected = item.id === selectedDocType;
              const isExcel = item.icon === "excel";

              return (
                <TouchableOpacity
                  style={[
                    styles.docTypeItem,
                    isSelected && styles.docTypeItemSelected,
                  ]}
                  onPress={() => handleSelectDocType(item.id)}
                >
                  <View
                    style={[
                      styles.docTypeIcon,
                      isSelected && styles.docTypeIconSelected,
                      isExcel && !isSelected && styles.docTypeIconExcel,
                      isExcel && isSelected && styles.docTypeIconExcelSelected,
                    ]}
                  >
                    {isExcel ? (
                      <FileSpreadsheet
                        size={20}
                        color={
                          isSelected
                            ? BankingColors.white
                            : BankingColors.success
                        }
                      />
                    ) : (
                      <FileText
                        size={20}
                        color={
                          isSelected
                            ? BankingColors.white
                            : BankingColors.primary
                        }
                      />
                    )}
                  </View>

                  <TText
                    style={[
                      styles.docTypeText,
                      isSelected && styles.docTypeTextSelected,
                      isExcel && isSelected && styles.docTypeTextExcelSelected,
                    ]}
                    tKey={item.labelKey}
                  />

                  {isExtraitType(item.id) && (
                    <View
                      style={[
                        styles.typeBadge,
                        isExcel ? styles.typeBadgeExcel : styles.typeBadgePdf,
                      ]}
                    >
                      <TText style={styles.typeBadgeText}>
                        {isExcel ? "XLSX" : "PDF"}
                      </TText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.sheetListContent}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollContainer: { flex: 1 },
  scrollContent: { paddingTop: Spacing.xxl, paddingBottom: Spacing.xl },
  accountSection: { marginHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  sectionTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  accountPicker: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: Spacing.md,
    minHeight: 80,
    ...Shadow.card },
  accountInfo: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md },
  accountIconSmall: {
    width: IconSize.xl,
    height: IconSize.xl,
    borderRadius: IconSize.md,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  excelIconBg: { backgroundColor: BankingColors.success + "20" },
  accountDetails: { flex: 1, minWidth: 0 },
  accountName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.xs },
  accountNumber: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xs },
  accountBalance: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.primary },
  placeholder: {
    flex: 1,
    fontSize: FontSize.md,
    color: BankingColors.textLight },
  dateRow: {
    flexDirection: "row",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    gap: Spacing.md },
  dateHint: {
    fontSize: FontSize.sm,
    color: BankingColors.textSecondary,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    fontStyle: "italic" },

  postDownloadRow: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.lg },
  shareFileButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.primary + "15",
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.primary },
  shareFileText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },

  bottomActionsContainer: {
    flexDirection: "row",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    backgroundColor: BankingColors.white,
    gap: Spacing.md },
  cancelButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.white,
    borderWidth: 1,
    borderColor: BankingColors.border,
    alignItems: "center" },
  cancelButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  validateButton: {
    flex: 1,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
    justifyContent: "center" },
  validateButtonDisabled: {
    backgroundColor: BankingColors.textLight,
    opacity: 0.5 },
  validateButtonText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },
  buttonWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm },

  sheetBackground: {
    backgroundColor: BankingColors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24 },
  handleIndicator: { backgroundColor: BankingColors.border, width: 40 },
  sheetContainer: { flex: 1, paddingHorizontal: Spacing.lg },
  sheetTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  sheetSectionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm },
  sheetListContent: { paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl },
  docTypeItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.md },
  docTypeItemSelected: {
    backgroundColor: BankingColors.primary + "15",
    borderWidth: 2,
    borderColor: BankingColors.primary },
  docTypeIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center" },
  docTypeIconSelected: { backgroundColor: BankingColors.primary },
  docTypeIconExcel: { backgroundColor: BankingColors.success + "20" },
  docTypeIconExcelSelected: { backgroundColor: BankingColors.success },
  docTypeText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    flex: 1 },
  docTypeTextSelected: {
    color: BankingColors.primary,
    fontFamily: FontFamily.bold },
  docTypeTextExcelSelected: { color: BankingColors.success },

  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs },
  typeBadgeExcel: { backgroundColor: BankingColors.success + "20" },
  typeBadgePdf: { backgroundColor: BankingColors.primary + "20" },
  typeBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bold,
    color: BankingColors.text } });
