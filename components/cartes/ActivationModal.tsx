import React from "react";
import { Modal, View, TouchableOpacity } from "react-native";
import TText from "@/components/TText";

export default function ActivationModal({
  visible,
  card,
  onCancel,
  onConfirm,
  isUpdatingCard,
  styles }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <TText
            style={styles.confirmModalTitle}
            tKey={card?.cardStatus.activation === "1" ? "cards.deactivateCardTitle" : "cards.activateCardTitle"}
          />

          <TText
            style={styles.confirmModalText}
            tKey={
              card?.cardStatus.activation === "1"
                ? "cards.deactivateCardMessage"
                : "cards.activateCardMessage"
            }
          />

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <TText style={styles.cancelButtonText} tKey="modal.cancel" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm} disabled={isUpdatingCard}>
              <TText
                style={styles.confirmButtonText}
                tKey={isUpdatingCard ? "cards.processing" : "modal.confirm"}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
