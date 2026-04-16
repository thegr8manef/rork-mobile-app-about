import React from "react";
import { Modal, View, TouchableOpacity } from "react-native";
import TText from "@/components/TText";

export default function RecalculatePinModal({
  visible,
  isUpdatingCard,
  onCancel,
  onConfirm,
  styles }: any) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <TText
            style={styles.confirmModalTitle}
            tKey="cards.recalculatePinTitle"
          />
          <TText
            style={styles.confirmModalText}
            tKey="cards.recalculatePinMessage"
          />

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <TText style={styles.cancelButtonText} tKey="modal.cancel" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onConfirm}
              disabled={isUpdatingCard}
            >
              <TText
                style={styles.confirmButtonText}
                tKey={
                  isUpdatingCard ? "cards.processing" : "installments.confirm"
                }
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
