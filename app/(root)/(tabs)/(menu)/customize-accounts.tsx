import React, { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  PanResponder,
  ActivityIndicator,
  Platform } from "react-native";
import useShowMessage from "@/hooks/useShowMessage";

import {
  GripVertical,
  Pencil,
  Check,
  X,
  RotateCcw } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow, FontFamily } from "@/constants";
import {
  useCustomerAccounts,
  useUpdateAccounts } from "@/hooks/use-accounts-api";
import { Account, UpdateAccountPayloadItem } from "@/types/account.type";
import { useHaptic } from "@/utils/useHaptic";
import { formatBalance } from "@/utils/account-formatters";

interface EditableAccount {
  id: string;
  accountLabel: string;
  accountTitle: string;
  originalLabel: string;
  displayIndex: number;
  accountRib: string;
  availableBalance: string;
  currencyAlpha: string;
  isEditing: boolean;
}

export default function CustomizeAccountsScreen() {
  const { t } = useTranslation();
  const { data: accountsData, isLoading } = useCustomerAccounts();
  const updateMutation = useUpdateAccounts();
  const { triggerLightHaptic } = useHaptic();
  const { showMessageSuccess, showMessageError } = useShowMessage();

  const [accounts, setAccounts] = useState<EditableAccount[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const dragY = useRef(new Animated.Value(0)).current;
  const ITEM_HEIGHT = 88;
  const accountsRef = useRef<EditableAccount[]>([]);
  accountsRef.current = accounts;
  const panRespondersRef = useRef<Map<string, ReturnType<typeof PanResponder.create>>>(new Map());
  const consumedOffsetRef = useRef(0);

  useEffect(() => {
    if (accountsData?.data?.length && !initialized) {
      const sorted = [...accountsData.data].sort(
        (a, b) => a.displayIndex - b.displayIndex,
      );
      setAccounts(
        sorted.map((acc) => ({
          id: acc.id,
          accountLabel: acc.accountLabel,
          accountTitle: acc.accountTitle,
          originalLabel: acc.accountTitle,
          displayIndex: acc.displayIndex,
          accountRib: acc.accountRib,
          availableBalance: acc.availableBalance,
          currencyAlpha: acc.currencyAccount?.alphaCode ?? "TND",
          isEditing: false })),
      );
      setInitialized(true);
    }
  }, [accountsData, initialized]);

  const hasChanges = useMemo(() => {
    if (!accountsData?.data?.length || !accounts.length) return false;
    const original = [...accountsData.data].sort(
      (a, b) => a.displayIndex - b.displayIndex,
    );
    return accounts.some((acc, idx) => {
      const orig = original[idx];
      if (!orig) return true;
      return acc.id !== orig.id || acc.accountTitle !== orig.accountTitle;
    });
  }, [accounts, accountsData]);

  const handleEditLabel = useCallback(
    (index: number) => {
      triggerLightHaptic();
      setAccounts((prev) =>
        prev.map((acc, i) => ({
          ...acc,
          isEditing: i === index ? !acc.isEditing : false })),
      );
    },
    [triggerLightHaptic],
  );

  const handleLabelChange = useCallback((index: number, text: string) => {
    setAccounts((prev) =>
      prev.map((acc, i) =>
        i === index ? { ...acc, accountTitle: text, accountLabel: text } : acc,
      ),
    );
  }, []);

  const handleCancelEdit = useCallback((index: number) => {
    setAccounts((prev) =>
      prev.map((acc, i) =>
        i === index
          ? {
              ...acc,
              accountTitle: acc.originalLabel,
              accountLabel: acc.originalLabel,
              isEditing: false }
          : acc,
      ),
    );
  }, []);

  const handleConfirmEdit = useCallback((index: number) => {
    setAccounts((prev) =>
      prev.map((acc, i) =>
        i === index ? { ...acc, isEditing: false } : acc,
      ),
    );
  }, []);

  const handleConfirm = useCallback(async () => {
    const payload: UpdateAccountPayloadItem[] = accounts.map((acc, idx) => ({
      accountId: acc.id,
      displayIndex: idx,
      accountLabel: acc.accountLabel ?? acc.accountTitle }));

    console.log("[CustomizeAccounts] Confirming update:", JSON.stringify(payload));

    updateMutation.mutate(payload, {
      onSuccess: () => {
        console.log("[CustomizeAccounts] Update success");
        showMessageSuccess("customizeAccounts.successTitle", "customizeAccounts.successMessage");

        setInitialized(false);
      },
      onError: (err: any) => {
        console.log("[CustomizeAccounts] Update failed:", err?.message);
        showMessageError("customizeAccounts.errorTitle", "customizeAccounts.errorMessage");
      } });
  }, [accounts, updateMutation]);

  const handleReset = useCallback(() => {
    setInitialized(false);
  }, []);



  const getPanResponder = useCallback(
    (id: string, index: number) => {
      if (panRespondersRef.current.has(id)) {
        return panRespondersRef.current.get(id)!;
      }
      const responder = PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gs) =>
          Math.abs(gs.dy) > 5,
        onPanResponderGrant: () => {
          triggerLightHaptic();
          const currentIdx = accountsRef.current.findIndex((a) => a.id === id);
          setDragIndex(currentIdx >= 0 ? currentIdx : index);
          setScrollEnabled(false);
          dragY.setValue(0);
          consumedOffsetRef.current = 0;
        },
        onPanResponderMove: (_, gestureState) => {
          const adjustedDy = gestureState.dy - consumedOffsetRef.current * ITEM_HEIGHT;
          dragY.setValue(adjustedDy);
          const currentIdx = accountsRef.current.findIndex((a) => a.id === id);
          if (currentIdx < 0) return;
          const totalOffset = Math.round(gestureState.dy / ITEM_HEIGHT);
          const pendingOffset = totalOffset - consumedOffsetRef.current;
          const direction = pendingOffset > 0 ? 1 : pendingOffset < 0 ? -1 : 0;
          if (direction === 0) return;
          const targetIdx = currentIdx + direction;
          if (
            targetIdx >= 0 &&
            targetIdx < accountsRef.current.length
          ) {
            triggerLightHaptic();
            consumedOffsetRef.current += direction;
            setAccounts((prev) => {
              const next = [...prev];
              const fromIdx = next.findIndex((a) => a.id === id);
              if (fromIdx < 0 || fromIdx === targetIdx) return prev;
              const [moved] = next.splice(fromIdx, 1);
              next.splice(targetIdx, 0, moved);
              return next;
            });
            setDragIndex(targetIdx);
          }
        },
        onPanResponderRelease: () => {
          setDragIndex(null);
          setScrollEnabled(true);
          Animated.spring(dragY, {
            toValue: 0,
            useNativeDriver: true,
            tension: 200,
            friction: 20 }).start();

          // ✅ Log the order after each drop so we can verify indices
          console.log(
            "[CustomizeAccounts] DROP order:",
            accountsRef.current.map((a, i) => ({
              position: i,
              displayIndex_willSend: i,
              id: a.id,
              label: a.accountTitle,
            })),
          );
        },
        onPanResponderTerminate: () => {
          setDragIndex(null);
          setScrollEnabled(true);
          dragY.setValue(0);
        } });
      panRespondersRef.current.set(id, responder);
      return responder;
    },
    [dragY, triggerLightHaptic],
  );

  useEffect(() => {
    const currentIds = new Set(accounts.map((a) => a.id));
    panRespondersRef.current.forEach((_, key) => {
      if (!currentIds.has(key)) panRespondersRef.current.delete(key);
    });
  }, [accounts]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={BankingColors.primary} />
        <Text style={styles.loadingText}>{t("customizeAccounts.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >
        <Text style={styles.subtitle}>
          {t("customizeAccounts.subtitle")}
        </Text>

        <View style={styles.listContainer}>
          <View style={styles.timelineBar} />

          {accounts.map((account, index) => {
            const panResponder = getPanResponder(account.id, index);
            const isDragging = dragIndex === index;

            return (
              <Animated.View
                key={account.id}
                style={[
                  styles.cardWrapper,
                  isDragging && {
                    transform: [{ translateY: dragY }],
                    zIndex: 999,
                    elevation: 10 },
                ]}
              >
                <View
                  style={[
                    styles.card,
                    isDragging && styles.cardDragging,

                  ]}
                >
                  <View
                    {...panResponder.panHandlers}
                    style={styles.dragHandle}
                  >
                    <GripVertical
                      size={20}
                      color={BankingColors.info}
                      strokeWidth={2}
                    />
                  </View>

                  <View style={styles.cardContent}>
                    {account.isEditing ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={styles.editInput}
                          value={account.accountLabel ?? account.accountTitle}
                          onChangeText={(text) =>
                            handleLabelChange(index, text)
                          }
                          autoFocus
                          selectTextOnFocus
                          maxLength={50}
                        />
                      </View>
                    ) : (
                      <>
                        <Text
                          style={styles.accountName}
                          numberOfLines={1}
                          ellipsizeMode="tail"
                        >
                          {account.accountLabel ?? account.accountTitle}
                        </Text>
                        <Text style={styles.accountBalance}>
                          {formatBalance(
                            account.availableBalance,
                            account.currencyAlpha,
                          )}
                        </Text>
                      </>
                    )}
                  </View>

                  <View style={styles.actionsRow}>
                    {account.isEditing ? (
                      <>
                        <TouchableOpacity
                          onPress={() => handleConfirmEdit(index)}
                          style={[styles.actionButton, styles.confirmEditButton]}
                          activeOpacity={0.7}
                        >
                          <Check size={16} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleCancelEdit(index)}
                          style={[styles.actionButton, styles.cancelEditButton]}
                          activeOpacity={0.7}
                        >
                          <X size={16} color="#FFFFFF" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        onPress={() => handleEditLabel(index)}
                        style={[styles.actionButton, styles.editButton]}
                        activeOpacity={0.7}
                      >
                        <Pencil size={16} color="#FFFFFF" strokeWidth={2.5} />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>


              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          onPress={handleReset}
          style={styles.resetButton}
          activeOpacity={0.7}
          disabled={!hasChanges}
        >
          <RotateCcw
            size={18}
            color={hasChanges ? BankingColors.textSecondary : BankingColors.disabled}
            strokeWidth={2}
          />
          <Text
            style={[
              styles.resetText,
              !hasChanges && styles.disabledText,
            ]}
          >
            {t("customizeAccounts.reset")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleConfirm}
          style={[
            styles.confirmButton,
            (!hasChanges || updateMutation.isPending) && styles.confirmButtonDisabled,
          ]}
          activeOpacity={0.7}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Check size={18} color="#FFFFFF" strokeWidth={2.5} />
              <Text style={styles.confirmText}>{t("customizeAccounts.confirm")}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F7FA",
    gap: Spacing.md },
  loadingText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  scrollView: {
    flex: 1 },
  scrollContent: {
    paddingTop: Spacing.lg,
    paddingBottom: 120 },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl },
  listContainer: {
    paddingHorizontal: Spacing.lg,
    position: "relative" },
  timelineBar: {
    position: "absolute",
    left: Spacing.lg + 22,
    top: 12,
    bottom: 12,
    width: 2.5,
    backgroundColor: BankingColors.info + "30",
    borderRadius: 2 },
  cardWrapper: {
    marginBottom: Spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingLeft: Spacing.sm,
    paddingRight: Spacing.md,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    ...Shadow.card,
    gap: Spacing.sm },
  cardDragging: {
    backgroundColor: "#FAFCFF",
    borderColor: BankingColors.info,
    borderWidth: 1.5,
    ...Shadow.lg },

  dragHandle: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center" },
  cardContent: {
    flex: 1,
    minWidth: 0 },
  accountName: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: 3 },
  accountBalance: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary },
  editRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs },
  editInput: {
    flex: 1,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    borderBottomWidth: 2,
    borderBottomColor: BankingColors.primary,
    paddingVertical: Platform.OS === "ios" ? 6 : 2,
    paddingHorizontal: 4 },
  editActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BankingColors.background,
    justifyContent: "center",
    alignItems: "center" },
  actionsRow: {
    flexDirection: "row",
    gap: 8 },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center" },
  editButton: {
    backgroundColor: BankingColors.primary },
  confirmEditButton: {
    backgroundColor: BankingColors.success },
  cancelEditButton: {
    backgroundColor: BankingColors.error },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === "ios" ? 34 : Spacing.xl,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: BankingColors.border,
    ...Shadow.lg,
    gap: Spacing.md },
  resetButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg },
  resetText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    color: BankingColors.textSecondary },
  disabledText: {
    color: BankingColors.disabled },
  confirmButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.lg,
    ...Shadow.button },
  confirmButtonDisabled: {
    backgroundColor: BankingColors.disabled },
  confirmText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: "#FFFFFF" } });
