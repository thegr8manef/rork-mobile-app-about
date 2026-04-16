import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles, Play } from "lucide-react-native";

import type { OfferPromotion } from "@/types/banking";
import TText from "@/components/TText";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  IconSize, FontFamily } from "@/constants";

interface OfferStoryCardProps {
  offer: OfferPromotion;
  onPress: (offer: OfferPromotion) => void;
}

const STORY_WIDTH = 140;
const STORY_HEIGHT = 200;

export default function OfferStoryCard({
  offer,
  onPress }: OfferStoryCardProps) {
  // ✅ use thumbnail for video cards
  const coverSource = offer.imageUri ?? offer.thumbnailUri;
  const isVideo = !!offer.videoUri;

  const Inner = (
    <LinearGradient
      colors={["transparent", "rgba(0,0,0,0.8)"]}
      style={styles.gradient}
    >
      <View style={styles.topRow}>
        {offer.isNew ? (
          <View style={styles.newBadge}>
            <Sparkles
              size={IconSize.xs}
              color={BankingColors.white}
              fill={BankingColors.white}
            />
            <TText style={styles.newBadgeText} tKey="common.new" />
          </View>
        ) : (
          <View />
        )}

        {isVideo ? (
          <View style={styles.playBadge}>
            <Play size={14} color="#fff" fill="#fff" />
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {offer.title}
        </Text>
        {!!offer.description && (
          <Text style={styles.description} numberOfLines={2}>
            {offer.description}
          </Text>
        )}
      </View>
    </LinearGradient>
  );

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(offer)}
      activeOpacity={0.9}
    >
      {coverSource ? (
        <ImageBackground
          source={coverSource}
          style={styles.imageBackground}
          imageStyle={styles.image}
          resizeMode="cover" // ✅ fill the card
        >
          {Inner}
        </ImageBackground>
      ) : (
        <View
          style={[
            styles.fallbackBg,
            { backgroundColor: offer.backgroundColor ?? "#333" },
          ]}
        >
          {Inner}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT },
  imageBackground: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden" },
  image: {
    borderRadius: BorderRadius.xl },
  fallbackBg: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden" },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: Spacing.md },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center" },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.accentPink + "E6",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    gap: Spacing.xs },
  newBadgeText: {
    color: BankingColors.white,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold },
  playBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center" },
  content: {
    gap: Spacing.xs },
  title: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    lineHeight: 20 },
  description: {
    fontSize: FontSize.sm,
    color: BankingColors.whiteTransparent90,
    lineHeight: 16 } });
