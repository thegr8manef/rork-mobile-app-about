import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView } from "react-native";
import { useRouter, useLocalSearchParams, Stack } from "expo-router";
import { Star, X, Send } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { useSubmitFeedback } from "@/hooks/use-accounts-api";
import { FontFamily } from "@/constants";

export default function FeedbackScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    title: string;
    subtitle: string;
    isNoteActivated: string;
    isCommentsActivated: string;
  }>();

  const { t } = useTranslation();

  const title = params.title ?? t("feedback.defaultTitle");
  const subtitle = params.subtitle ?? "";
  const isNoteActivated = params.isNoteActivated === "true";
  const isCommentsActivated = params.isCommentsActivated === "true";

  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const starScales = useRef(
    Array.from({ length: 5 }, () => new Animated.Value(1))
  ).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStarPress = useCallback(
    (index: number) => {
      const newRating = index + 1;
      setRating(newRating);

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      Animated.sequence([
        Animated.timing(starScales[index], {
          toValue: 1.4,
          duration: 120,
          useNativeDriver: true }),
        Animated.timing(starScales[index], {
          toValue: 1,
          duration: 120,
          useNativeDriver: true }),
      ]).start();
    },
    [starScales]
  );

  const feedbackMutation = useSubmitFeedback();

  const goToDashboard = useCallback(() => {
    router.replace("/(root)/(tabs)/(home)" as any);
  }, [router]);

  const isSubmitting = feedbackMutation.isPending;

  const handleSubmit = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    feedbackMutation.mutate(
      {
        score: rating > 0 ? rating : undefined,
        comment: comment.trim() || undefined,
        skip: false },
      {
        onSuccess: () => goToDashboard(),
        onError: () => goToDashboard() }
    );
  }, [feedbackMutation, rating, comment, goToDashboard]);

  const handleSkip = useCallback(() => {
    console.log("⏭️ Feedback skipped");
    feedbackMutation.mutate(
      { skip: true },
      {
        onSuccess: () => goToDashboard(),
        onError: () => goToDashboard() }
    );
  }, [feedbackMutation, goToDashboard]);

  const getRatingLabel = (r: number): string => {
    switch (r) {
      case 1:
        return t("feedback.rating.veryUnsatisfied");
      case 2:
        return t("feedback.rating.unsatisfied");
      case 3:
        return t("feedback.rating.neutral");
      case 4:
        return t("feedback.rating.satisfied");
      case 5:
        return t("feedback.rating.verySatisfied");
      default:
        return "";
    }
  };

  const canSubmit = isNoteActivated ? rating > 0 : comment.trim().length > 0;

  return (
    <View style={[styles.container]}>
      <Stack.Screen options={{ headerShown: false }} />



      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={styles.iconContainer}>
              <View style={styles.iconBg}>
                <Star
                  size={32}
                  color={BankingColors.primary}
                  fill={BankingColors.primary}
                />
              </View>
            </View>

            <Text style={styles.title}>{title}</Text>
            {subtitle ? (
              <Text style={styles.subtitle}>{subtitle}</Text>
            ) : null}

            {isNoteActivated && (
              <View style={styles.ratingSection}>
                <View style={styles.starsRow}>
                  {[0, 1, 2, 3, 4].map((index) => {
                    const filled = index < rating;
                    return (
                      <TouchableOpacity
                        key={index}
                        onPress={() => handleStarPress(index)}
                        activeOpacity={0.7}
                        testID={`star-${index + 1}`}
                      >
                        <Animated.View
                          style={[
                            styles.starWrapper,
                            { transform: [{ scale: starScales[index] }] },
                          ]}
                        >
                          <Star
                            size={44}
                            color={
                              filled
                                ? "#FFB800"
                                : BankingColors.borderNeutral
                            }
                            fill={filled ? "#FFB800" : "transparent"}
                            strokeWidth={1.5}
                          />
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {rating > 0 && (
                  <Text style={styles.ratingLabel}>
                    {getRatingLabel(rating)}
                  </Text>
                )}
              </View>
            )}

            {isCommentsActivated && (
              <View style={styles.commentSection}>
                <Text style={styles.commentLabel}>
                  {t("feedback.commentLabel")}
                </Text>
                <TextInput
                  style={styles.commentInput}
                  placeholder={t("feedback.commentPlaceholder")}
                  placeholderTextColor={BankingColors.textMuted}
                  value={comment}
                  onChangeText={setComment}
                  multiline
                  numberOfLines={4}
                  maxLength={500}
                  textAlignVertical="top"
                  testID="feedback-comment"
                />
                <Text style={styles.charCount}>
                  {comment.length}/500
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>

        <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              !canSubmit && styles.submitButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            activeOpacity={0.8}
            testID="feedback-submit"
          >
            <Send size={18} color={BankingColors.white} style={styles.submitIcon} />
            <Text style={styles.submitText}>
              {isSubmitting ? t("feedback.submitting") : t("feedback.submit")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSkip}
            style={styles.skipButtonBottom}
            testID="feedback-skip"
            activeOpacity={0.7}
            disabled={feedbackMutation.isPending}
          >
            <Text style={styles.skipTextBottom}>
              {feedbackMutation.isPending ? t("feedback.submitting") : t("feedback.skip")}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.white },
  flex: {
    flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 20 },
  iconContainer: {
    marginBottom: 28 },
  iconBg: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: BankingColors.iconBgOrange,
    alignItems: "center",
    justifyContent: "center" },
  title: {
    fontSize: 22,
    fontFamily: FontFamily.bold,
    color: BankingColors.textPrimary,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 30,
    paddingHorizontal: 16 },
  subtitle: {
    fontSize: 15,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: 8,
    lineHeight: 22,
    paddingHorizontal: 20 },
  ratingSection: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 16 },
  starsRow: {
    flexDirection: "row",
    gap: 12 },
  starWrapper: {
    padding: 4 },
  ratingLabel: {
    marginTop: 14,
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },
  commentSection: {
    width: "100%",
    marginTop: 28 },
  commentLabel: {
    fontSize: 14,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
    marginBottom: 8 },
  commentInput: {
    borderWidth: 1,
    borderColor: BankingColors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: BankingColors.textPrimary,
    minHeight: 110,
    backgroundColor: BankingColors.background,
    lineHeight: 22 },
  charCount: {
    fontSize: 12,
    color: BankingColors.textMuted,
    textAlign: "right",
    marginTop: 6 },
  bottomActions: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: BankingColors.borderLight,
    backgroundColor: BankingColors.white },
  submitButton: {
    backgroundColor: BankingColors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8 },
  submitButtonDisabled: {
    backgroundColor: BankingColors.disabled },
  submitIcon: {
    marginRight: 2 },
  submitText: {
    fontSize: 16,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },
  skipButtonBottom: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 4 },
  skipTextBottom: {
    fontSize: 15,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.semibold } });
