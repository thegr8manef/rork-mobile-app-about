import React from "react";
import { View, TextInput, StyleSheet } from "react-native";
import { Search } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontSize } from "@/constants/typography";
import { BorderRadius } from "@/constants/sizes";

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
}

export default function SearchBar({
  value,
  onChangeText,
  placeholder }: SearchBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Search size={20} color="#999999" />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor="#999999"
          contextMenuHidden={true}
          
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    backgroundColor: BankingColors.white },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.backgroundLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md },
  searchInput: {
    flex: 1,
    marginLeft: Spacing.md,
    fontSize: FontSize.md,
    color: BankingColors.textPrimary } });
