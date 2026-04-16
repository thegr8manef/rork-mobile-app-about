import React, { useMemo } from "react";
import { View, StyleSheet, ActivityIndicator, FlatList } from "react-native";
import { useLocalSearchParams } from "expo-router";
import {
  Clock,
  AlertCircle,
  RefreshCw,
  Wallet,
  Edit3,
  CreditCard,
  ShieldOff,
  ShieldCheck,
  KeyRound,
  ReceiptText,
} from "lucide-react-native";

import TText from "@/components/TText";
import ScreenState from "@/components/ScreenState";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { BorderRadius } from "@/constants/sizes";
import { Shadow } from "@/constants/shadows";

import { useCardOperations } from "@/hooks/use-card";
import { FontFamily } from "@/constants";
import { useAppPreferencesStore } from "@/store/store";
import { LangChoice } from "../(menu)/language";

type Op = {
  updateCardCommandType: string;
  createdAt?: string | null;
};

/** ---------- Date parsing (backend formats) ---------- */
const parseBackendDate = (raw?: string | null): Date | null => {
  if (!raw || typeof raw !== "string") return null;

  const s = raw.trim();
  if (!s) return null;

  // 1) ISO (2026-02-03T10:11:12Z) or any ISO-like
  if (s.includes("T")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // 2) YYYY-MM-DD or YYYY-MM-DD HH:mm:ss
  const m1 = s.match(
    /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m1) {
    const [, y, mo, da, hh, mm, ss] = m1;
    const d = new Date(
      Number(y),
      Number(mo) - 1,
      Number(da),
      hh ? Number(hh) : 0,
      mm ? Number(mm) : 0,
      ss ? Number(ss) : 0,
    );
    return isNaN(d.getTime()) ? null : d;
  }

  // 3) DD-MM-YYYY or DD-MM-YYYY HH:mm:ss
  const m2 = s.match(
    /^(\d{2})-(\d{2})-(\d{4})(?:[ T](\d{2}):(\d{2})(?::(\d{2}))?)?$/,
  );
  if (m2) {
    const [, da, mo, y, hh, mm, ss] = m2;
    const d = new Date(
      Number(y),
      Number(mo) - 1,
      Number(da),
      hh ? Number(hh) : 0,
      mm ? Number(mm) : 0,
      ss ? Number(ss) : 0,
    );
    return isNaN(d.getTime()) ? null : d;
  }

  // 4) last try: native Date parse (not perfect but ok)
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

/** ---------- UI mapping: same icons + same colors as Cartes actions ---------- */
const commandLabelKey = (type: string) => `carte.history.command.${type}`;

const getCommandMeta = (type: string) => {
  switch (type) {
    case "RESET_PIN":
      return {
        Icon: RefreshCw,
        iconColor: BankingColors.accentBlue,
        bg: BankingColors.actionBlue,
      };

    case "REQUEST_PIN":
      return {
        Icon: KeyRound,
        iconColor: BankingColors.accentBlue,
        bg: BankingColors.actionBlue,
      };

    case "DISABLE_3D_SECURE":
      return {
        Icon: Wallet,
        iconColor: BankingColors.accentAmber,
        bg: BankingColors.actionOrange,
      };

    case "EDIT_CARD_LIMIT":
      return {
        Icon: Edit3,
        iconColor: BankingColors.accentPurple,
        bg: BankingColors.actionPurple,
      };

    case "REPLACE_CARD":
      return {
        Icon: CreditCard,
        iconColor: BankingColors.primary,
        bg: BankingColors.actionRed,
      };

    case "ENABLE_CARD":
      return {
        Icon: ShieldCheck,
        iconColor: BankingColors.accentGreen,
        bg: BankingColors.actionGreen,
      };

    case "DISABLE_CARD":
      return {
        Icon: ShieldOff,
        iconColor: BankingColors.primary,
        bg: BankingColors.actionRed,
      };

    case "UPDATE_FLEX_INSTALLMENT":
      return {
        Icon: ReceiptText,
        iconColor: BankingColors.installments ?? BankingColors.accentPurple,
        bg: BankingColors.errorLightRed ?? BankingColors.actionPurple,
      };

    default:
      return {
        Icon: Clock,
        iconColor: BankingColors.textSecondary,
        bg: BankingColors.borderMedium,
      };
  }
};

export default function CarteHistoryScreen() {
  const { cardId } = useLocalSearchParams<{ cardId?: string | string[] }>();

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const formatDateLine = (raw?: string | null) => {
    const d = parseBackendDate(raw);
    if (!d) return null; // ✅ if no createdAt OR invalid => show nothing

    // "JJ mois YYYY" + time
    const date = d.toLocaleDateString(selectedLanguage ?? undefined, {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    const time = d.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });

    return `${date} • ${time}`;
  };

  const resolvedCardId =
    typeof cardId === "string"
      ? cardId
      : Array.isArray(cardId)
        ? cardId[0]
        : "";

  const { data, isLoading, isFetching, error } =
    useCardOperations(resolvedCardId);

  const operations: Op[] = data?.data ?? [];

  const emptyIcon = useMemo(
    () => (
      <View style={styles.emptyIcon}>
        <Clock color={BankingColors.textSecondary} size={22} />
      </View>
    ),
    [],
  );

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.messageCard}>
          <View style={styles.messageHeader}>
            <AlertCircle color={BankingColors.warning} size={18} />
            <TText
              style={styles.messageTitle}
              tKey="carte.history.aboutTitle"
            />
          </View>

          <TText style={styles.messageText} tKey="carte.history.descText" />
        </View>

        {!resolvedCardId ? (
          <View style={styles.center}>
            <AlertCircle color={BankingColors.error} size={28} />
            <TText
              style={styles.title}
              tKey="carte.history.missingCardId.title"
            />
            <TText
              style={styles.subText}
              tKey="carte.history.missingCardId.desc"
            />
          </View>
        ) : isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator />
            <TText style={styles.subText} tKey="carte.history.loading" />
          </View>
        ) : error ? (
          <View style={styles.center}>
            <AlertCircle color={BankingColors.error} size={28} />
            <TText style={styles.title} tKey="carte.history.failed.title" />
            {/* message is backend, keep as plain */}
            <TText style={styles.subText}>
              {(error as any)?.message ?? ""}
            </TText>
          </View>
        ) : operations.length === 0 ? (
          <ScreenState
            variant="empty"
            titleKey="carte.history.empty.title"
            descriptionKey="carte.history.empty.desc"
          />
        ) : (
          <>
            {isFetching ? (
              <View style={styles.fetchingRow}>
                <ActivityIndicator size="small" />
                <TText style={styles.metaText} tKey="carte.history.updating" />
              </View>
            ) : null}

            <FlatList
              data={operations}
              keyExtractor={(item, idx) =>
                `${item.updateCardCommandType}-${String(item.createdAt)}-${idx}`
              }
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => (
                <View style={{ height: Spacing.sm }} />
              )}
              renderItem={({ item }) => {
                const meta = getCommandMeta(item.updateCardCommandType);
                const dateLine = formatDateLine(item.createdAt);

                return (
                  <View style={styles.cardRow}>
                    {/* left icon bubble */}
                    <View
                      style={[styles.leftIcon, { backgroundColor: meta.bg }]}
                    >
                      <meta.Icon color={meta.iconColor} size={18} />
                    </View>

                    <View style={styles.rowBody}>
                      {/* ✅ translated command label */}
                      <TText
                        style={styles.rowTitle}
                        tKey={commandLabelKey(item.updateCardCommandType)}
                      />

                      {/* ✅ only show date if createdAt exists & is parseable */}
                      {dateLine ? (
                        <TText style={styles.rowSub}>{dateLine}</TText>
                      ) : null}
                    </View>

                    {/* ✅ small dot instead of big chip */}
                    <View style={[styles.dot, { backgroundColor: meta.bg }]} />
                  </View>
                );
              }}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  content: { flex: 1, paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg },

  descriptionCard: {
    backgroundColor: BankingColors.warning + "08",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.warning + "20",
  },
  descriptionText: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  title: {
    fontSize: 18,
    color: BankingColors.text,
    fontFamily: FontFamily.bold,
  },
  subText: {
    fontSize: 13,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
  },

  fetchingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metaText: { fontSize: 12, color: BankingColors.textSecondary },

  listContent: { paddingBottom: Spacing.xxl },

  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BankingColors.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BankingColors.borderGray,
  },

  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    backgroundColor: BankingColors.surface,
    borderWidth: 1,
    borderColor: BankingColors.borderGray,
    ...Shadow.card,
    gap: Spacing.md,
  },
  leftIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  rowBody: { flex: 1, gap: 4 },
  rowTitle: {
    fontSize: 15,
    color: BankingColors.text,
    fontFamily: FontFamily.bold,
  },
  rowSub: { fontSize: 12, color: BankingColors.textSecondary },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    opacity: 0.9,
  },
  messageCard: {
    backgroundColor: BankingColors.warning + "08",
    padding: Spacing.lg,
    borderRadius: 16,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: BankingColors.warning + "20",
  },
  messageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  messageTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bold,
    color: BankingColors.text, // strong readable
  },
  messageText: {
    fontSize: 12,
    lineHeight: 18,
    color: BankingColors.textSecondary, // softer but readable
  },
});
