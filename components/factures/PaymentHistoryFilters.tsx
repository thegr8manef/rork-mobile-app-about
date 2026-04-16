import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Select, SelectTrigger, SelectInput, SelectIcon, SelectPortal, SelectBackdrop, SelectContent, SelectDragIndicatorWrapper, SelectDragIndicator, SelectItem } from '@/components/ui/select';
import { ChevronDown } from 'lucide-react-native';
import TText from '@/components/TText';
import { BankingColors } from '@/constants/banking-colors';
import { Spacing } from '@/constants/spacing';
import { FontSize, FontFamily } from "@/constants/typography";
import { BorderRadius } from '@/constants/sizes';
import { Shadow } from '@/constants/shadows';
import { Input, InputField } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { Biller } from "@/types/billers";

interface PaymentHistoryFiltersProps {
  billers: Biller[];
  selectedBillerId: string | null;
  selectedStatus: string | null;
  minAmount: string;
  maxAmount: string;
  startDate: string;
  endDate: string;
  onBillerChange: (billerId: string | null) => void;
  onStatusChange: (status: 'INIT' | 'PAID' | 'REJECTED') => void;
  onMinAmountChange: (amount: string) => void;
  onMaxAmountChange: (amount: string) => void;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onApplyFilters: () => void;
  onResetFilters: () => void;
}

export default function PaymentHistoryFilters({
  billers,
  selectedBillerId,
  selectedStatus,
  minAmount,
  maxAmount,
  startDate,
  endDate,
  onBillerChange,
  onStatusChange,
  onMinAmountChange,
  onMaxAmountChange,
  onStartDateChange,
  onEndDateChange,
  onApplyFilters,
  onResetFilters }: PaymentHistoryFiltersProps) {
  return (
    <View style={styles.container}>
      <TText tKey="bills.filters" style={styles.title} />

      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <TText tKey="bills.biller" style={styles.label} />
          <Select
            selectedValue={selectedBillerId || undefined}
            onValueChange={(value) => onBillerChange(value === 'all' ? null : value)}
          >
            <SelectTrigger style={styles.selectTrigger}>
              <SelectInput placeholder="All Billers" style={styles.selectInput} />
              <SelectIcon>
                <ChevronDown size={20} color={BankingColors.textSecondary} />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="All Billers" value="all" />
                {billers.map((biller) => (
                  <SelectItem 
                    key={biller.id} 
                    label={biller.billerLabel} 
                    value={biller.id} 
                  />
                ))}
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>

        <View style={styles.filterItem}>
          <TText tKey="bills.status" style={styles.label} />
          <Select
            selectedValue={selectedStatus || undefined}
            onValueChange={(value) => onStatusChange(value === 'all' ? null : value)}
          >
            <SelectTrigger style={styles.selectTrigger}>
              <SelectInput placeholder="All Statuses" style={styles.selectInput} />
              <SelectIcon>
                <ChevronDown size={20} color={BankingColors.textSecondary} />
              </SelectIcon>
            </SelectTrigger>
            <SelectPortal>
              <SelectBackdrop />
              <SelectContent>
                <SelectDragIndicatorWrapper>
                  <SelectDragIndicator />
                </SelectDragIndicatorWrapper>
                <SelectItem label="All Statuses" value="all" />
                <SelectItem label="Paid" value="PAID" />
                <SelectItem label="In Progress" value="INIT" />
                <SelectItem label="Failed" value="REJECTED" />
              </SelectContent>
            </SelectPortal>
          </Select>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <TText tKey="bills.minAmount" style={styles.label} />
          <Input style={styles.input}>
            <InputField
              placeholder="0.000"
              keyboardType="decimal-pad"
              value={minAmount}
              onChangeText={onMinAmountChange}
            />
          </Input>
        </View>

        <View style={styles.filterItem}>
          <TText tKey="bills.maxAmount" style={styles.label} />
          <Input style={styles.input}>
            <InputField
              placeholder="0.000"
              keyboardType="decimal-pad"
              value={maxAmount}
              onChangeText={onMaxAmountChange}
            />
          </Input>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterItem}>
          <TText tKey="bills.startDate" style={styles.label} />
          <Input style={styles.input}>
            <InputField
              placeholder="YYYY-MM-DD"
              value={startDate}
              onChangeText={onStartDateChange}
            />
          </Input>
        </View>

        <View style={styles.filterItem}>
          <TText tKey="bills.endDate" style={styles.label} />
          <Input style={styles.input}>
            <InputField
              placeholder="YYYY-MM-DD"
              value={endDate}
              onChangeText={onEndDateChange}
            />
          </Input>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Button 
          onPress={onResetFilters}
          variant="outline"
          style={styles.resetButton}
        >
          <ButtonText>
            <TText tKey="bills.resetFilters" />
          </ButtonText>
        </Button>

        <Button 
          onPress={onApplyFilters}
          style={styles.applyButton}
        >
          <ButtonText>
            <TText tKey="bills.applyFilters" />
          </ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    ...Shadow.card },
  title: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.md },
  filterRow: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginBottom: Spacing.md },
  filterItem: {
    flex: 1 },
  label: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textGray,
    marginBottom: Spacing.xs },
  selectTrigger: {
    borderColor: BankingColors.border,
    borderRadius: BorderRadius.md },
  selectInput: {
    fontSize: FontSize.base,
    color: BankingColors.text },
  input: {
    borderColor: BankingColors.border,
    borderRadius: BorderRadius.md },
  buttonRow: {
    flexDirection: 'row' as const,
    gap: Spacing.md,
    marginTop: Spacing.sm },
  resetButton: {
    flex: 1 },
  applyButton: {
    flex: 1,
    backgroundColor: BankingColors.primary } });
