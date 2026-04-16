import React from "react";
import { View, StyleSheet, Image, Switch } from "react-native";
import { Lock, CheckCircle, XCircle } from "lucide-react-native";
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolate } from "react-native-reanimated";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize, FontFamily } from "@/constants/typography";
import { Shadow } from "@/constants/shadows";
import TText from "@/components/TText";
import { moderateScale, width as SCREEN_WIDTH } from "@/utils/scale";
import { Card } from "@/types/card.type";

const CARD_WIDTH = SCREEN_WIDTH - Spacing.screenPadding * 4;

interface CardItemProps {
  card: Card;
  isInfoVisible: boolean;
  onToggleVisibility: () => void;
  onToggleActivation: () => void;
  index: number;
  //@ts-ignore
  scrollX: SharedValue<number>;
}

export default function CardItem({
  card,
  isInfoVisible,
  onToggleVisibility,
  onToggleActivation,
  index,
  scrollX }: CardItemProps) {
  // console.log('==================================================');
  
  // console.log("🚀 ~ CardItem ~ card:", JSON.stringify(card, null, 2))
  //   console.log('==================================================');

  const isActivated = card.cardStatus.activation === "1";

  const formatExpiryDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = String(date.getFullYear()).slice(-2);
    return `${month}/${year}`;
  };

  // ✅ Animated card style with smooth scale and opacity
  const animatedCardStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * (CARD_WIDTH + 16),
      index * (CARD_WIDTH + 16),
      (index + 1) * (CARD_WIDTH + 16),
    ];

    // Scale: cards on sides are slightly smaller
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.92, 1, 0.92],
      Extrapolate.CLAMP,
    );

    // Opacity: cards on sides are slightly transparent
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.7, 1, 0.7],
      Extrapolate.CLAMP,
    );

    // Slight 3D rotation effect
    const rotateY = interpolate(
      scrollX.value,
      inputRange,
      [15, 0, -15],
      Extrapolate.CLAMP,
    );

    return {
      transform: [
        { scale },
        { perspective: 1000 },
        { rotateY: `${rotateY}deg` },
      ],
      opacity };
  });

  return (
    <Animated.View style={[styles.cardContainer, animatedCardStyle]}>
      <View style={styles.cardGradientLayer} />
      <View style={styles.cardRadialLayer} />
      <View style={styles.cardPattern}>
        <View style={styles.cardPatternCircle1} />
        <View style={styles.cardPatternCircle2} />
        <Image
          source={require("@assets/carte/signatureCarte.png")}
          style={styles.signatureBackground}
          resizeMode="contain"
        />
      </View>

      {!isActivated && <View style={styles.sensitiveInfoOverlay} />}

      <View style={styles.cardHeader}>
        <View style={styles.cardBankInfo}>
          <View style={styles.bankNameRow}>
            <Image
              source={require("@assets/carte/carte.png")}
              style={styles.bankLogo}
              resizeMode="contain"
            />
            <Animated.Text style={styles.cardBankName}>
              Attijari bank
            </Animated.Text>
          </View>
          <Animated.Text style={styles.cardName}>
            {card.product.description}
          </Animated.Text>
        </View>

        <View style={styles.cardHeaderActions}>
          <Switch
            value={isActivated}
            onValueChange={onToggleActivation}
            trackColor={{
              false: BankingColors.whiteTransparent20,
              true: BankingColors.successTransparent30 }}
            thumbColor={isActivated ? BankingColors.success : "#f4f3f4"}
            style={styles.activationSwitch}
          />
        </View>
      </View>

      <View style={styles.cardNumberContainer}>
        <Animated.Text style={styles.cardNumber}>
          {isInfoVisible ? card.pcipan.replace(/\*/g, "•") : card.pcipan}
        </Animated.Text>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.cardFooterItem}>
          <TText style={styles.cardLabel} tKey="cards.expiryDate" />
          <Animated.Text style={styles.cardValue}>
            {formatExpiryDate(card.expiryDate)}
          </Animated.Text>
        </View>

        <View style={styles.statusWrap}>
          {!isActivated && (
            <View style={styles.lockAboveStatus} pointerEvents="none">
              <View style={styles.lockIconBadge}>
                <Lock
                  size={moderateScale(30)}
                  color={BankingColors.white}
                  strokeWidth={2.5}
                />
              </View>
            </View>
          )}

          <View
            style={[
              styles.statusBadge,
              isActivated
                ? styles.statusBadgeActive
                : styles.statusBadgeDisabled,
            ]}
          >
            {isActivated ? (
              <CheckCircle
                size={moderateScale(14)}
                color={BankingColors.success}
                strokeWidth={2.5}
              />
            ) : (
              <XCircle
                size={moderateScale(14)}
                color={BankingColors.error}
                strokeWidth={2.5}
              />
            )}

            <TText
              style={[
                styles.statusText,
                isActivated
                  ? styles.statusTextActive
                  : styles.statusTextDisabled,
              ]}
              tKey={isActivated ? "cards.active" : "cards.inactive"}
            />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: CARD_WIDTH,
    borderRadius: moderateScale(16),
    padding: Spacing.xl,
    paddingBottom: Spacing.lg,
    position: "relative",
    overflow: "hidden",
    backgroundColor: BankingColors.cardBackground,
    ...Shadow.card,
    elevation: 8 },
  cardGradientLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: BankingColors.cardGradientBrown,
    opacity: 0.6 },
  cardRadialLayer: {
    position: "absolute",
    top: 0,
    right: 0,
    width: "50%",
    height: "50%",
    backgroundColor: BankingColors.cardRadialGray,
    opacity: 0.3,
    borderBottomLeftRadius: 300 },
  cardPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08 },
  cardPatternCircle1: {
    position: "absolute",
    width: moderateScale(200),
    height: moderateScale(200),
    borderRadius: moderateScale(100),
    backgroundColor: BankingColors.whiteTransparent10,
    top: moderateScale(-50),
    right: moderateScale(-50) },
  cardPatternCircle2: {
    position: "absolute",
    width: moderateScale(150),
    height: moderateScale(150),
    borderRadius: moderateScale(75),
    backgroundColor: BankingColors.whiteTransparent05,
    bottom: moderateScale(-40),
    left: moderateScale(-30) },
  signatureBackground: {
    position: "absolute",
    width: moderateScale(120),
    height: moderateScale(80),
    bottom: moderateScale(20),
    right: moderateScale(10),
    opacity: 0.15,
    overflow: "visible" },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: Spacing.md },
  cardBankInfo: { flex: 1 },
  bankNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md },
  bankLogo: { width: moderateScale(24), height: moderateScale(24) },
  cardBankName: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    opacity: 0.9,
    letterSpacing: moderateScale(1) },
  cardHeaderActions: { flexDirection: "row", gap: Spacing.sm },

  cardName: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.medium,
    color: BankingColors.white,
    opacity: 0.8,
    marginBottom: Spacing.md },

  cardNumberContainer: { marginBottom: Spacing.xl },
  cardNumber: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    letterSpacing: moderateScale(3) },

  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: Spacing.xs },
  cardFooterItem: { flex: 1 },
  cardLabel: {
    fontSize: moderateScale(10),
    fontFamily: FontFamily.medium,
    color: BankingColors.white,
    opacity: 0.7,
    marginBottom: moderateScale(2),
    textTransform: "uppercase",
    letterSpacing: moderateScale(0.5) },
  cardValue: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: BankingColors.white },

  activationSwitch: { transform: [{ scaleX: 1 }, { scaleY: 1 }] },

  statusWrap: {
    position: "relative",
    alignItems: "center" },

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: moderateScale(6),
    borderRadius: moderateScale(20),
    gap: moderateScale(4) },
  statusBadgeActive: { backgroundColor: BankingColors.successTransparent20 },
  statusBadgeDisabled: { backgroundColor: BankingColors.errorTransparent20 },

  statusText: {
    fontSize: FontSize.xs,
    fontFamily: FontFamily.semibold,
    textTransform: "uppercase",
    letterSpacing: moderateScale(0.5) },
  statusTextActive: { color: BankingColors.success },
  statusTextDisabled: { color: BankingColors.error },

  sensitiveInfoOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(10px)" as any },

  lockAboveStatus: {
    position: "absolute",
    bottom: "100%",
    left: "50%",
    transform: [{ translateX: -moderateScale(26) }],
    marginBottom: moderateScale(0),
    zIndex: 10,
    justifyContent: "center",
    alignItems: "center" },

  lockIconBadge: {
    width: moderateScale(52),
    height: moderateScale(52),
    borderRadius: moderateScale(26),
    backgroundColor: "rgba(0, 0, 0, 0.85)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: BankingColors.whiteTransparent20 } });
