import React from "react";
import OfferStoryCard from "@/components/OfferStoryCard";
import type { OfferPromotion } from "@/types/banking";

type Props = {
  offer: OfferPromotion;
  onPress?: (offer: OfferPromotion) => void;
};

export default function OfferStoryListItem({ offer, onPress }: Props) {
  return <OfferStoryCard offer={offer} onPress={() => onPress?.(offer)} />;
}
