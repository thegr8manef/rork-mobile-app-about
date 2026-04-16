import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors } from "@/constants/banking-colors";
import {
  ArrowLeftRight,
  RefreshCw,
  FolderOpen,
  Upload,
  X,
  FileText,
  History } from "lucide-react-native";
import * as DocumentPicker from "expo-document-picker";
import {
  useSchoolingFiles,
  useConversionTrade,
  useSchoolingTransferInit } from "@/hooks/use-schooling";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { Spacing, FontFamily } from "@/constants";
import useShowMessage from "@/hooks/useShowMessage";
import { formatBalance } from "@/utils/account-formatters";

interface DocumentFile {
  id: string;
  name: string;
  uri: string;
  type: string;
  size: number;
}

export default function SchoolingTransferScreen() {
  const { fileId } = useLocalSearchParams<{ fileId: string }>();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showMessageError } = useShowMessage();
  const { data: filesResponse } = useSchoolingFiles();
  const schoolingFile = filesResponse?.data.find((f) => f.id === fileId);

  const [amount, setAmount] = useState<string>("");
  const [transferType, setTransferType] = useState<"reload_card" | "transfer">(
    "reload_card",
  );
  const [comment, setComment] = useState<string>("");
  const [selectedCurrency, setSelectedCurrency] = useState<"TND" | "FILE">(
    "TND",
  );

  // Force TND when card is selected
  useEffect(() => {
    if (transferType === "reload_card" && selectedCurrency !== "TND") {
      setSelectedCurrency("TND");
    }
  }, [transferType, selectedCurrency]);

  const [documents, setDocuments] = useState<DocumentFile[]>([]);

  const hasCardAccount =
    !!schoolingFile?.cardAccountNum &&
    schoolingFile.cardAccountNum.trim().length > 0;

  useEffect(() => {
    if (!hasCardAccount && transferType !== "transfer") {
      setTransferType("transfer");
    }
  }, [hasCardAccount, transferType]);

  // ----------------------------
  // DECIMALS RULES
  // - EUR => 2 decimals
  // - TND => 3 decimals
  // ----------------------------
  const getDecimalsByAlpha = (alpha?: string) => {
    if (!alpha) return 2;
    return alpha === "TND" ? 3 : 2;
  };

  // decimals for the amount the user is typing (depends on selectedCurrency)
  const getTypingDecimalsLimit = () => {
    if (selectedCurrency === "TND") return 3;
    const alpha = schoolingFile?.currency?.alphaCode;
    return getDecimalsByAlpha(alpha);
  };

  // Display format:
  // - decimal separator: ","
  // - thousands separator: space " "
  // Example: 68000 -> "68 000,000" (TND), "68 000,00" (EUR)
  const formatByCurrency = (value: number, alpha?: string) => {
    const d = getDecimalsByAlpha(alpha);
    const safe = Number.isFinite(value) ? value : 0;

    const fixed = safe.toFixed(d); // "68000.000"
    const [i, dec = ""] = fixed.split(".");

    const withSpaces = i.replace(/\B(?=(\d{3})+(?!\d))/g, " "); // "68 000"
    return d > 0 ? `${withSpaces},${dec}` : withSpaces;
  };

  // -----------------------------------------
  // AMOUNT INPUT VALIDATION (UPDATED)
  // RULES:
  // - only digits and ONE dot (.)
  // - max 7 digits ONLY BEFORE dot
  // - decimals don’t count for length
  // - EUR => 2 decimals, TND => 3 decimals
  // NOTE: user types with "." but DISPLAY uses "," (formatByCurrency)
  // -----------------------------------------
  const sanitizeAmountInput = (raw: string) => {
    let v = raw.replace(/[^0-9.]/g, "");

    const firstDot = v.indexOf(".");
    if (firstDot !== -1) {
      v = v.slice(0, firstDot + 1) + v.slice(firstDot + 1).replace(/\./g, "");
    }

    let [intPartRaw, decPartRaw = ""] = v.split(".");
    intPartRaw = intPartRaw.replace(/^0+(?=\d)/, "");

    // max 7 digits BEFORE dot
    if (intPartRaw.length > 7) {
      intPartRaw = intPartRaw.slice(0, 7);
    }

    const decLimit = getTypingDecimalsLimit();
    const decPart = decPartRaw.slice(0, decLimit);

    const hadDot = firstDot !== -1;
    if (hadDot && decLimit > 0) return `${intPartRaw}.${decPart}`;

    return intPartRaw;
  };

  const handleAmountChange = (text: string) => {
    setAmount(sanitizeAmountInput(text));
  };

  useEffect(() => {
    if (amount) setAmount(sanitizeAmountInput(amount));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCurrency, schoolingFile?.currency?.alphaCode]);
  // -----------------------------------------

  const numAmount = parseFloat(amount) || 0;
  const shouldFetchConversion =
    schoolingFile?.currency?.numericCode !== 788 && numAmount > 0;

  const {
    data: conversionData,
    isLoading: isLoadingRate,
    refetch: refetchRate } = useConversionTrade(
    schoolingFile?.id || "",
    selectedCurrency === "TND"
      ? "788"
      : schoolingFile?.currency?.numericCode.toString() || "788",
    selectedCurrency === "TND"
      ? schoolingFile?.currency?.numericCode.toString() || "788"
      : "788",
    numAmount,
    shouldFetchConversion,
  );

  const { mutate: initTransfer, isPending: isProcessing } =
    useSchoolingTransferInit();

  const convertedAmount = conversionData?.convertedAmount || 0;

  const exchangeRate =
    numAmount > 0 && convertedAmount > 0
      ? selectedCurrency === "TND"
        ? convertedAmount / numAmount
        : numAmount / convertedAmount
      : 0;

  const toggleCurrency = () => {
    if (schoolingFile?.currency?.numericCode === 788) return;
    setSelectedCurrency((prev) => (prev === "TND" ? "FILE" : "TND"));
  };

  // ----------------------------
  // ATTACHMENTS
  // ----------------------------
  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
        multiple: false });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const newDocument: DocumentFile = {
          id: Date.now().toString(),
          name: asset.name,
          uri: asset.uri,
          type: asset.mimeType || "application/octet-stream",
          size: asset.size || 0 };
        setDocuments((prev) => [...prev, newDocument]);
      }
    } catch (error) {
      console.error("Error picking document:", error);
      showMessageError(t("common.error"), t("schooling.documentUploadFailed"));
    }
  };

  const handleRemoveDocument = (documentId: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  if (!schoolingFile) {
    return (
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: true,
            header: () => (
              <CustomHeader
                onBack={() => router.back()}
                tKey="schooling.schoolingTransfer"
              />
            ) }}
        />
        <View style={styles.errorContainer}>
          <TText style={styles.errorText} tKey="schooling.fileNotFound" />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <TText style={styles.backButtonText} tKey="common.back" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const handleTransfer = async () => {
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      showMessageError(t("common.error"), t("schooling.enterValidAmount"));
      return;
    }

    if (numAmount > schoolingFile.fileAmountLimit) {
      showMessageError(
        t("common.error"),
        t("schooling.amountExceedsLimit", {
          limit: schoolingFile.fileAmountLimit,
          currency: " TND" }),
      );
      return;
    }

    const transferAmount =
      selectedCurrency === "TND" ? numAmount : convertedAmount;

    initTransfer(
      {
        schoolingFileId: schoolingFile.id,
        amount: transferAmount,
        currency:
          selectedCurrency === "TND"
            ? "788"
            : schoolingFile.currency.numericCode.toString(),
        transferMode: "SWIFT",
        transferType: schoolingFile.allowedTransferTypes[0] || "0531",
        feeType: schoolingFile.allowedFeeTypes[0] || "OUR",
        executionDate: new Date().toISOString().split("T")[0],
        comment,

        // NOTE: adapt to backend contract if needed (FormData/multipart/etc.)
        // attachment: documents[0]
        //   ? {
        //       name: documents[0].name,
        //       uri: documents[0].uri,
        //       type: documents[0].type,
        //       size: documents[0].size,
        //     }
        //   : undefined
      },
      {
        onSuccess: (response) => {
          router.push({
            pathname: "/(root)/transaction-summary",
            params: {
              transactionType: "schooling",
              data: JSON.stringify({
                requestId: response.id,
                fileId: schoolingFile.id,
                studentName: schoolingFile.studentName,
                fileRef: schoolingFile.fileRef,
                amount: amount,
                currency:
                  selectedCurrency === "TND"
                    ? "TND"
                    : schoolingFile.currency?.alphaCode,
                comment: comment || undefined,
                feeType: "schooling.tuitionFees",
                SchoolingTransactionType: "OUR",
                attachments: documents.length || undefined }) } });
        },
        onError: (error: any) => {
          console.error("Schooling transfer init error:", error);
          showMessageError(
            t("common.error"),
            error.message || t("schooling.transferInitFailed"),
          );
        } },
    );
  };

  // currency of the converted display amount:
  // - when typing TND, converted is FILE currency (e.g EUR)
  // - when typing FILE, converted is TND
  const convertedAlpha =
    selectedCurrency === "TND" ? schoolingFile.currency?.alphaCode : "TND";

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="schooling.schoolingTransfer"
              rightIcon={<History size={22} color={BankingColors.white} />}
              onRightPress={() =>
                router.navigate("/schooling-transfer-history")
              }
            />
          ) }}
      />

      <KeyboardAwareScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
        extraScrollHeight={32}
        enableOnAndroid
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.folderCard}>
          <View style={styles.folderIconContainer}>
            <View style={styles.folderIcon}>
              <FolderOpen size={28} color="#D97842" />
            </View>
            <View style={styles.folderHeader}>
              <Text style={styles.folderTitle}>
                {schoolingFile.studentName}
              </Text>
              <Text style={styles.folderRef}>
                {t("schooling.refNo")}
                {schoolingFile.fileRef}
              </Text>
            </View>
          </View>

          <View style={styles.folderRow}>
            <TText
              style={styles.folderLabel}
              tKey="schooling.availableAmount"
            />
            <Text style={styles.folderValue}>
              {formatBalance(schoolingFile.fileAmountLimit ?? 0, "TND")}
            </Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <View style={styles.inputGroup}>
            <TText style={styles.inputLabel} tKey="schooling.transferTo" />
            <View style={styles.transferTypeContainer}>
              <TouchableOpacity
                style={[
                  styles.transferTypeButton,
                  transferType === "reload_card" &&
                    styles.transferTypeButtonActive,
                  !hasCardAccount && { opacity: 0.5 },
                ]}
                disabled={!hasCardAccount}
                onPress={() => setTransferType("reload_card")}
              >
                <TText
                  style={[
                    styles.transferTypeText,
                    transferType === "reload_card" &&
                      styles.transferTypeTextActive,
                  ]}
                  tKey="schooling.card"
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.transferTypeButton,
                  transferType === "transfer" &&
                    styles.transferTypeButtonActive,
                ]}
                onPress={() => setTransferType("transfer")}
              >
                <TText
                  style={[
                    styles.transferTypeText,
                    transferType === "transfer" &&
                      styles.transferTypeTextActive,
                  ]}
                  tKey="schooling.account"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TText
              style={styles.inputLabel}
              tKey={
                transferType === "reload_card"
                  ? "schooling.transferAmountTND"
                  : "schooling.transferAmount"
              }
            />

            {schoolingFile.currency?.numericCode !== 788 &&
              transferType !== "reload_card" && (
                <View style={styles.currencySelector}>
                  <TouchableOpacity
                    style={[
                      styles.currencySide,
                      selectedCurrency === "TND" && styles.currencySideActive,
                    ]}
                    onPress={() => setSelectedCurrency("TND")}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        selectedCurrency === "TND" && styles.currencyTextActive,
                      ]}
                    >
                      TND
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.currencySwitch}
                    onPress={toggleCurrency}
                    disabled={isLoadingRate}
                  >
                    {isLoadingRate ? (
                      <ActivityIndicator
                        size="small"
                        color={BankingColors.primary}
                      />
                    ) : (
                      <ArrowLeftRight size={20} color={BankingColors.primary} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.currencySide,
                      selectedCurrency === "FILE" && styles.currencySideActive,
                    ]}
                    onPress={() => setSelectedCurrency("FILE")}
                  >
                    <Text
                      style={[
                        styles.currencyText,
                        selectedCurrency === "FILE" &&
                          styles.currencyTextActive,
                      ]}
                    >
                      {schoolingFile.currency?.alphaCode}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor={BankingColors.textLight}
              keyboardType="decimal-pad"
              inputMode="decimal"
              autoCorrect={false}
              autoCapitalize="none"
            />

            {schoolingFile.currency?.numericCode !== 788 &&
              transferType !== "reload_card" &&
              amount &&
              convertedAmount > 0 && (
                <View style={styles.conversionInfo}>
                  <View style={styles.conversionRow}>
                    <TText
                      style={styles.conversionLabel}
                      tKey={
                        selectedCurrency === "TND"
                          ? "schooling.convertedAmount"
                          : "schooling.equivalentTND"
                      }
                    />
                    <Text style={styles.conversionAmount}>
                      {convertedAlpha}{" "}
                      {formatByCurrency(convertedAmount, convertedAlpha)}
                    </Text>
                  </View>

                  <View style={styles.rateRow}>
                    <Text style={styles.rateText}>
                      {t("schooling.exchangeRate")}: 1{" "}
                      {schoolingFile.currency?.alphaCode ?? "TND"} ={" "}
                      {exchangeRate ? exchangeRate.toFixed(4) : "0.0000"} TND
                    </Text>
                    <TouchableOpacity
                      onPress={() => refetchRate()}
                      disabled={isLoadingRate}
                    >
                      <RefreshCw
                        size={14}
                        color={BankingColors.textSecondary}
                        style={{ opacity: isLoadingRate ? 0.5 : 1 }}
                      />
                    </TouchableOpacity>
                  </View>

                  <TText
                    style={styles.infoText}
                    tKey="schooling.indicativeAmount"
                  />
                </View>
              )}
          </View>

          <View style={styles.inputGroup}>
            <TText style={styles.inputLabel} tKey="schooling.transactionType" />
            <View style={styles.transactionTypeButton}>
              <TText
                style={styles.transactionTypeText}
                tKey="schooling.tuitionFees"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <TText style={styles.inputLabel} tKey="schooling.feeType" />
            <View style={styles.transactionTypeButton}>
              <Text style={styles.transactionTypeText}>
                {schoolingFile.allowedFeeTypes[0] || "OUR"}
              </Text>
            </View>
          </View>

          {/* ---------- ATTACHMENT BLOCK (UI) ---------- */}
          {/* <View style={styles.inputGroup}>
            <View style={styles.documentHeader}>
              <TText
                style={styles.inputLabel}
                tKey="schooling.additionalDocument"
              />
              <Text style={styles.documentCount}>
                {documents.length}{" "}
                {t("schooling.filesAttached", { count: documents.length })}
              </Text>
            </View>

            {documents.map((doc) => (
              <View key={doc.id} style={styles.documentItem}>
                <View style={styles.documentIcon}>
                  <FileText size={20} color={BankingColors.primary} />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName} numberOfLines={1}>
                    {doc.name}
                  </Text>
                  <Text style={styles.documentSize}>
                    {formatFileSize(doc.size)}
                  </Text>
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
                style={styles.uploadText}
                tKey="schooling.uploadDocument"
              />
            </TouchableOpacity>
          </View> */}
          {/* ---------- END ATTACHMENT BLOCK ---------- */}

          <View style={styles.inputGroup}>
            <TText style={styles.inputLabel} tKey="schooling.commentOptional" />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={comment}
              onChangeText={setComment}
              placeholder={t("schooling.addComment")}
              placeholderTextColor={BankingColors.textLight}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </KeyboardAwareScrollView>

      <View
        style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}
      >
        <View style={styles.footerButtons}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => router.back()}
            disabled={isProcessing}
          >
            <TText style={styles.cancelButtonText} tKey="common.cancel" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.submitButton,
              isProcessing && styles.submitButtonDisabled,
            ]}
            onPress={handleTransfer}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color={BankingColors.surface} />
            ) : (
              <TText style={styles.submitButtonText} tKey="common.validate" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32 },
  errorText: {
    fontSize: 16,
    color: BankingColors.error,
    marginBottom: 16 },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: BankingColors.primary,
    borderRadius: 8 },
  backButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface },
  folderCard: {
    backgroundColor: BankingColors.surface,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 16,
    padding: 14,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: BankingColors.border },
  folderIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border },
  folderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingVertical: 4 },
  folderLabel: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    flex: 1.2 },
  folderValue: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    flex: 1,
    textAlign: "right" },
  folderIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#D9784215",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12 },
  folderHeader: { flex: 1 },
  folderTitle: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2 },
  folderRef: { fontSize: 12, color: BankingColors.textSecondary },
  formSection: { padding: 16 },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 8 },
  input: {
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: BankingColors.text,
    borderWidth: 1,
    borderColor: BankingColors.border },
  textArea: { height: 80, textAlignVertical: "top" },
  transferTypeContainer: { flexDirection: "row", gap: 12 },
  transferTypeButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E8E8E8",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 24 },
  transferTypeButtonActive: { backgroundColor: BankingColors.primary },
  transferTypeText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  transferTypeTextActive: { color: BankingColors.surface },
  currencySelector: {
    flexDirection: "row-reverse",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BankingColors.border,
    padding: 4,
    marginBottom: 12 },
  currencySide: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8 },
  currencySideActive: { backgroundColor: BankingColors.primary + "15" },
  currencyText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  currencyTextActive: { color: BankingColors.primary },
  currencySwitch: { paddingHorizontal: 12, paddingVertical: 8 },
  conversionInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: BankingColors.primary + "08",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BankingColors.primary + "20" },
  conversionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8 },
  conversionLabel: { fontSize: 14, color: BankingColors.textSecondary },
  conversionAmount: {
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: BankingColors.text },
  rateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4 },
  rateText: { fontSize: 12, color: BankingColors.textSecondary },
  infoText: { fontSize: 11, color: BankingColors.error, fontStyle: "italic" },
  transactionTypeButton: {
    backgroundColor: "#D97842",
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignSelf: "flex-start" },
  transactionTypeText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface },

  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8 },
  documentCount: { fontSize: 14, color: BankingColors.textSecondary },
  documentItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: BankingColors.border },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: BankingColors.primary + "15",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12 },
  documentInfo: { flex: 1 },
  documentName: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: BankingColors.text,
    marginBottom: 2 },
  documentSize: { fontSize: 12, color: BankingColors.textSecondary },
  removeButton: { padding: 8 },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: BankingColors.primary,
    borderStyle: "dashed",
    gap: 8 },
  uploadText: { fontSize: 16, fontFamily: FontFamily.semibold, color: BankingColors.primary },

  footer: {
    padding: 16,
    backgroundColor: BankingColors.surface,
    borderTopWidth: 1,
    borderTopColor: BankingColors.border },
  footerButtons: { flexDirection: "row", gap: 12 },
  cancelButton: {
    flex: 1,
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 2,
    borderColor: BankingColors.primary },
  cancelButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary },
  submitButton: {
    flex: 1,
    backgroundColor: BankingColors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: "center" },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: BankingColors.surface } });
