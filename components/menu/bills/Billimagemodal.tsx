import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, Download } from "lucide-react-native";
import { BankingColors, Spacing, IconSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";
import { saveBase64ImageToDevice } from "@/utils/saveBase64ImageToDevice";
import useShowMessage from "@/hooks/useShowMessage";
import { requestStoragePermission } from "@/utils/mediaPermission";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BillImageModalProps {
  visible: boolean;
  billId: string | null;
  imageBase64: string | null;
  isLoading: boolean;
  onClose: () => void;
}

export default function BillImageModal({
  visible,
  billId,
  imageBase64,
  isLoading,
  onClose }: BillImageModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { showMessageSuccess, showMessageError } = useShowMessage();
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!imageBase64 || !billId) return;

    const { granted } = await requestStoragePermission();
    if (!granted) {
      console.log("[BillImageModal] Storage permission denied, blocking download");
      return;
    }

    setIsDownloading(true);
    try {
      await saveBase64ImageToDevice(imageBase64, `effet_${billId}.png`);
      showMessageSuccess(t("bills.downloadSuccess"));
    } catch (error) {
      showMessageError(t("common.error"), t("bills.downloadError"));
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Header with close button */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <TText style={styles.headerTitle} tKey="bills.billImage" />

          <TouchableOpacity
            style={styles.downloadButton}
            onPress={handleDownload}
            disabled={!imageBase64 || isDownloading}
            activeOpacity={0.7}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Download size={24} color="#FFFFFF" strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>

        {/* Image content */}
        <View style={styles.imageContainer}>
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <TText style={styles.loadingText} tKey="bills.loadingImage" />
            </View>
          ) : imageBase64 ? (
            <Image
              source={{ uri: `data:image/png;base64,${imageBase64}` }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View style={styles.errorContainer}>
              <TText style={styles.errorText} tKey="bills.imageLoadError" />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.3)" },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center" },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF" },
  downloadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center" },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg },
  image: {
    width: SCREEN_WIDTH - Spacing.lg * 2,
    height: SCREEN_HEIGHT - 200 },
  loadingContainer: {
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg },
  loadingText: {
    fontSize: 16,
    color: "#FFFFFF",
    marginTop: Spacing.md },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  errorText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center" } });