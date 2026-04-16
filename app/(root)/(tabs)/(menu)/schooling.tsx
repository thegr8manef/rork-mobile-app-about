// app/(root)/(tabs)/(menu)/schooling.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity } from "react-native";
import { Stack, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BankingColors } from "@/constants/banking-colors";
import {
  FolderOpen,
  ChevronRight,
  Folder,
  RefreshCw,
  TextAlignEnd,
  History } from "lucide-react-native";
import SchoolingFolderSkeleton from "@/components/SchoolingFolderSkeleton";
import { useSchoolingFiles } from "@/hooks/use-schooling";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import CustomHeader from "@/components/home/Notification/CustomHeader";
import { useRefetchOnFocus } from "@/hooks/use-refetch-on-focus";
import { FontFamily } from "@/constants";

export default function SchoolingScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { data: filesResponse, isLoading } = useSchoolingFiles();

  const schoolingFiles = filesResponse?.data || [];
  const hasFiles = schoolingFiles.length > 0;
  const disableHistory = isLoading || !hasFiles;

  useRefetchOnFocus([
    { queryKey: ["schoolingFiles"] },
  ]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          header: () => (
            <CustomHeader
              onBack={() => router.back()}
              tKey="schooling.schoolingTransfer"
              rightIcon={
                <History
                  size={22}
                  color={
                    disableHistory
                      ? BankingColors.textLight
                      : BankingColors.white
                  }
                  style={{ opacity: disableHistory ? 0.5 : 1 }}
                />
              }
              onRightPress={() => {
                if (disableHistory) return;
                router.navigate("/schooling-transfer-history");
              }}
            />
          ) }}
      />

      {isLoading ? (
        <SchoolingFolderSkeleton count={3} />
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        >
          {hasFiles && (
            <View style={styles.section}>
              {schoolingFiles.map((file, index) => {
                console.log(
                  "🚀 ~ SchoolingScreen ~ file.currency.designation:",
                  file.currency.designation,
                );
                return (
                  <TouchableOpacity
                    key={file.id}
                    style={[
                      styles.folderItem,
                      index === 0 && styles.firstFolderItem,
                    ]}
                    onPress={() =>
                      router.navigate(`/schooling-transfer?fileId=${file.id}`)
                    }
                  >
                    <View style={styles.folderIconContainer}>
                      <FolderOpen size={36} color="#D97842" />
                      <Text style={styles.folderRef}>
                        {t("schooling.refNo")}
                        {file.fileRef}
                      </Text>
                    </View>

                    <View style={styles.folderContent}>
                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.associatedAccount"
                        />
                        <Text style={styles.folderValue}>
                          {file.settlementAccount}
                        </Text>
                      </View>

                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.studentFullName"
                        />
                        <Text style={styles.folderValue}>
                          {file.studentName}
                        </Text>
                      </View>
                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.studentBank"
                        />
                        <Text style={styles.folderValue}>
                          {file.bank ?? "-"}
                        </Text>
                      </View>
                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.swift"
                        />
                        <Text style={styles.folderValue}>
                          {file.swift ?? "-"}
                        </Text>
                      </View>
                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.fileYear"
                        />
                        <Text style={styles.folderValue}>
                          {file.fileYear ?? "-"}
                        </Text>
                      </View>
                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.expiryDate"
                        />
                        <Text style={styles.folderValue}>
                          {new Date(file.expiryDate).toLocaleDateString(
                            "fr-FR",
                          )}
                        </Text>
                      </View>

                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.rightAmount"
                        />
                        <Text style={styles.folderValue}>
                          {file.fileAmountLimit}
                          {" TND"}
                        </Text>
                      </View>

                      <View style={styles.folderRow}>
                        <TText
                          style={styles.folderLabel}
                          tKey="schooling.currency"
                        />
                        <View style={styles.currencyBadge}>
                          <Text style={styles.currencyBadgeText}>
                            {(file.currency?.designation ?? "-").toUpperCase()}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <ChevronRight
                      size={24}
                      color={BankingColors.textSecondary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {!hasFiles && (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Folder size={80} color="#D97842" strokeWidth={1.5} />
              </View>

              <View style={styles.emptyBadge}>
                <TText
                  style={styles.emptyBadgeText}
                  tKey="schooling.noFileAvailable"
                />
              </View>

              <TText
                style={styles.emptyTitle}
                tKey="schooling.noSchoolingFilesYet"
              />
              <TText
                style={styles.emptyText}
                tKey="schooling.noSchoolingFilesCreated"
              />
              <TText
                style={styles.emptySubText}
                tKey="schooling.visitBranchToOpenFile"
              />
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 16 },
  folderItem: {
    backgroundColor: BankingColors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: BankingColors.border },
  firstFolderItem: { marginTop: 16 },
  folderIconContainer: { alignItems: "center", marginRight: 12 },
  folderRef: { fontSize: 10, color: BankingColors.textSecondary, marginTop: 4 },
  folderContent: { flex: 1 },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6 },

  folderLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    flex: 1 },

  folderValue: {
    fontSize: 12,
    color: BankingColors.text,
    marginLeft: 12,
    flexShrink: 1,
    textAlign: "right" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 32 },
  emptyIconContainer: { marginBottom: 24 },
  emptyBadge: {
    backgroundColor: "#C44F3D",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 32 },
  emptyBadgeText: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.surface },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 16,
    textAlign: "center",
    lineHeight: 24 },
  emptyText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 8 },
  emptySubText: {
    fontSize: 14,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20 },
  currencyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: BankingColors.primary + "15",
    marginLeft: 12 },

  currencyBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary } });
