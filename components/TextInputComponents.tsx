import React from 'react';
import { Text, TextProps } from 'react-native';
import { useTranslation } from 'react-i18next';

interface TranslatedTextProps extends Omit<TextProps, 'children'> {
  textKey: string;
  values?: Record<string, string | number>;
}

export default function TranslatedText({
  textKey,
  values,
  style,
  ...textProps
}: TranslatedTextProps) {
  const { t } = useTranslation();
  const translatedText = t(textKey, values);

  return (
    <Text style={style} {...textProps}>
      {String(translatedText)}
    </Text>
  );
}