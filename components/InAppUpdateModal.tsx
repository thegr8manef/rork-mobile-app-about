// components/InAppUpdateModal.tsx
import React from "react";
import { useTranslation } from "react-i18next";
import { BlockingPopup } from "@/components/BlockingPopup";

type Props = {
  visible: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

export default function InAppUpdateModal({
  visible,
  onConfirm,
  onDismiss,
}: Props) {
  const { t } = useTranslation();

  return (
    <BlockingPopup
      visible={visible}
      title={t("appUpdate.title")}
      message={t("appUpdate.message")}
      allowBackdropClose={false}
      allowAndroidBackClose={false}
      actions={[
        {
          label: t("appUpdate.confirm"),
          variant: "primary",
          onPress: onConfirm,
        },
        {
          label: t("appUpdate.cancel"),
          variant: "secondary",
          onPress: onDismiss,
        },
      ]}
    />
  );
}
