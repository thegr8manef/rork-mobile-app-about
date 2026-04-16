import React from "react";
import { View, StyleSheet, TextInput, TextInputProps } from "react-native";
import TText from "@/components/TText";
import { FontFamily } from "@/constants";

interface AlertFormFieldProps extends TextInputProps {
  label: string;
  labelTKey?: string;
  error?: string;
  required?: boolean;
}

export const AlertFormField: React.FC<AlertFormFieldProps> = ({
  label,
  labelTKey,
  error,
  required = false,
  style,
  ...textInputProps
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.labelContainer}>
        {labelTKey ? (
          <TText style={styles.label} tKey={labelTKey} />
        ) : (
          <TText style={styles.label}>{label}</TText>
        )}
        {required && <TText style={styles.required}> *</TText>}
      </View>
      <TextInput
        style={[styles.input, style, error ? styles.inputError : null]}
        placeholderTextColor="#999"
        contextMenuHidden={true}
        {...textInputProps}
      />
      {error && <TText style={styles.errorText}>{error}</TText>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20 },
  labelContainer: {
    flexDirection: "row",
    marginBottom: 10 },
  label: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#1a1a1a" },
  required: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#ef4444" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 15,
    color: "#1a1a1a" },
  inputError: {
    borderColor: "#ef4444" },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    marginTop: 6 } });
