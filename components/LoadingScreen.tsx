import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Modal } from 'react-native';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { Loader2 } from 'lucide-react-native';
import TText from './TText';

interface LoadingScreenProps {
  visible: boolean;
  message?: string;
}

export default function LoadingScreen({ visible, message = 'Traitement en cours...' }: LoadingScreenProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      fadeValue.setValue(0);
      Animated.timing(fadeValue, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true }).start();

      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true })
      );
      spinAnimation.start();

      return () => {
        spinAnimation.stop();
      };
    }
  }, [visible, spinValue, fadeValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'] });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        <View style={styles.container}>
          <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
            <Loader2 size={48} color={BankingColors.primary} />
          </Animated.View>
          <TText style={styles.message}  tKey={message}/>
          <View style={styles.dotsContainer}>
            <Animated.View style={[styles.dot, { opacity: fadeValue }]} />
            <Animated.View style={[styles.dot, { opacity: fadeValue }]} />
            <Animated.View style={[styles.dot, { opacity: fadeValue }]} />
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center' },
  container: {
    backgroundColor: BankingColors.white,
    borderRadius: 20,
    padding: Spacing.xxxl,
    alignItems: 'center',
    minWidth: 200,
    shadowColor: BankingColors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8 },
  spinnerContainer: {
    marginBottom: Spacing.lg },
  message: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: 'center',
    marginBottom: Spacing.sm },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: Spacing.sm },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BankingColors.primary } });