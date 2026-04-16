import React, { useMemo } from "react";
import { LayoutRectangle } from "react-native";
import { useTranslation } from "react-i18next";
import OnboardingGuide, { OnboardingStep } from "@/components/OnboardingGuide";
import { BorderRadius } from "@/constants/sizes";

export interface FieldLayouts {
  cin?: LayoutRectangle;
  phone?: LayoutRectangle;
  email?: LayoutRectangle;
}

interface ContactValidationGuideProps {
  onComplete: () => void;
  fieldLayouts: FieldLayouts;
  scrollOffset?: number;
}

const DEFAULT_REGION = { x: 20, y: 200, width: 340, height: 50 };

export default function ContactValidationGuide({
  onComplete,
  fieldLayouts }: ContactValidationGuideProps) {
  const { t } = useTranslation();

  const steps = useMemo<OnboardingStep[]>(() => {
    const fieldKeys: (keyof FieldLayouts)[] = ["cin", "phone", "email"];
    const titleKeys: Record<string, string> = {
      cin: "fieldGuide.cin.title",
      phone: "fieldGuide.phone.title",
      email: "fieldGuide.email.title" };
    const descKeys: Record<string, string> = {
      cin: "fieldGuide.cin.description",
      phone: "fieldGuide.phone.description",
      email: "fieldGuide.email.description" };

    return fieldKeys.map((key) => {
      const layout = fieldLayouts[key];
      const region = layout
        ? { x: layout.x, y: layout.y, width: layout.width, height: layout.height }
        : DEFAULT_REGION;

      return {
        key,
        title: t(titleKeys[key]),
        description: t(descKeys[key]),
        region,
        tooltipPosition: "below" as const,
        borderRadius: BorderRadius.lg,
        padding: 6 };
    });
  }, [fieldLayouts, t]);

  return (
    <OnboardingGuide
      visible={true}
      steps={steps}
      onComplete={onComplete}
      skipLabel={t("fieldGuide.skip")}
      nextLabel={t("fieldGuide.understood")}
      doneLabel={t("fieldGuide.understoodFinal")}
    />
  );
}
