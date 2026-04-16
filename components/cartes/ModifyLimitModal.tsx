import React, { useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  TextInput,
  Keyboard,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet } from "react-native";
import Slider from "@react-native-community/slider";
import {
  Minus,
  Plus,
  CreditCard,
  User,
  Calendar } from "lucide-react-native";
import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { FontFamily } from "@/constants";

/* ──────────────────────────── helpers ──────────────────────────── */

const clamp = (n: number, min: number, max: number) =>
  Math.max(min, Math.min(max, n));

const parseAmount = (v: string) => {
  const n = Number(String(v).replace(",", ".").trim());
  return Number.isFinite(n) ? n : NaN;
};

const formatPan = (pan: string | undefined) => {
  if (!pan) return "••••";
  const last4 = pan.replace(/\*/g, "").slice(-4);
  return `•••• •••• •••• ${last4}`;
};

const formatExpiry = (iso: string | undefined) => {
  if (!iso) return "--/--";
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${mm}/${yy}`;
};

const STEP = 50;
const { width: SCREEN_W } = Dimensions.get("window");

/* ──────────────────────────── types ──────────────────────────── */

interface ModifyLimitModalProps {
  visible: boolean;
  value: string;
  onChange: (v: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  isUpdatingCard: boolean;
  card: any;
  maxLimit?: number;
  minLimit?: number;
}

/* ──────────────────────────── component ──────────────────────────── */

export default function ModifyLimitModal({
  visible,
  value,
  onChange,
  onCancel,
  onConfirm,
  isUpdatingCard,
  card,
  minLimit }: ModifyLimitModalProps) {
  /* ── derived card data ── */
  const currency =
    card?.accounts?.[0]?.currency?.alphaCode ||
    card?.accounts?.[0]?.currency?.designation ||
    "TND";

  const max = Number(card?.maxLimitProduct ?? card?.globalLimit ?? 0);
  const min = Number(minLimit ?? 0);

  const cardProductName = card?.product?.description ?? "";
  const holderName = card?.namePrinted ?? "";
  const maskedPan = formatPan(card?.pcipan);
  const expiry = formatExpiry(card?.expiryDate);

  /* ── input parsing & validation ── */
  const raw = useMemo(() => parseAmount(value), [value]);

  const sliderValue = useMemo(() => {
    if (!Number.isFinite(max) || max <= 0) return min;
    if (!Number.isFinite(raw)) return min;
    return clamp(raw, min, max);
  }, [raw, min, max]);

  const isInvalidNumber = value?.length > 0 && !Number.isFinite(raw);
  const isOverLimit =
    !isInvalidNumber && Number.isFinite(raw) && raw > max && max > 0;
  const isBelowMin = !isInvalidNumber && Number.isFinite(raw) && raw < min;
  const hasError = isInvalidNumber || isOverLimit || isBelowMin;

  const canConfirm =
    !isUpdatingCard &&
    !hasError &&
    value?.length > 0 &&
    Number.isFinite(raw) &&
    raw >= min &&
    raw <= max;

  /* ── handlers ── */
  const handleSliderChange = (v: number) => {
    onChange(String(Math.round(v)));
  };

  const bump = (delta: number) => {
    if (!Number.isFinite(max) || max <= 0) return;
    const current = Number.isFinite(raw) ? raw : min;
    const next = clamp(current + delta, min, max);
    onChange(String(Math.round(next)));
  };

  const handleTextChange = (text: string) => {
    onChange(text);
  };

  const minusDisabled =
    isUpdatingCard || !Number.isFinite(max) || max <= 0 || sliderValue <= min;

  const plusDisabled =
    isUpdatingCard || !Number.isFinite(max) || max <= 0 || sliderValue >= max;

  /* ────────────────────────── render ────────────────────────── */
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          <View style={styles.container}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.scrollContent}
            >
              {/* ── Title ── */}
              <TText style={styles.title} tKey="cards.modifyLimitTitle" />

              {/* ── Card info box ── */}
              <View style={styles.cardInfoBox}>
                <View style={styles.cardInfoHeader}>
                  <View style={styles.cardIconCircle}>
                    <CreditCard size={20} color={BankingColors.primary} />
                  </View>
                  <View style={styles.cardInfoTexts}>
                    <Text style={styles.cardProductText}>
                      {cardProductName}
                    </Text>
                    <Text style={styles.cardPanText}>{maskedPan}</Text>
                  </View>
                </View>

                <View style={styles.cardDetailRows}>
                  <View style={styles.cardDetailRow}>
                    <View style={styles.cardDetailItem}>
                      <User size={14} color={BankingColors.textSecondary} />
                      <Text style={styles.cardDetailLabel}>{holderName}</Text>
                    </View>
                    <View style={styles.cardDetailItem}>
                      <Calendar
                        size={14}
                        color={BankingColors.textSecondary}
                      />
                      <Text style={styles.cardDetailLabel}>{expiry}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ── New limit input ── */}
              <View style={styles.inputSection}>
                <TText style={styles.inputLabel} tKey="cards.modifyLimitNew" />

                <View
                  style={[
                    styles.inputWrapper,
                    hasError && styles.inputWrapperError,
                  ]}
                >
                  <TextInput
                    style={styles.input}
                    value={value}
                    keyboardType="decimal-pad"
                    onChangeText={handleTextChange}
                    contextMenuHidden
                    placeholder="0"
                    placeholderTextColor={BankingColors.textSecondary}
                    editable={!isUpdatingCard}
                    returnKeyType="done"
                    onSubmitEditing={Keyboard.dismiss}
                  />
                  <Text style={styles.currencyText}>{currency}</Text>
                </View>

                {/* Validation errors */}
                {isInvalidNumber ? (
                  <TText
                    style={styles.errorText}
                    tKey="cards.modifyLimitErrorInvalid"
                  />
                ) : isOverLimit ? (
                  <TText
                    style={styles.errorText}
                    tKey="cards.modifyLimitErrorOverMax"
                    values={{ max: String(max), currency }}
                  />
                ) : isBelowMin ? (
                  <TText
                    style={styles.errorText}
                    tKey="cards.modifyLimitErrorBelowMin"
                    values={{ min: String(min), currency }}
                  />
                ) : null}
              </View>

              {/* ── Slider ── */}
              <View style={styles.sliderSection}>
                <View style={styles.sliderRow}>
                  <TouchableOpacity
                    style={[
                      styles.sliderBtn,
                      minusDisabled && styles.sliderBtnDisabled,
                    ]}
                    onPress={() => bump(-STEP)}
                    disabled={minusDisabled}
                    activeOpacity={0.7}
                  >
                    <Minus
                      size={18}
                      color={
                        minusDisabled
                          ? BankingColors.textSecondary
                          : BankingColors.primary
                      }
                    />
                  </TouchableOpacity>

                  <View style={{ flex: 1 }}>
                    <Slider
                      value={sliderValue}
                      minimumValue={min}
                      maximumValue={
                        Number.isFinite(max) && max > 0 ? max : min
                      }
                      step={STEP}
                      onValueChange={handleSliderChange}
                      disabled={
                        !Number.isFinite(max) || max <= 0 || isUpdatingCard
                      }
                      minimumTrackTintColor={BankingColors.primary}
                      maximumTrackTintColor={BankingColors.borderGray}
                      thumbTintColor={BankingColors.primary}
                      style={{ height: 44, transform: [{ scaleY: 1.4 }] }}
                    />
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.sliderBtn,
                      plusDisabled && styles.sliderBtnDisabled,
                    ]}
                    onPress={() => bump(STEP)}
                    disabled={plusDisabled}
                    activeOpacity={0.7}
                  >
                    <Plus
                      size={18}
                      color={
                        plusDisabled
                          ? BankingColors.textSecondary
                          : BankingColors.primary
                      }
                    />
                  </TouchableOpacity>
                </View>

                <View style={styles.sliderMetaRow}>
                  <TText
                    style={styles.sliderMetaText}
                    tKey="cards.modifyLimitRangeMin"
                    values={{ min: String(min), currency }}
                  />
                  <TText
                    style={styles.sliderMetaText}
                    tKey="cards.modifyLimitRangeMax"
                    values={{
                      max:
                        Number.isFinite(max) && max > 0
                          ? String(max.toFixed(0))
                          : "--",
                      currency }}
                  />
                </View>
              </View>

              {/* ── Buttons ── */}
              <View style={styles.buttonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <TText style={styles.cancelBtnText} tKey="modal.cancel" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBtn,
                    !canConfirm && styles.confirmBtnDisabled,
                  ]}
                  onPress={onConfirm}
                  disabled={!canConfirm}
                  activeOpacity={0.7}
                >
                  <TText
                    style={styles.confirmBtnText}
                    tKey={
                      isUpdatingCard
                        ? "cards.modifyLimitProcessing"
                        : "verifymfa.confirm"
                    }
                  />
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ══════════════════════════ STYLES ══════════════════════════ */

const IS_SMALL = SCREEN_W < 380;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16 },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    overflow: "hidden" },
  scrollContent: {
    paddingVertical: 24,
    paddingHorizontal: IS_SMALL ? 16 : 22 },

  title: {
    fontSize: 20,
    fontFamily: FontFamily.bold,
    color: BankingColors.primary,
    textAlign: "center",
    marginBottom: 20 },

  cardInfoBox: {
    backgroundColor: BankingColors.surface ?? "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BankingColors.borderPale ?? "#EFEFEF",
    marginBottom: 20 },
  cardInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14 },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,120,90,0.08)",
    justifyContent: "center",
    alignItems: "center" },
  cardInfoTexts: {
    flex: 1 },
  cardProductText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 2 },
  cardPanText: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary,
    letterSpacing: 1.5 },

  cardDetailRows: {
    gap: 12 },
  cardDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between" },
  cardDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6 },
  cardDetailLabel: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.medium },

  inputSection: {
    marginBottom: 8 },
  inputLabel: {
    fontSize: 14,
    color: BankingColors.text,
    fontFamily: FontFamily.medium,
    marginBottom: 10 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: BankingColors.border ?? "#D1D5DB",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === "ios" ? 14 : 10,
    gap: 8,
    backgroundColor: "#FFFFFF" },
  inputWrapperError: {
    borderColor: "#EF4444" },
  input: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    padding: 0 },
  currencyText: {
    fontSize: 16,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    color: "#EF4444",
    fontFamily: FontFamily.medium },

  sliderSection: {
    marginTop: 12,
    marginBottom: 20,
    paddingHorizontal: 2 },
  sliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8 },
  sliderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: BankingColors.surface ?? "#F8F9FA",
    borderWidth: 1,
    borderColor: BankingColors.border ?? "#D1D5DB",
    alignItems: "center",
    justifyContent: "center" },
  sliderBtnDisabled: {
    opacity: 0.4 },
  sliderMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8 },
  sliderMetaText: {
    fontSize: 12,
    color: BankingColors.textSecondary },

  buttonsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: BankingColors.border ?? "#D1D5DB",
    alignItems: "center",
    justifyContent: "center" },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: BankingColors.primary,
    alignItems: "center",
    justifyContent: "center" },
  confirmBtnDisabled: {
    opacity: 0.45 },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.semibold,
    color: "#FFFFFF" } });