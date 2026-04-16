// components/DateRangePicker.tsx
import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ChevronLeft, ChevronRight, Calendar, X } from "lucide-react-native";
import {
  BankingColors,
  Spacing,
  BorderRadius,
  FontSize,
  FontFamily,
} from "@/constants";
import TText from "./TText";
import { LangChoice } from "@/app/(root)/(tabs)/(menu)/language";
import { useAppPreferencesStore } from "@/store/store";

const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

// Monday-based: Mon=0 ... Sun=6
function getFirstDayOffset(year: number, month: number) {
  const day = new Date(year, month, 1).getDay(); // Sun=0
  return day === 0 ? 6 : day - 1;
}

function toDateString(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function compareDateStr(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

interface DateRangePickerProps {
  startDate?: string; // YYYY-MM-DD
  endDate?: string;
  onChange: (start?: string, end?: string) => void;
}

export default function DateRangePicker({
  startDate,
  endDate,
  onChange,
}: DateRangePickerProps) {
  const [visible, setVisible] = useState(false);
  const today = new Date();

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  // picking state: null = no selection started, string = start picked, waiting for end
  const [picking, setPicking] = useState<string | null>(null);

  const selectedLanguage = useAppPreferencesStore(
    (s) => s.selectedLanguage,
  ) as LangChoice;

  const todayStr = toDateString(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const open = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setPicking(null);
    setVisible(true);
  };

  const close = () => {
    setPicking(null);
    setVisible(false);
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const handleDayPress = (dateStr: string) => {
    if (compareDateStr(dateStr, todayStr) > 0) return; // future blocked

    if (!picking) {
      // first tap = start
      setPicking(dateStr);
      onChange(dateStr, undefined);
    } else {
      // second tap = end
      const [s, e] =
        compareDateStr(picking, dateStr) <= 0
          ? [picking, dateStr]
          : [dateStr, picking];
      onChange(s, e);
      setPicking(null);
      setVisible(false);
    }
  };

  const applyQuick = (months: number) => {
    const end = new Date();
    const start = new Date();
    if (months === 0) {
      start.setDate(1); // first day of current month
    } else {
      start.setMonth(start.getMonth() - months);
    }
    onChange(
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
    );
    setPicking(null);
    setVisible(false);
  };

  const getDayStyle = (dateStr: string) => {
    const isFuture = compareDateStr(dateStr, todayStr) > 0;
    const isStart = dateStr === (picking ?? startDate);
    const isEnd = !picking && dateStr === endDate;
    const inRange =
      !picking &&
      startDate &&
      endDate &&
      compareDateStr(dateStr, startDate) >= 0 &&
      compareDateStr(dateStr, endDate) <= 0;
    const isToday = dateStr === todayStr;

    return { isFuture, isStart, isEnd, inRange: !!inRange, isToday };
  };

  const formatDisplay = () => {
    if (!startDate && !endDate) return "Toutes les dates";
    const fmt = (d: string) =>
      new Date(d).toLocaleDateString(selectedLanguage ?? undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    if (startDate && endDate) return `${fmt(startDate)} – ${fmt(endDate)}`;
    if (startDate) return `Depuis ${fmt(startDate)}`;
    return `Jusqu'au ${fmt(endDate!)}`;
  };

  // Build calendar grid
  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const offset = getFirstDayOffset(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  // pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks: (number | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  return (
    <>
      {/* Trigger — matches your existing filterTagSecondary style */}
      <TouchableOpacity
        style={styles.trigger}
        onPress={open}
        activeOpacity={0.8}
      >
        <Calendar size={14} color={BankingColors.primary} />
        <TText style={styles.triggerText}>{formatDisplay()}</TText>
        {(startDate || endDate) && (
          <TouchableOpacity
            onPress={() => {
              onChange(undefined, undefined);
              setPicking(null);
            }}
            hitSlop={10}
          >
            <X size={14} color={BankingColors.textSecondary} />
          </TouchableOpacity>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={close}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={close}
        >
          <TouchableOpacity activeOpacity={1} style={styles.sheet}>
            {/* Sheet header */}
            <View style={styles.sheetHeader}>
              <TText style={styles.sheetTitle} tKey="dateRangePicker.title" />
              <TouchableOpacity onPress={close} hitSlop={8}>
                <X size={20} color={BankingColors.text} />
              </TouchableOpacity>
            </View>

            {picking && (
              <View style={styles.hintRow}>
                <TText
                  style={styles.hintText}
                  tKey="dateRangePicker.selectEndDate"
                />
              </View>
            )}

            {/* Month navigation */}
            <View style={styles.monthNav}>
              <TouchableOpacity
                onPress={prevMonth}
                style={styles.navBtn}
                hitSlop={8}
              >
                <ChevronLeft size={22} color={BankingColors.primary} />
              </TouchableOpacity>
              <TText style={styles.monthLabel}>
                {MONTHS[viewMonth]} {viewYear}
              </TText>
              <TouchableOpacity
                onPress={nextMonth}
                style={styles.navBtn}
                hitSlop={8}
              >
                <ChevronRight size={22} color={BankingColors.primary} />
              </TouchableOpacity>
            </View>

            {/* Day headers */}
            <View style={styles.weekRow}>
              {DAYS.map((d) => (
                <View key={d} style={styles.dayHeaderCell}>
                  <TText style={styles.dayHeaderText}>{d}</TText>
                </View>
              ))}
            </View>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <View key={wi} style={styles.weekRow}>
                {week.map((day, di) => {
                  if (!day) return <View key={di} style={styles.dayCell} />;
                  const dateStr = toDateString(viewYear, viewMonth, day);
                  const { isFuture, isStart, isEnd, inRange, isToday } =
                    getDayStyle(dateStr);

                  return (
                    <TouchableOpacity
                      key={di}
                      style={[
                        styles.dayCell,
                        inRange && styles.dayCellInRange,
                        (isStart || isEnd) && styles.dayCellSelected,
                        isFuture && styles.dayCellFuture,
                      ]}
                      onPress={() => handleDayPress(dateStr)}
                      disabled={isFuture}
                      activeOpacity={0.7}
                    >
                      <TText
                        style={[
                          styles.dayText,
                          isToday && styles.dayTextToday,
                          (isStart || isEnd) && styles.dayTextSelected,
                          inRange && styles.dayTextInRange,
                          isFuture && styles.dayTextFuture,
                        ]}
                      >
                        {day}
                      </TText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}

            {/* Quick shortcuts */}
            <View style={styles.quickRow}>
              {[
                { label: "Ce mois", months: 0 },
                { label: "3 mois", months: 3 },
                { label: "6 mois", months: 6 },
                { label: "1 an", months: 12 },
              ].map((q) => (
                <TouchableOpacity
                  key={q.label}
                  style={styles.quickBtn}
                  onPress={() => applyQuick(q.months)}
                >
                  <TText style={styles.quickBtnText}>{q.label}</TText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: BankingColors.primary + "15",
    borderWidth: 1,
    borderColor: BankingColors.primary,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
  },
  triggerText: {
    flex: 1,
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.primary,
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.lg,
    paddingBottom: 32,
    marginBottom: Spacing.xxxl,
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  hintRow: {
    backgroundColor: BankingColors.primary + "12",
    borderRadius: BorderRadius.md,
    paddingVertical: 6,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    alignItems: "center",
  },
  hintText: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.medium,
  },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: BankingColors.primary + "12",
    justifyContent: "center",
    alignItems: "center",
  },
  monthLabel: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
  },
  weekRow: { flexDirection: "row" },
  dayHeaderCell: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
  },
  dayHeaderText: {
    fontSize: 11,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textSecondary,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 999,
    margin: 1,
  },
  dayCellInRange: {
    backgroundColor: BankingColors.primary + "18",
    borderRadius: 0,
    margin: 0,
  },
  dayCellSelected: {
    backgroundColor: BankingColors.primary,
    borderRadius: 999,
    margin: 1,
  },
  dayCellFuture: { opacity: 0.25 },
  dayText: { fontSize: FontSize.sm, color: BankingColors.text },
  dayTextToday: { fontFamily: FontFamily.bold, color: BankingColors.primary },
  dayTextSelected: { color: "#FFF", fontFamily: FontFamily.bold },
  dayTextInRange: { color: BankingColors.primary },
  dayTextFuture: { color: BankingColors.textLight },
  quickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: Spacing.lg,
    flexWrap: "wrap",
  },
  quickBtn: {
    borderWidth: 1,
    borderColor: BankingColors.primary + "40",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    backgroundColor: BankingColors.primary + "08",
  },
  quickBtnText: {
    fontSize: FontSize.sm,
    color: BankingColors.primary,
    fontFamily: FontFamily.semibold,
  },
});
