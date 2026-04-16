import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View } from "react-native";
import React, { useCallback, useEffect } from "react";
import { Beneficiary } from "@/types/account.type";
import { BankingColors,
  BorderRadius,
  FontSize,
  Shadow,
  Spacing, FontFamily } from "@/constants";
import {
  Building,
  ChevronLeft,
  HistoryIcon,
  Send,
  Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS } from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import TText from "@/components/TText";

type Props = {
  beneficiary: Beneficiary;
  onSendMoney: (beneficiaryId: string) => void;
  onDelete: (beneficiaryId: string, fullName: string) => void;
  isDeleting?: boolean;
  actionsDisabled?: boolean;
  /** Show swipe hint on the first card */
  showSwipeHint?: boolean;
};

const DELETE_WIDTH = 88;
const SWIPE_THRESHOLD = -40;

const SPRING_OPEN = {
  damping: 20,
  stiffness: 120,
  mass: 0.9,
  overshootClamping: false };

const SPRING_CLOSE = {
  damping: 22,
  stiffness: 150,
  mass: 0.8 };

const BeneficiaryCard = ({
  beneficiary,
  onSendMoney,
  onDelete,
  isDeleting = false,
  actionsDisabled = false,
  showSwipeHint = false }: Props) => {
  const disabled = actionsDisabled || isDeleting;
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const isOpen = useSharedValue(false);
  const hintOpacity = useSharedValue(showSwipeHint ? 1 : 0);

  // ── Swipe hint animation on first card ──
  useEffect(() => {
    if (!showSwipeHint) return;

    const timeout = setTimeout(() => {
      translateX.value = withSequence(
        withTiming(-50, { duration: 400 }),
        withDelay(600, withTiming(0, { duration: 350 })),
      );
      hintOpacity.value = withDelay(1400, withTiming(0, { duration: 300 }));
    }, 800);

    return () => clearTimeout(timeout);
  }, [showSwipeHint]);

  const closeSwipe = useCallback(() => {
    "worklet";
    translateX.value = withSpring(0, SPRING_CLOSE);
    isOpen.value = false;
  }, []);

  const openSwipe = useCallback(() => {
    "worklet";
    translateX.value = withSpring(-DELETE_WIDTH, SPRING_OPEN);
    isOpen.value = true;
  }, []);

  const handleSend = useCallback(() => {
    translateX.value = withSpring(0, SPRING_CLOSE);
    isOpen.value = false;
    onSendMoney(beneficiary.id);
  }, [beneficiary.id, onSendMoney]);

  const handleHistory = useCallback(() => {
    router.push({
      pathname: "/(root)/(tabs)/(home)/transfer-history",
      params: { beneficiaryRib: beneficiary.rib } });
  }, [beneficiary.rib]);

  const handleDelete = useCallback(() => {
    onDelete(beneficiary.id, beneficiary.fullName);
  }, [beneficiary.id, beneficiary.fullName, onDelete]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-8, 8])
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((e) => {
      const next = contextX.value + e.translationX;
      if (next > 0) {
        // Rubber band right
        translateX.value = next * 0.2;
      } else if (next < -DELETE_WIDTH) {
        // Rubber band past delete zone
        const over = next + DELETE_WIDTH;
        translateX.value = -DELETE_WIDTH + over * 0.12;
      } else {
        translateX.value = next;
      }
    })
    .onEnd((e) => {
      const velocity = e.velocityX;

      // Fast flick left → open
      if (velocity < -500) {
        openSwipe();
        return;
      }

      // Fast flick right → close
      if (velocity > 500) {
        closeSwipe();
        return;
      }

      // Position-based decision
      if (translateX.value < SWIPE_THRESHOLD) {
        openSwipe();
      } else {
        closeSwipe();
      }
    })
    .enabled(!disabled);

  // Tap on the card body — close if open
  const tapGesture = Gesture.Tap()
    .maxDuration(250)
    .onEnd(() => {
      if (isOpen.value) {
        closeSwipe();
      }
    });

  // Use Exclusive so pan takes priority over tap
  const composed = Gesture.Exclusive(panGesture, tapGesture);

  // ── Animated styles ──
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }] }));

  const deleteContainerStyle = useAnimatedStyle(() => {
    const width = interpolate(
      translateX.value,
      [-DELETE_WIDTH, 0],
      [DELETE_WIDTH, 0],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      translateX.value,
      [-50, -15, 0],
      [1, 0.4, 0],
      Extrapolation.CLAMP,
    );
    return { width, opacity };
  });

  const deleteIconScale = useAnimatedStyle(() => {
    const scale = interpolate(
      translateX.value,
      [-DELETE_WIDTH, -25, 0],
      [1, 0.4, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const hintStyle = useAnimatedStyle(() => ({
    opacity: hintOpacity.value }));

  // Avatar initials
  const initials = (beneficiary.fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
      console.log("🚀 ~ BeneficiaryCard ~ beneficiary.rib:", beneficiary.rib)

  return (
    <View style={styles.wrapper}>
      {/* ── Delete action behind card ── */}
      <Animated.View style={[styles.deleteContainer, deleteContainerStyle]}>
        <TouchableOpacity
          style={styles.deleteAction}
          onPress={handleDelete}
          disabled={disabled}
          activeOpacity={0.7}
        >
          {isDeleting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Animated.View style={deleteIconScale}>
              <Trash2 size={20} color="#fff" />
            </Animated.View>
          )}
          <TText style={styles.deleteLabel}  tKey="beneficiaries.deleteButton" />
        </TouchableOpacity>
      </Animated.View>

      {/* ── Card ── */}
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.card, cardAnimatedStyle]}>
          <View style={styles.cardInner}>
            {/* Avatar */}
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials || "?"}</Text>
            </View>

            {/* Info */}
            <View style={styles.infoContainer}>
              <Text style={styles.name} numberOfLines={1}>
                {beneficiary.fullName}
              </Text>

              <View style={styles.ribRow}>
                <Building size={12} color={BankingColors.textSecondary} />
                <Text style={styles.rib} numberOfLines={1}>
                  {beneficiary.rib}
                </Text>
              </View>

              {!!beneficiary.bankName && (
                <Text style={styles.bankName} numberOfLines={1}>
                  {beneficiary.bankName}
                </Text>
              )}
            </View>

            {/* ── Visible action buttons ── */}
            <View style={styles.actions}>
              {/* History */}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleHistory}
                disabled={disabled}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <HistoryIcon
                  size={16}
                  color={
                    disabled
                      ? BankingColors.textLight
                      : BankingColors.primary
                  }
                />
              </TouchableOpacity>

              {/* Send */}
              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSend}
                disabled={disabled}
                activeOpacity={0.7}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              >
                <Send
                  size={15}
                  color={
                    disabled
                      ? BankingColors.textLight
                      : BankingColors.primary
                  }
                />
              </TouchableOpacity>
            </View>

            {/* ── Swipe hint indicator ── */}
            {showSwipeHint && (
              <Animated.View style={[styles.swipeHint, hintStyle]}>
                <ChevronLeft
                  size={14}
                  color={BankingColors.textSecondary}
                />
              </Animated.View>
            )}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

export default BeneficiaryCard;

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    marginHorizontal: Spacing.lg,
    marginVertical: 6,
    borderRadius: BorderRadius.xl,
    overflow: "hidden" },

  // ── Delete (behind card) ──
  deleteContainer: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    borderTopRightRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
    overflow: "hidden" },
  deleteAction: {
    flex: 1,
    width: DELETE_WIDTH,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#E53935",
    gap: 4 },
  deleteLabel: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: "#fff",
    marginTop: 2 },

  // ── Card ──
  card: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.md },
  cardInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingLeft: Spacing.lg,
    paddingRight: 12,
    gap: 12 },

  // ── Avatar ──
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BankingColors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: BankingColors.primary + "25" },
  avatarText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
    letterSpacing: 0.5 },

  // ── Info ──
  infoContainer: {
    flex: 1,
    gap: 3 },
  name: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    letterSpacing: 0.1 },
  ribRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5 },
  rib: {
    fontSize: 12,
    color: BankingColors.textSecondary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 0.3 },
  bankName: {
    fontSize: 12,
    color: BankingColors.textLight,
    marginTop: 1 },

  // ── Visible actions ──
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "10",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BankingColors.primary + "18" },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "12",
    borderWidth: 1,
    borderColor: BankingColors.primary + "25",
    gap: 2 },

  // ── Swipe hint ──
  swipeHint: {
    position: "absolute",
    right: 4,
    top: "50%",
    marginTop: -10 } });