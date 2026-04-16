import React from "react";
import { View, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronDown, ChevronLeft } from "lucide-react-native";
import TText from "@/components/TText";
import { gradientColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";

interface Props {
  topInset: number;
  cardName?: string;
  pcipan?: string;
  onBack: () => void;
  onSelectCard: () => void;
  styles: any;
}

export default function CardTransactionsHeader({
  topInset,
  cardName,
  pcipan,
  onBack,
  onSelectCard,
  styles }: Props) {
  return (
    <LinearGradient
      style={[styles.customHeader, { paddingTop: topInset + 10 }]}
      colors={gradientColors}
    >
      <View style={styles.headerRow}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ChevronLeft size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <TouchableOpacity
            style={styles.headerCardCard}
            onPress={onSelectCard}
            activeOpacity={0.9}
          >
            <View style={styles.headerCardContent}>
              {cardName ? (
                <>
                  <TText style={styles.headerCardLabel}>{cardName}</TText>
                  <TText style={styles.headerCardNumber}>{pcipan}</TText>
                </>
              ) : (
                <TText tKey="cards.selectCard" style={styles.headerCardLabel} />
              )}
            </View>

            <ChevronDown size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </LinearGradient>
  );
}
