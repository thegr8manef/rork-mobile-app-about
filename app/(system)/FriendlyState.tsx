/**
 * FriendlyState — thin wrapper kept for backward compatibility.
 * New code should use <ScreenState> directly.
 */
import React from "react";
import ScreenState, { ScreenStateVariant } from "@/components/ScreenState";

type Props = {
  title: string;
  description?: string;
  variant?: ScreenStateVariant;
  onRetry?: () => void;
  onBack?: () => void;
};

export default function FriendlyState({
  title,
  description,
  variant = "error",
  onRetry,
  onBack,
}: Props) {
  return (
    <ScreenState
      variant={variant}
      title={title}
      description={description}
      onRetry={onRetry}
      onBack={onBack}
    />
  );
}
