import React, { useMemo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Text,
  Keyboard,
  ScrollView,
  Dimensions,
  StyleSheet,
} from "react-native";
import { CreditCard, User, Calendar, Hash, Shield } from "lucide-react-native";

import TText from "@/components/TText";
import { BankingColors } from "@/constants/banking-colors";
import { getAccountTypeKey } from "@/hooks/getAccountTypeKey";
import { formatBalance } from "@/utils/account-formatters";
import { Card } from "@/types/card.type";
import { FontFamily } from "@/constants";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";
import { se } from "date-fns/locale";

/* ─────────────────────────── helpers ─────────────────────────── */

function isFlexCard(card: Card): boolean {
  return card.accounts?.[0]?.accountType?.toString() === "4";
}

const formatPan = (pan: string | undefined) => {
  if (!pan) return "•••• •••• •••• ••••";
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

const { width: SCREEN_W } = Dimensions.get("window");
const IS_SMALL = SCREEN_W < 380;

/* ─────────────────────────── component ─────────────────────────── */

type Props = {
  visible: boolean;
  currentCard?: Card | null;
  formatExpiryDate?: (iso: string) => string;
  onClose: () => void;
  styles?: any;
};

export default function CardDetailModal({
  visible,
  currentCard,
  onClose,
}: Props) {
  const accountTypeKey = useMemo(
    () => getAccountTypeKey(currentCard?.accounts?.[0]?.accountType),
    [currentCard?.accounts?.[0]?.accountType],
  );

  const flex = isFlexCard((currentCard ?? {}) as Card);

  const currency =
    currentCard?.accounts?.[0]?.currency?.alphaCode ||
    currentCard?.accounts?.[0]?.currency?.designation ||
    "TND";

  const productName = currentCard?.product?.description ?? "";
  const holderName = currentCard?.namePrinted ?? "";
  const maskedPan = formatPan((currentCard as any)?.pcipan);
  const expiry = formatExpiry((currentCard as any)?.expiryDate);

  const statusKey =
    (currentCard as any)?.cardStatus?.activation === "1"
      ? "cards.active"
      : "cards.inactive";

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={s.overlay}>
          <View style={s.container}>
            <ScrollView
              bounces={false}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.scrollContent}
            >
              {/* ✅ Top title requested */}
              <TText style={s.topTitle} tKey="cards.detailsTitle" />

              {/* Main title */}

              {/* Card info box like Modify Limit */}
              <View style={s.cardInfoBox}>
                <View style={s.cardInfoHeader}>
                  <View style={s.cardIconCircle}>
                    <CreditCard size={20} color={BankingColors.primary} />
                  </View>

                  <View style={s.cardInfoTexts}>
                    <Text style={s.cardProductText}>{productName}</Text>
                    <Text style={s.cardPanText}>{maskedPan}</Text>
                  </View>
                </View>

                <View style={s.cardDetailRows}>
                  <View style={s.cardDetailItem}>
                    <User size={14} color={BankingColors.textSecondary} />
                    <Text style={s.cardDetailLabel}>{holderName || "—"}</Text>
                  </View>
                </View>
              </View>

              {/* Details list */}
              <View style={s.detailList}>
                <View style={s.detailRow}>
                  <View style={s.detailLeft}>
                    <Shield size={16} color={BankingColors.textSecondary} />
                    <TText style={s.detailLabel} tKey="cards.status" />
                  </View>
                  <TText style={s.detailValue} tKey={statusKey} />
                </View>

                <View style={s.detailRow}>
                  <View style={s.detailLeft}>
                    <Hash size={16} color={BankingColors.textSecondary} />
                    <TText
                      style={s.detailLabel}
                      tKey="cards.accountType.label"
                    />
                  </View>
                  <TText style={s.detailValue} tKey={accountTypeKey} />
                </View>

                {!flex && (
                  <View style={s.detailRow}>
                    <View style={s.detailLeft}>
                      <TText
                        style={s.detailLabel}
                        tKey="cards.remainingLimit"
                      />
                    </View>
                    <Text style={s.detailValue}>
                      {formatBalance(
                        (currentCard as any)?.globalRemaining,
                        currency,
                      )}
                    </Text>
                  </View>
                )}

                {!flex && (
                  <View style={s.detailRow}>
                    <View style={s.detailLeft}>
                      <TText style={s.detailLabel} tKey="cards.cardLimit" />
                    </View>
                    <Text style={s.detailValue}>
                      {formatBalance(
                        (currentCard as any)?.globalLimit,
                        currency,
                      )}
                    </Text>
                  </View>
                )}

                {flex && (
                  <View style={s.detailRow}>
                    <View style={s.detailLeft}>
                      <TText
                        style={s.detailLabel}
                        tKey="cards.availableBalance"
                      />
                    </View>
                    <Text style={s.detailValue}>
                      {formatBalance(
                        currentCard?.accounts?.[0]?.available,
                        currency,
                      )}
                    </Text>
                  </View>
                )}

                {flex && (
                  <View style={s.detailRow}>
                    <View style={s.detailLeft}>
                      <TText
                        style={s.detailLabel}
                        tKey="cards.initialBalance"
                      />
                    </View>
                    <Text style={s.detailValue}>
                      {formatBalance(
                        (currentCard?.accounts?.[0] as any)?.creditLimit,
                        currency,
                      )}
                    </Text>
                  </View>
                )}

                <View style={[s.detailRow, s.detailRowLast]}>
                  <View style={s.detailLeft}>
                    <Calendar size={16} color={BankingColors.textSecondary} />
                    <TText style={s.detailLabel} tKey="cards.expiryDate" />
                  </View>
                  <Text style={s.detailValue}>
                    {currentCard?.expiryDate
                      ? new Date(currentCard.expiryDate).toLocaleDateString(
                          selectedLanguage ?? undefined,
                          {
                            month: "2-digit",
                            year: "2-digit",
                          },
                        )
                      : ""}
                  </Text>
                </View>
              </View>

              {/* Button */}
              <TouchableOpacity
                style={s.okBtn}
                onPress={onClose}
                activeOpacity={0.75}
              >
                <TText style={s.okBtnText} tKey="modal.ok" />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ─────────────────────────── styles ─────────────────────────── */

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    width: "100%",
    maxWidth: 520,
    maxHeight: "90%",
    overflow: "hidden",
  },
  scrollContent: {
    paddingVertical: 22,
    paddingHorizontal: IS_SMALL ? 16 : 22,
  },

  topTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: 6,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },

  title: {
    fontSize: 20,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.primary,
    textAlign: "center",
    marginBottom: 18,
  },

  cardInfoBox: {
    backgroundColor: BankingColors.surface ?? "#F8F9FA",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BankingColors.borderPale ?? "#EFEFEF",
    marginBottom: 18,
  },
  cardInfoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cardIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,120,90,0.08)",
    justifyContent: "center",
    alignItems: "center",
  },
  cardInfoTexts: {
    flex: 1,
  },
  cardProductText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: 2,
  },
  cardPanText: {
    fontSize: 13,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
    letterSpacing: 1.4,
  },
  cardDetailRows: {
    gap: 12,
  },

  cardDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardDetailLabel: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.semibold,
  },

  detailList: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BankingColors.borderPale ?? "#EFEFEF",
    overflow: "hidden",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: BankingColors.borderPale ?? "#EFEFEF",
  },
  detailRowLast: {
    borderBottomWidth: 0,
  },
  detailLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    fontFamily: FontFamily.bold,
  },
  detailValue: {
    fontSize: 13,
    color: BankingColors.text,
    fontFamily: FontFamily.extrabold,
    textAlign: "right",
    marginLeft: 12,
  },

  okBtn: {
    backgroundColor: BankingColors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  okBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: "#FFFFFF",
  },
});
