import React from "react";
import { Modal, View, TouchableOpacity } from "react-native";
import TText from "@/components/TText";

export default function UnsecurePaymentModal({
  visible,
  onCancel,
  onConfirm,
  styles }: any) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View style={styles.confirmModalContent}>
          <TText style={styles.confirmModalTitle} tKey="cards.activateUnsecureTitle" />
          <TText style={styles.confirmModalText} tKey="cards.activateUnsecureMessage" />

          <View style={styles.modalButtonsRow}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <TText style={styles.cancelButtonText} tKey="modal.cancel" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <TText style={styles.confirmButtonText} tKey="cards.readAndConfirm" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
