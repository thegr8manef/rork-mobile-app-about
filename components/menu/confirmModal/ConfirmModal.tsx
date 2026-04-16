import React from "react";
import {
  View,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback } from "react-native";
import { AlertTriangle } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize,
  Shadow, FontFamily } from "@/constants";

type ConfirmModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  titleKey: string;
  descriptionKey: string;
  confirmTextKey?: string;
  cancelTextKey?: string;
  type?: "warning" | "danger";
};

export default function ConfirmModal({
  visible,
  onClose,
  onConfirm,
  titleKey,
  descriptionKey,
  confirmTextKey = "common.confirm",
  cancelTextKey = "common.cancel",
  type = "danger" }: ConfirmModalProps) {
  const iconColor = type === "danger" ? BankingColors.error : BankingColors.warning;
  const confirmBgColor = type === "danger" ? BankingColors.primary : BankingColors.warning;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Icon */}
              <View style={[styles.iconContainer, { backgroundColor: iconColor + "15" }]}>
                <AlertTriangle size={IconSize.xl} color={iconColor} />
              </View>

              {/* Title */}
              <TText style={styles.title} tKey={titleKey} />

              {/* Description */}
              <TText style={styles.description} tKey={descriptionKey} />

              {/* Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <TText style={styles.cancelButtonText} tKey={cancelTextKey} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmButton, { backgroundColor: confirmBgColor }]}
                  onPress={() => {
                    onConfirm();
                    onClose();
                  }}
                  activeOpacity={0.7}
                >
                  <TText style={styles.confirmButtonText} tKey={confirmTextKey} />
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl },

  modalContainer: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    ...Shadow.lg },

  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg },

  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    textAlign: "center",
    marginBottom: Spacing.md,
    color: BankingColors.text },

  description: {
    fontSize: FontSize.base,
    textAlign: "center",
    marginBottom: Spacing.xxl,
    color: BankingColors.textSecondary,
    lineHeight: 22 },

  buttonContainer: {
    flexDirection: "row",
    gap: Spacing.md,
    width: "100%" },

  cancelButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.backgroundLight,
    alignItems: "center",
    justifyContent: "center" },

  cancelButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },

  confirmButton: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center" },

  confirmButtonText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white } });
