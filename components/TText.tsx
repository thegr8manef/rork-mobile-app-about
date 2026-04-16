import React, { useMemo } from "react";
import {
  Text,
  type TextProps,
  type StyleProp,
  type TextStyle } from "react-native";
import { useTranslation } from "react-i18next";
import {
  FontFamily,
  FontSize,
  type FontFamilyKey } from "@/constants/typography";

export interface TTextProps extends TextProps {
  tKey?: string;
  values?: Record<string, any>;
  style?: StyleProp<TextStyle>;
  size?: keyof typeof FontSize;
  weight?: FontFamilyKey;
  color?: string;
  align?: TextStyle["textAlign"];
  lineHeight?: number;
  italic?: boolean;
}

const ITALIC_MAP: Partial<Record<FontFamilyKey, string>> = {
  regular: FontFamily.italic,
  medium: FontFamily.mediumItalic,
  semibold: FontFamily.semiboldItalic,
  bold: FontFamily.boldItalic };

const TText: React.FC<TTextProps> = ({
  tKey,
  values,
  style,
  size,
  weight,
  color,
  align,
  lineHeight,
  italic,
  children,
  ...restProps
}) => {
  const { t } = useTranslation();

  const translatedText =
    tKey != null
      ? t(tKey, { defaultValue: tKey, ...(values ?? {}) })
      : null;

  const resolvedStyle = useMemo(() => {
    const base: TextStyle = {
      fontFamily: FontFamily.regular };

    if (size) {
      base.fontSize = FontSize[size];
    }

    if (weight) {
      if (italic && ITALIC_MAP[weight]) {
        base.fontFamily = ITALIC_MAP[weight];
      } else {
        base.fontFamily = FontFamily[weight];
      }
    } else if (italic) {
      base.fontFamily = FontFamily.italic;
    }

    if (color) {
      base.color = color;
    }

    if (align) {
      base.textAlign = align;
    }

    if (lineHeight !== undefined) {
      base.lineHeight = lineHeight;
    }

    return base;
  }, [size, weight, color, align, lineHeight, italic]);

  return (
    <Text
      allowFontScaling={false}
      style={[resolvedStyle, style]}
      {...restProps}
    >
      {translatedText}
      {children}
    </Text>
  );
};

export default TText;
