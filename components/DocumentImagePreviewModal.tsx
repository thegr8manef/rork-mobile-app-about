import React, { useMemo } from "react";
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions } from "react-native";
import { X, Download } from "lucide-react-native";
import { Image } from "expo-image";

import { BankingColors,
  BorderRadius,
  Shadow,
  Spacing,
  FontSize,
  FontFamily } from "@/constants";
import TText from "@/components/TText";

type Props = {
  visible: boolean;
  title?: string;
  base64?: string | null;
  isLoading?: boolean;
  downloading?: boolean;
  onClose: () => void;
  onDownload: () => void;

  /** optional translations */
  hintTKey?: string; // example: "bills.preview.hint" or "cheques.preview.hint"
  noImageTKey?: string; // example: "bills.preview.noImage" or "cheques.preview.noImage"
};

function base64ToDataUri(base64: string) {
  const clean = base64.includes("base64,")
    ? base64.split("base64,")[1]
    : base64;
  const isPng = clean.startsWith("iVBORw0KGgo");
  const mime = isPng ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${clean}`;
}

export default function DocumentImagePreviewModal({
  visible,
  title,
  base64,
  isLoading,
  downloading,
  onClose,
  onDownload,
  hintTKey,
  noImageTKey }: Props) {
  const source = useMemo(() => {
    if (!base64) return null;
    return { uri: base64ToDataUri(base64) };
  }, [base64]);

  const { width, height } = Dimensions.get("window");
  const imageMaxHeight = height * 0.72;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { width: width - Spacing.lg * 2 }]}>
          {/* Header */}
          <View style={styles.header}>
            <TText style={styles.title} numberOfLines={1}>
              {title ?? " "}
            </TText>

            <View style={styles.headerActions}>
              <TouchableOpacity
                onPress={onDownload}
                disabled={!base64 || !!isLoading || !!downloading}
                style={[
                  styles.iconBtn,
                  (!base64 || isLoading || downloading) &&
                    styles.iconBtnDisabled,
                ]}
              >
                {downloading ? (
                  <ActivityIndicator
                    size="small"
                    color={BankingColors.primary}
                  />
                ) : (
                  <Download size={20} color={BankingColors.primary} />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
                <X size={20} color={BankingColors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Body */}
          <View style={styles.body}>
            {isLoading ? (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={BankingColors.primary} />
              </View>
            ) : source ? (
              <View
                style={[styles.imageWrapper, { maxHeight: imageMaxHeight }]}
              >
                <Image
                  source={source}
                  contentFit="contain"
                  style={styles.image}
                  transition={150}
                />
              </View>
            ) : (
              <View style={styles.loader}>
                {noImageTKey ? (
                  <TText tKey={noImageTKey} style={styles.noImageText} />
                ) : (
                  <TText style={styles.noImageText} tKey="common.noImageAvailable" />
                )}
              </View>
            )}
          </View>

          {!!hintTKey && (
            <View style={styles.footerHint}>
              <TText tKey={hintTKey} style={styles.hintText} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg },
  sheet: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    ...Shadow.card },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.md },
  title: {
    flex: 1,
    color: BankingColors.text,
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold },
  headerActions: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "center" },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border,
    justifyContent: "center",
    alignItems: "center" },
  iconBtnDisabled: { opacity: 0.5 },
  body: { padding: Spacing.lg },
  loader: {
    height: 260,
    justifyContent: "center",
    alignItems: "center" },
  imageWrapper: {
    width: "100%",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border },
  image: { width: "100%", height: 360 },
  noImageText: { color: BankingColors.textSecondary },
  footerHint: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingTop: Spacing.sm },
  hintText: {
    color: BankingColors.textSecondary,
    fontSize: FontSize.sm } });
