import { useCallback } from "react";
import { Spacing } from "@/constants";
import { FontFamily } from "@/constants/typography";
import { useTranslation } from "react-i18next";
import { showMessage } from "react-native-flash-message";

const titleStyle = { fontFamily: FontFamily.semibold };
const textStyle = { fontFamily: FontFamily.regular };

const useShowMessage = () => {
  const { t } = useTranslation();

  const showMessageSuccess = useCallback((
    message: string,
    description?: string,
    duration = 4000
  ) => {
    return showMessage({
      message: t(message),
      description: description ? t(description) : "",
      icon: "success",
      type: "success",
      duration,
      style: { marginBottom: Spacing.xxxl },
      titleStyle,
      textStyle,
    });
  }, [t]);

  const showMessageError = useCallback((message: string, description?: string) => {
    return showMessage({
      message: t(message),
      description: description ? t(description) : "",
      icon: "danger",
      type: "danger",
      duration: 6000,
      style: { marginBottom: Spacing.xxxl, width: "100%" },
      titleStyle,
      textStyle,
    });
  }, [t]);

  const showMessageInfo = useCallback((message: string, description: string) => {
    return showMessage({
      message: t(message),
      description: t(description),
      icon: "info",
      type: "info",
      style: { marginBottom: Spacing.xxxl },
      titleStyle,
      textStyle,
      duration: 6000,
    });
  }, [t]);

  const showMessageSystem = useCallback((message: string, description: string) => {
    return showMessage({
      message,
      description,
      icon: "info",
      type: "default",
      style: { marginBottom: Spacing.xxxl, width: "100%" },
      titleStyle,
      textStyle,
      duration: 6000,
    });
  }, []);

  return {
    showMessageSuccess,
    showMessageError,
    showMessageInfo,
    showMessageSystem,
  };
};

export default useShowMessage;
