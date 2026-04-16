import React, { useState } from "react";
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X, RotateCw } from "lucide-react-native";
import { BankingColors, Spacing, FontFamily } from "@/constants";
import TText from "@/components/TText";
import { useTranslation } from "react-i18next";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface BillImageViewModalProps {
  visible: boolean;
  billNumber?: string;
  imageBase64: string | undefined;
  onClose: () => void;
}

export default function BillImageViewModal({
  visible,
  billNumber,
  imageBase64,
  onClose }: BillImageViewModalProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  // Rotation state: 0, 90, 180, 270
  const [rotation, setRotation] = useState(0);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Reset rotation when modal closes
  const handleClose = () => {
    setRotation(0);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Header with close and rotate buttons */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.md }]}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <X size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <TText style={styles.headerTitle} tKey="bills.viewBill" />
            {billNumber && (
              <TText style={styles.headerSubtitle}>{billNumber}</TText>
            )}
          </View>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleRotate}
            activeOpacity={0.7}
          >
            <RotateCw size={24} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Image content */}
        <View style={styles.imageContainer}>
          {imageBase64 ? (
            <Image
              source={{ uri: `data:image/png;base64,${imageBase64}` }}
              style={[
                styles.image,
                {
                  transform: [{ rotate: `${rotation}deg` }],
                  // Swap dimensions when rotated 90 or 270 degrees
                  width:
                    rotation === 90 || rotation === 270
                      ? SCREEN_HEIGHT - 200
                      : SCREEN_WIDTH - Spacing.lg * 2,
                  height:
                    rotation === 90 || rotation === 270
                      ? SCREEN_WIDTH - Spacing.lg * 2
                      : SCREEN_HEIGHT - 200 },
              ]}
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
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center" },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.md },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF" },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.7)",
    marginTop: 2 },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.lg },
  image: {
    // Dimensions set dynamically based on rotation
  },
  errorContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  errorText: {
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center" } });