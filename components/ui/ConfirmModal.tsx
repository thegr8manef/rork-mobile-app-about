import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from '@/constants/sizes';

interface ConfirmModalProps {
  visible: boolean;
  titleKey: string;
  descriptionKey?: string;
  primaryButtonKey: string;
  secondaryButtonKey?: string;
  onPrimaryPress: () => void;
  onSecondaryPress?: () => void;
  onClose: () => void;
}

export default function ConfirmModal({
  visible,
  titleKey,
  descriptionKey,
  primaryButtonKey,
  secondaryButtonKey,
  onPrimaryPress,
  onSecondaryPress,
  onClose }: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.container}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.content}>
              <TText tKey={titleKey} style={styles.title} />
              {descriptionKey && (
                <TText tKey={descriptionKey} style={styles.description} />
              )}
              
              <View style={styles.buttons}>
                {secondaryButtonKey && onSecondaryPress && (
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={onSecondaryPress}
                    activeOpacity={0.7}
                  >
                    <TText tKey={secondaryButtonKey} style={styles.secondaryButtonText} />
                  </TouchableOpacity>
                )}
                
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={onPrimaryPress}
                  activeOpacity={0.7}
                >
                  <TText tKey={primaryButtonKey} style={styles.primaryButtonText} />
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center' },
  container: {
    width: '85%',
    maxWidth: 400 },
  content: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.md,
    textAlign: 'center' as const },
  description: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    marginBottom: Spacing.xl,
    textAlign: 'center' as const,
    lineHeight: 22 },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.md },
  button: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const },
  primaryButton: {
    backgroundColor: BankingColors.primary },
  secondaryButton: {
    backgroundColor: BankingColors.background,
    borderWidth: 1,
    borderColor: BankingColors.border },
  primaryButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold },
  secondaryButtonText: {
    color: BankingColors.text,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });
