import React, { useMemo, useRef, useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Pressable,
  Easing,
  Platform,
  PanResponder,
  Dimensions,
} from "react-native";
import {
  BankingColors,
  Spacing,
  FontSize,
  FontFamily,
  BorderRadius,
  IconSize,
} from "@/constants";
import { Pencil, X } from "lucide-react-native";
import { router } from "expo-router";
import { useAppPreferencesStore } from "@/store/store";
import TText from "@/components/TText";
import { INITIAL_QUICK_ACTIONS } from "@/constants/quick-action";

interface QuickActionsModalProps {
  visible: boolean;
  onClose: () => void;
}

const ALL_ROUTES: Record<string, string> = {
  send: "/(root)/(tabs)/(home)/send-money",
  schooling: "/(root)/(tabs)/(menu)/schooling",
  beneficiaries: "/(root)/(tabs)/(home)/beneficiaries",
  cards: "/(root)/(tabs)/(cartes)",
  transfers: "/(root)/(tabs)/(home)/transfer-history",
  billers: "/(root)/(tabs)/(factures)",
  edocs: "/(root)/(tabs)/(menu)/edocs",
  loans: "/(root)/(tabs)/(menu)/loans",
  account: "/(root)/(tabs)/(home)",
  cheques: "/(root)/(tabs)/(menu)/cheques",
  placements: "/(root)/(tabs)/(menu)/placements",
  exchange: "/(root)/(tabs)/(menu)/exchange-rates",
  savings: "/(root)/(tabs)/(menu)/saving-plans",
  rib: "/(root)/(tabs)/(home)/account-details",
  card_reload: "/(root)/(tabs)/(cartes)/reload-card",
  bills: "/(root)/(tabs)/(menu)/bills",
};

const MAX_ITEMS = INITIAL_QUICK_ACTIONS.length;

export default function QuickActionsModal({
  visible,
  onClose,
}: QuickActionsModalProps) {
  const enabledQuickActions = useAppPreferencesStore(
    (s) => s.enabledQuickActions,
  );

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef(
    Array.from({ length: MAX_ITEMS }, () => new Animated.Value(0)),
  ).current;

  // Pan/drag state — useNativeDriver:false required, so uses a separate Animated.View
  const panAnim = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const dragScale = useRef(new Animated.Value(1)).current;
  const isDragging = useRef(false);
  const currentOffset = useRef({ x: 0, y: 0 });
  const modalHeightRef = useRef(0);

  const { height: SCREEN_H } = Dimensions.get("window");
  const MODAL_BOTTOM_OFFSET = 130;

  const clampPan = (totalY: number) => {
    const minY = modalHeightRef.current + MODAL_BOTTOM_OFFSET - SCREEN_H;
    const maxY = MODAL_BOTTOM_OFFSET;
    return Math.max(minY, Math.min(maxY, totalY));
  };

  const stopDrag = () => {
    isDragging.current = false;
    panAnim.flattenOffset();
    const currentY = (panAnim.y as any)._value;
    Animated.spring(dragScale, {
      toValue: 1,
      useNativeDriver: false,
      damping: 18,
      stiffness: 200,
    }).start();
    // Snap back to initial position if released below starting point
    if (currentY > 0) {
      Animated.spring(panAnim.y, {
        toValue: 0,
        useNativeDriver: false,
        damping: 18,
        stiffness: 200,
      }).start();
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => true,
      onMoveShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: () => true,
      onPanResponderGrant: () => {
        isDragging.current = true;
        currentOffset.current = {
          x: 0,
          y: (panAnim.y as any)._value,
        };
        panAnim.setOffset(currentOffset.current);
        panAnim.setValue({ x: 0, y: 0 });
        Animated.spring(dragScale, {
          toValue: 1.03,
          useNativeDriver: false,
          damping: 18,
          stiffness: 200,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const totalY = currentOffset.current.y + gestureState.dy;
        const clampedY = clampPan(totalY);
        panAnim.setValue({
          x: 0,
          y: clampedY - currentOffset.current.y,
        });
      },
      onPanResponderRelease: stopDrag,
      onPanResponderTerminate: stopDrag,
    }),
  ).current;

  const [isVisible, setIsVisible] = useState(visible);

  const quickActions = useMemo(() => {
    return INITIAL_QUICK_ACTIONS.filter((a) =>
      enabledQuickActions.includes(a.id),
    ).map((a) => ({ ...a, route: ALL_ROUTES[a.id] }));
  }, [enabledQuickActions]);

  // Group into rows of 2 for equal-width cells
  const actionRows = useMemo(() => {
    const rows: (typeof quickActions)[] = [];
    for (let i = 0; i < quickActions.length; i += 2) {
      rows.push(quickActions.slice(i, i + 2));
    }
    return rows;
  }, [quickActions]);

  useEffect(() => {
    if (visible) {
      setIsVisible(true);
      // Reset pan + drag scale on each open
      panAnim.setValue({ x: 0, y: 0 });
      panAnim.setOffset({ x: 0, y: 0 });
      dragScale.setValue(1);

      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
      rotateAnim.setValue(0);
      contentFade.setValue(0);
      itemAnims.forEach((a) => a.setValue(0));

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          damping: 16,
          stiffness: 140,
          mass: 0.8,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 500,
          easing: Easing.bezier(0.22, 1, 0.36, 1),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(180),
          Animated.timing(contentFade, {
            toValue: 1,
            duration: 280,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(300),
          Animated.stagger(
            60,
            quickActions.map((_, i) =>
              Animated.timing(itemAnims[i], {
                toValue: 1,
                duration: 340,
                easing: Easing.out(Easing.back(1.4)),
                useNativeDriver: true,
              }),
            ),
          ),
        ]),
      ]).start();
    } else {
      Animated.parallel([
        Animated.parallel(
          itemAnims.map((a) =>
            Animated.timing(a, {
              toValue: 0,
              duration: 120,
              easing: Easing.in(Easing.quad),
              useNativeDriver: true,
            }),
          ),
        ),
        Animated.timing(contentFade, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnim, {
          toValue: 0,
          duration: 320,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        setIsVisible(false);
      });
    }
  }, [visible]);

  const rotateX = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["-12deg", "0deg"],
  });

  const perspectiveTransform =
    Platform.OS === "web"
      ? [{ scale: scaleAnim }, { rotateX }]
      : ([
          { perspective: 1200 as unknown as string } as any,
          { scale: scaleAnim },
          { rotateX },
        ] as any);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
      </Pressable>

      {/* Outer wrapper: handles drag translation + scale feedback (useNativeDriver: false) */}
      <Animated.View
        onLayout={(e) => { modalHeightRef.current = e.nativeEvent.layout.height; }}
        style={[
          styles.modalWrapper,
          {
            transform: [
              ...panAnim.getTranslateTransform(),
              { scale: dragScale },
            ],
          },
        ]}
      >
        {/* Inner wrapper: handles entrance animation (useNativeDriver: true) */}
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: perspectiveTransform,
            },
          ]}
        >
          {/* Drag handle — pan gestures start here; large touch area */}
          <View style={styles.handleArea} {...panResponder.panHandlers}>
            <View style={styles.handle} />
          </View>

          <Animated.View style={{ opacity: contentFade }}>
            <View style={styles.header}>
              <TText tKey="qa_title" style={styles.title} />

              <View style={styles.headerActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => {
                    onClose();
                    router.navigate("/quick-actions-config");
                  }}
                  activeOpacity={0.7}
                >
                  <Pencil
                    size={IconSize.md}
                    color={BankingColors.textSecondary}
                  />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <X size={IconSize.lg} color={BankingColors.text} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Grid: rows of 2, flex:1 on each cell = always equal widths */}
            <View style={styles.actionsGrid}>
              {actionRows.map((row, rowIndex) => (
                <View key={rowIndex} style={styles.actionRow}>
                  {row.map((action, colIndex) => {
                    const globalIndex = rowIndex * 2 + colIndex;
                    const itemAnim = itemAnims[globalIndex];
                    const translateY = itemAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [24, 0],
                    });
                    const itemScale = itemAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    });

                    return (
                      <Animated.View
                        key={action.id}
                        style={[
                          styles.actionCell,
                          {
                            opacity: itemAnim,
                            transform: [
                              { translateY },
                              { scale: itemScale },
                            ],
                          },
                        ]}
                      >
                        <TouchableOpacity
                          style={styles.actionItem}
                          onPress={() => {
                            onClose();
                            router.navigate(action.route as any);
                          }}
                          activeOpacity={0.7}
                        >
                          <View
                            style={[
                              styles.iconContainer,
                              { backgroundColor: action.bg },
                            ]}
                          >
                            <action.icon
                              size={IconSize.xl}
                              color={action.color}
                            />
                          </View>
                          <TText
                            tKey={action.titleKey}
                            style={styles.actionTitle}
                          />
                        </TouchableOpacity>
                      </Animated.View>
                    );
                  })}
                  {/* Spacer so odd-count last row doesn't stretch */}
                  {row.length === 1 && (
                    <View style={styles.actionCellPlaceholder} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1 },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BankingColors.overlay,
  },
  // Outer wrapper positions the modal; pan transform applied here
  modalWrapper: {
    position: "absolute",
    bottom: 130,
    left: Spacing.lg,
    right: Spacing.lg,
  },
  modalContainer: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxl,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 24,
  },
  // Large touch area — makes dragging from the pill easy
  handleArea: {
    alignItems: "center",
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: BankingColors.borderMedium ?? BankingColors.border,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconButton: {
    width: IconSize.xxxl,
    height: IconSize.xxxl,
    borderRadius: IconSize.xxxl / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  // Grid: column gap via gap on each row, row gap on the grid container
  actionsGrid: {
    gap: Spacing.md,
  },
  actionRow: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  // flex:1 guarantees equal widths regardless of screen size
  actionCell: {
    flex: 1,
  },
  actionCellPlaceholder: {
    flex: 1,
  },
  actionItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.md,
    backgroundColor: BankingColors.background,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: BankingColors.border,
  },
  iconContainer: {
    width: IconSize.huge,
    height: IconSize.huge,
    borderRadius: IconSize.huge / 2,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  actionTitle: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    textAlign: "center",
  },
});
