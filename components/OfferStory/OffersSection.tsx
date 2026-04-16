// components/OffersSection.tsx
import React, { useMemo, useState } from "react";
import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";

import TText from "@/components/TText";
import OfferStoryListItem from "./OfferStoryListItem";
import { BankingColors, FontSize, Spacing, FontFamily } from "@/constants";
import type { OfferPromotion } from "@/types/banking";
import OfferStoriesViewer from "./OfferStoriesViewer";
import { horizontalScale } from "@/utils/scale";

type Props = {
  offers: OfferPromotion[];
  titleKey?: string;
  paddingHorizontal?: number;
  onViewAllPress?: () => void;
  onOfferPress?: (offer: OfferPromotion) => void;
};

export default function OffersSection({
  offers,
  titleKey = "home.offers",
  paddingHorizontal = 0,
  onViewAllPress,
  onOfferPress,
}: Props) {
  const data = useMemo(() => offers ?? [], [offers]);

  const [viewerVisible, setViewerVisible] = useState(false);
  const [initialIndex, setInitialIndex] = useState(0);

  const handleOpenViewer = (offer: OfferPromotion) => {
    onOfferPress?.(offer);

    const idx = data.findIndex((x) => x.id === offer.id);
    setInitialIndex(idx >= 0 ? idx : 0);
    setViewerVisible(true);
  };

  const handleCloseViewer = () => setViewerVisible(false);

  return (
    <View style={[styles.section, { paddingHorizontal }]}>
      <View style={styles.sectionHeader}>
        <TText tKey={titleKey} style={styles.sectionTitle} />
      </View>

      <FlashList
        horizontal
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OfferStoryListItem offer={item} onPress={handleOpenViewer} />
        )}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.offersListContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <OfferStoriesViewer
        visible={viewerVisible}
        offers={data}
        initialIndex={initialIndex}
        onClose={handleCloseViewer}
        durationMs={4500}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.xxl,
    paddingHorizontal: horizontalScale(Spacing.md),
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  offersListContent: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  separator: {
    width: 12,
  },
});
