import React, { useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import DatePicker from "react-native-date-picker";
import BottomSheet, {
  BottomSheetFlatList,
  BottomSheetBackdrop,
} from "@gorhom/bottom-sheet";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { router, useLocalSearchParams } from "expo-router";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import { useCreateClaim } from "@/hooks/use-claims";
import {
  Upload,
  X,
  FileText,
  ChevronDown,
  Building2,
  Check,
  Calendar,
} from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Account } from "@/types/account.type";
import * as DocumentPicker from "expo-document-picker";
import AccountSelectorBottomSheet from "@/components/home/AccountDetail/AccountSelectorBottomSheet";
import { SelectableAccount } from "@/types/selectable-account";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import TText from "@/components/TText";
import i18next from "@/features/i18next";
import useShowMessage from "@/hooks/useShowMessage";
import { BlockingPopup } from "@/components/BlockingPopup";
import { formatBalance } from "@/utils/account-formatters";
import { FontFamily } from "@/constants";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "./language";

interface ClaimCategory {
  id: string;
  labelKey: string;
}

const RECLAMATION_CATEGORIES: ClaimCategory[] = [
  { id: "101", labelKey: "claim.category.remoteBanking" },
  { id: "102", labelKey: "claim.category.cardsPayments" },
  { id: "103", labelKey: "claim.category.creditsFinancing" },
  { id: "104", labelKey: "claim.category.accountConditions" },
];

export default function CreateClaimScreen() {
  const { type, categoryId: initialCategoryId } = useLocalSearchParams<{
    type: string;
    categoryId: string;
  }>();
  const { data: accountsData, isLoading: isAccountsLoading } =
    useCustomerAccounts();
  const createClaimMutation = useCreateClaim();
  const { showMessageError } = useShowMessage();

  const accounts = accountsData?.data || [];

  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDate, setIncidentDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [documents, setDocuments] = useState<any[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<ClaimCategory | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const categorySheetRef = useRef<BottomSheet>(null);
  const categorySnapPoints = useMemo(() => ["50%"], []);
  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;
  const claimType = type || "3";
  const isReclamation = claimType === "1";
  const showIncidentDate = claimType === "1" || claimType === "3";
  const [successOpen, setSuccessOpen] = useState(false);
  const getCategoryId = useMemo(() => {
    if (claimType === "1") {
      return selectedCategory?.id || "";
    } else if (claimType === "2") {
      return "105";
    } else {
      return "106";
    }
  }, [claimType, selectedCategory]);

  const handleOpenCategorySheet = useCallback(() => {
    categorySheetRef.current?.expand();
  }, []);

  const handleCloseCategorySheet = useCallback(() => {
    categorySheetRef.current?.close();
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        opacity={0.5}
      />
    ),
    [],
  );

  const handleDateChange = useCallback((date: Date) => {
    setShowDatePicker(false);
    setIncidentDate(date.toISOString().split("T")[0]);
  }, []);

  const parsedDate = useMemo(() => {
    const parsed = new Date(incidentDate);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }, [incidentDate]);

  React.useEffect(() => {
    if (accounts.length > 0 && !selectedAccount) {
      setSelectedAccount(accounts[0]);
    }
  }, [accounts, selectedAccount]);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newDocument = {
          id: Date.now().toString(),
          name: asset.name ?? `file-${Date.now()}`,
          uri: asset.uri,
          type: asset.mimeType ?? "application/octet-stream",
          size: asset.size ?? 0,
        };
        setDocuments((prev) => [...prev, newDocument]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showMessageError(
        i18next.t("claim.create.uploadError"),
        i18next.t("claim.create.uploadErrorMsg"),
      );
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const handleSubmit = async () => {
    if (!selectedAccount) {
      showMessageError(
        i18next.t("claim.create.error"),
        i18next.t("claim.create.selectAccountError"),
      );
      return;
    }

    if (!title.trim()) {
      showMessageError(
        i18next.t("claim.create.error"),
        i18next.t("claim.create.subjectError"),
      );
      return;
    }

    if (!description.trim()) {
      showMessageError(
        i18next.t("claim.create.error"),
        i18next.t("claim.create.descriptionError"),
      );
      return;
    }

    if (isReclamation && !selectedCategory) {
      showMessageError(
        i18next.t("claim.create.error"),
        i18next.t("claim.create.selectCategoryError"),
      );
      return;
    }

    try {
      await createClaimMutation.mutateAsync({
        accountId: selectedAccount.id,
        ...(showIncidentDate && { incidentDate }),
        claimSubject: title.trim(),
        description: description.trim(),
        categoryId: getCategoryId,
        type: claimType,
        attachments: documents.length > 0 ? (documents as any) : undefined,
      });
      setSuccessOpen(true);
    } catch (error) {
      console.error("Error creating claim:", error);
      showMessageError(
        i18next.t("claim.create.error"),
        i18next.t("claim.create.errorMsg"),
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const selectableAccounts: SelectableAccount[] = accounts.map((acc) => ({
    id: acc.id,
    accountNumber: acc.accountNumber || "",
    accountTitle: acc.accountTitle || "",
    ribFormatAccount: acc.ribFormatAccount || "",
    ibanFormatAccount: acc.ibanFormatAccount || "",
    accountingBalance: acc.accountingBalance || "0",
    availableBalance: acc.availableBalance || "0",
    currencyAlphaCode: acc.currencyAccount?.alphaCode || "TND",
    branchDesignation: acc.branch?.designation || "",
    indicativeBalance: acc.indicativeBalance || "0",
    fundReservation: acc.fundReservation || "-",
  }));

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        extraScrollHeight={32}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        {/* {claimType !== "3" && ( */}
        <View style={styles.section}>
          <TText tKey="claim.create.account" style={styles.sectionTitle} />
          <TouchableOpacity
            style={styles.accountSelectorCard}
            onPress={() => setShowAccountModal(true)}
          >
            <View style={styles.accountIconCircle}>
              <Building2 size={20} color={BankingColors.primary} />
            </View>
            <View style={styles.accountDetails}>
              <TText style={styles.accountNameText}>
                {selectedAccount?.accountTitle ||
                  i18next.t("claim.create.selectAccount")}
              </TText>
              <TText style={styles.accountBalanceText}>
                {formatBalance(
                  selectedAccount?.availableBalance || "0",
                  selectedAccount?.currencyAccount?.alphaCode || "TND",
                )}
              </TText>
            </View>
            <ChevronDown size={20} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>
        {/* )} */}

        {showIncidentDate && (
          <View style={styles.section}>
            <TText
              tKey="claim.create.incidentDate"
              style={styles.sectionTitle}
            />
            <TouchableOpacity
              style={styles.accountSelectorCard}
              onPress={() => setShowDatePicker(true)}
            >
              <View
                style={[
                  styles.accountIconCircle,
                  { backgroundColor: "#E3F2FD" },
                ]}
              >
                <Calendar size={20} color="#1976D2" />
              </View>
              <View style={styles.accountDetails}>
                <TText style={styles.accountNameText}>{incidentDate}</TText>
              </View>
              <ChevronDown size={20} color={BankingColors.textSecondary} />
            </TouchableOpacity>
            <DatePicker
              modal
              open={showDatePicker}
              date={parsedDate}
              mode="date"
              maximumDate={new Date()}
              onConfirm={handleDateChange}
              onCancel={() => setShowDatePicker(false)}
              title={i18next.t("claim.create.incidentDate")}
              confirmText={i18next.t("common.confirm")}
              cancelText={i18next.t("common.cancel")}
              locale={selectedLanguage ?? undefined}
            />
          </View>
        )}

        {isReclamation && (
          <View style={styles.section}>
            <TText tKey="claim.create.category" style={styles.sectionTitle} />
            <TouchableOpacity
              style={styles.accountSelectorCard}
              onPress={handleOpenCategorySheet}
            >
              <View
                style={[
                  styles.accountIconCircle,
                  { backgroundColor: "#FFF3E0" },
                ]}
              >
                <FileText size={20} color="#FF9800" />
              </View>
              <View style={styles.accountDetails}>
                <TText style={styles.accountNameText}>
                  {selectedCategory
                    ? i18next.t(selectedCategory.labelKey)
                    : i18next.t("claim.create.selectCategory")}
                </TText>
              </View>
              <ChevronDown size={20} color={BankingColors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <TText tKey="claim.create.subject" style={styles.sectionTitle} />
          <TextInput
            style={styles.input}
            placeholder={i18next.t("claim.create.subjectPlaceholder")}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#8E8E93"
          />
        </View>

        <View style={styles.section}>
          <TText tKey="claim.create.description" style={styles.sectionTitle} />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder={i18next.t("claim.create.descriptionPlaceholder")}
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#8E8E93"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        {/* <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <TText
                tKey="claim.create.documents"
                style={styles.sectionTitle}
              />
              <TText
                tKey="claim.create.documentsOptional"
                style={styles.optionalLabel}
              />
            </View>
            <TText style={styles.sectionSubtitle}>
              {documents.length} {i18next.t("claim.create.filesAttached")}
            </TText>
          </View>

          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentItem}>
              <View style={styles.documentIcon}>
                <FileText size={20} color={BankingColors.primary} />
              </View>
              <View style={styles.documentInfo}>
                <TText style={styles.documentName} numberOfLines={1}>
                  {doc.name}
                </TText>
                <TText style={styles.documentSize}>
                  {formatFileSize(doc.size)}
                </TText>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveDocument(doc.id)}
                style={styles.removeButton}
              >
                <X size={20} color="#8E8E93" />
              </TouchableOpacity>
            </View>
          ))}

          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handlePickDocument}
            activeOpacity={0.7}
          >
            <Upload size={20} color={BankingColors.primary} />
            <TText
              tKey="claim.create.uploadDocument"
              style={styles.uploadText}
            />
          </TouchableOpacity>
        </View> */}

        <TouchableOpacity
          style={[
            styles.submitButton,
            createClaimMutation.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={createClaimMutation.isPending}
          activeOpacity={0.8}
        >
          {createClaimMutation.isPending ? (
            <ActivityIndicator color={BankingColors.white} />
          ) : (
            <TText tKey="claim.create.submit" style={styles.submitButtonText} />
          )}
        </TouchableOpacity>
      </KeyboardAwareScrollView>

      <AccountSelectorBottomSheet
        visible={showAccountModal}
        accounts={selectableAccounts}
        selectedAccountId={selectedAccount?.id}
        onSelect={(accountId) => {
          const account = accounts.find((acc) => acc.id === accountId);
          if (account) {
            setSelectedAccount(account);
          }
          setShowAccountModal(false);
        }}
        onClose={() => setShowAccountModal(false)}
        title={i18next.t("claim.create.selectAccount")}
        unavailable={selectableAccounts.length === 0 && !isAccountsLoading}
      />

      <BottomSheet
        ref={categorySheetRef}
        index={-1}
        snapPoints={categorySnapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        handleIndicatorStyle={styles.sheetIndicator}
        backgroundStyle={styles.sheetBackground}
      >
        <View style={styles.sheetHeader}>
          <TText tKey="claim.create.selectCategory" style={styles.sheetTitle} />
          <TouchableOpacity onPress={handleCloseCategorySheet}>
            <X size={24} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        </View>
        <BottomSheetFlatList
          data={RECLAMATION_CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.sheetListContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryItem,
                selectedCategory?.id === item.id && styles.categoryItemSelected,
              ]}
              onPress={() => {
                setSelectedCategory(item);
                handleCloseCategorySheet();
              }}
            >
              <TText
                tKey={item.labelKey}
                style={[
                  styles.categoryItemText,
                  selectedCategory?.id === item.id &&
                    styles.categoryItemTextSelected,
                ]}
              />
              {selectedCategory?.id === item.id && (
                <Check size={20} color={BankingColors.primary} />
              )}
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => (
            <View style={styles.categorySeparator} />
          )}
        />
      </BottomSheet>

      <BlockingPopup
        visible={successOpen}
        title={i18next.t("claim.create.success")}
        message={i18next.t("claim.create.successMsg")}
        onRequestClose={() => setSuccessOpen(false)}
        allowBackdropClose={false}
        allowAndroidBackClose={false}
        showCloseX={false}
        theme={{
          surface: BankingColors.white,
          text: BankingColors.text,
          mutedText: BankingColors.textSecondary,
          border: BankingColors.border,
          primary: BankingColors.primary,
          radius: 16,
        }}
        actions={[
          {
            label: i18next.t("common.confirm"),
            variant: "primary",
            onPress: () => {
              setSuccessOpen(false);
              router.back();
            },
          },
        ]}
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
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 12,
  },
  optionalLabel: {
    fontSize: 12,
    color: BankingColors.textSecondary,
    marginTop: -8,
  },
  accountSelectorCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BankingColors.border,
    gap: 12,
  },
  accountIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  accountDetails: {
    flex: 1,
  },
  accountNameText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 3,
  },
  accountBalanceText: {
    fontSize: 13,
    color: BankingColors.textSecondary,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: BankingColors.textSecondary,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: BankingColors.text,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 14,
  },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: BankingColors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    marginBottom: 2,
  },
  documentSize: {
    fontSize: 12,
    color: BankingColors.textSecondary,
  },
  removeButton: {
    padding: 8,
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: BankingColors.primary,
    borderStyle: "dashed",
    gap: 8,
  },
  uploadText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary,
  },
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF",
  },
  sheetIndicator: {
    backgroundColor: "#D1D1D6",
    width: 36,
  },
  sheetBackground: {
    backgroundColor: BankingColors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  sheetListContent: {
    paddingBottom: 32,
  },
  categoryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  categoryItemSelected: {
    backgroundColor: BankingColors.primary + "10",
  },
  categoryItemText: {
    fontSize: 15,
    color: BankingColors.text,
    flex: 1,
  },
  categoryItemTextSelected: {
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold,
  },
  categorySeparator: {
    height: 1,
    backgroundColor: BankingColors.border,
    marginHorizontal: 16,
  },
});
