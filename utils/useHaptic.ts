import * as Haptics from 'expo-haptics';
import { useCallback } from 'react';

export const useHaptic = () => {
  const triggerLightHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const triggerMediumHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const triggerHeavyHaptic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const triggerSuccessHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const triggerErrorHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const triggerWarningHaptic = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  const triggerSelectionHaptic = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  return { 
    triggerLightHaptic,
    triggerMediumHaptic,
    triggerHeavyHaptic,
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerWarningHaptic,
    triggerSelectionHaptic
  };
};