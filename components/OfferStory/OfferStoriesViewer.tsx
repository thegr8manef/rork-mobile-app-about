// components/OfferStoriesViewer.tsx
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  X,
  Volume2,
  VolumeX,
  Sparkles,
  ExternalLink,
} from "lucide-react-native";
import { useRouter } from "expo-router";

import { BankingColors, FontSize, FontFamily } from "@/constants";
import TText from "@/components/TText";
import type { OfferPromotion } from "@/types/banking";

const { width: W, height: H } = Dimensions.get("window");
const CLOSE_DY = 140;
const POLL_MS = 250;

type Props = {
  visible: boolean;
  offers: OfferPromotion[];
  initialIndex?: number;
  onClose: () => void;
  durationMs?: number; // image story duration
};

function clamp01(x: number) {
  return Math.max(0, Math.min(1, x));
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function StoryProgressBar({
  count,
  activeIndex,
  progress,
}: {
  count: number;
  activeIndex: number;
  progress: number[];
}) {
  return (
    <View style={styles.progressRow}>
      {Array.from({ length: count }).map((_, i) => {
        const p =
          i < activeIndex ? 1 : i === activeIndex ? (progress[i] ?? 0) : 0;
        return (
          <View key={i} style={styles.progressTrack}>
            <View
              style={[styles.progressFill, { width: `${clamp01(p) * 100}%` }]}
            />
          </View>
        );
      })}
    </View>
  );
}

function StorySlide({
  offer,
  active,
  muted,
  imageDurationMs,
  onProgress,
  onDone,
}: {
  offer: OfferPromotion;
  active: boolean;
  muted: boolean;
  imageDurationMs: number;
  onProgress: (p: number) => void;
  onDone: () => void;
}) {
  const isVideo = !!offer.videoUri;

  const onProgressRef = useLatest(onProgress);
  const onDoneRef = useLatest(onDone);

  // IMAGE TIMER
  useEffect(() => {
    if (!active) return;
    if (isVideo) return;

    let raf = 0;
    const start = Date.now();

    const tick = () => {
      const elapsed = Date.now() - start;
      const p = clamp01(elapsed / Math.max(200, imageDurationMs));
      onProgressRef.current(p);

      if (p >= 1) {
        onDoneRef.current();
        return;
      }
      raf = requestAnimationFrame(tick);
    };

    onProgressRef.current(0);
    raf = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(raf);
  }, [active, isVideo, imageDurationMs, offer.id, onProgressRef, onDoneRef]);

  // VIDEO (expo-video) — direct mp4/m3u8 only
  const player = useVideoPlayer(offer.videoUri ?? null, (p) => {
    p.loop = false;
    (p as any).muted = muted;
  });

  // Keep muted synced
  useEffect(() => {
    if (!player) return;
    (player as any).muted = muted;
  }, [player, muted]);

  // Autoplay when active + reset when leaving (so it replays next time)
  useEffect(() => {
    if (!player) return;
    if (!isVideo) return;

    if (active) {
      player.play();
    } else {
      // Leaving this story: pause + rewind to start
      player.pause();

      // Try common APIs safely (expo-video versions differ)
      if ((player as any).seekTo) {
        try {
          (player as any).seekTo(0);
        } catch {}
      } else if ((player as any).setPositionAsync) {
        try {
          (player as any).setPositionAsync(0);
        } catch {}
      } else {
        try {
          (player as any).currentTime = 0;
        } catch {}
      }

      // Reset the progress bar for this story
      onProgressRef.current(0);
    }
  }, [player, active, isVideo, onProgressRef]);

  // Poll progress (truth source)
  useEffect(() => {
    if (!player) return;
    if (!active) return;
    if (!isVideo) return;

    onProgressRef.current(0);

    const timerId = setInterval(() => {
      const ct = Number((player as any).currentTime ?? 0);
      const dur = Number((player as any).duration ?? 0);

      if (dur > 0) {
        const p = clamp01(ct / dur);
        onProgressRef.current(p);

        if (ct >= dur - 0.12) {
          onDoneRef.current();
        }
      }
    }, POLL_MS);

    return () => clearInterval(timerId);
  }, [player, active, isVideo, offer.id, onProgressRef, onDoneRef]);

  // ✅ STORY LOOK: full-screen cover
  if (!isVideo) {
    return (
      <View style={styles.media}>
        <View style={styles.centerFrame}>
          <Image
            source={offer.imageUri}
            style={styles.mediaContain}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.media}>
      <VideoView
        style={StyleSheet.absoluteFill}
        player={player}
        contentFit="contain"
        nativeControls={false}
      />
    </View>
  );
}

export default function OfferStoriesViewer({
  visible,
  offers,
  initialIndex = 0,
  onClose,
  durationMs = 4500,
}: Props) {
  const insets = useSafeAreaInsets();
  const router = useRouter(); // ✅ Added
  const count = offers.length;

  const [mounted, setMounted] = useState(visible);
  const [index, setIndex] = useState(
    Math.max(0, Math.min(initialIndex, Math.max(0, count - 1))),
  );
  const [muted, setMuted] = useState(true);

  const [progress, setProgress] = useState<number[]>(() =>
    offers.map((_, i) => (i < initialIndex ? 1 : 0)),
  );

  const listRef = useRef<FlatList<OfferPromotion>>(null);
  const translateY = useRef(new Animated.Value(H)).current;

  const overlayOpacity = translateY.interpolate({
    inputRange: [0, H * 0.7],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const open = useCallback(() => {
    translateY.setValue(H);
    Animated.timing(translateY, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const close = useCallback(
    (after?: () => void) => {
      Animated.timing(translateY, {
        toValue: H,
        duration: 160,
        useNativeDriver: true,
      }).start(({ finished }) => finished && after?.());
    },
    [translateY],
  );

  useEffect(() => {
    if (visible) {
      setMounted(true);
      const safeIndex = Math.max(0, Math.min(initialIndex, offers.length - 1));
      setIndex(safeIndex);
      setMuted(true);
      setProgress(offers.map((_, i) => (i < safeIndex ? 1 : 0)));
      open();

      requestAnimationFrame(() => {
        listRef.current?.scrollToIndex({ index: safeIndex, animated: false });
      });
    } else if (mounted) {
      close(() => setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const goTo = useCallback(
    (nextIndex: number) => {
      if (count === 0) return;

      const i = Math.max(0, Math.min(nextIndex, count - 1));
      setIndex(i);
      setMuted(true);

      setProgress(() =>
        offers.map((_, idx) => (idx < i ? 1 : idx === i ? 0 : 0)),
      );

      listRef.current?.scrollToIndex({ index: i, animated: true });
    },
    [count, offers],
  );

  const goNext = useCallback(() => {
    if (index >= count - 1) {
      close(() => onClose());
      return;
    }
    goTo(index + 1);
  }, [index, count, close, onClose, goTo]);

  const goPrev = useCallback(() => {
    if (index <= 0) return;
    goTo(index - 1);
  }, [index, goTo]);

  // ✅ Added
  const handleOpenWeb = useCallback(() => {
    if (!current?.webUrl) return;
    close(() => {
      onClose();
      router.push({
        pathname: "/webview",
        params: { url: current.webUrl, windowName: current.webTitle },
      });
    });
  }, [current, close, onClose, router]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;

  const onViewableItemsChanged = useRef(
    ({
      viewableItems,
    }: {
      viewableItems: Array<{ index?: number | null }>;
    }) => {
      const v = viewableItems?.[0];
      if (v?.index == null) return;
      if (v.index !== index) goTo(v.index);
    },
  ).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => {
          const dy = Math.abs(g.dy);
          const dx = Math.abs(g.dx);
          return dy > 6 && dy > dx * 1.2;
        },
        onPanResponderMove: (_, g) => translateY.setValue(Math.max(0, g.dy)),
        onPanResponderRelease: (_, g) => {
          const shouldClose = g.dy > CLOSE_DY || g.vy > 0.9;
          if (shouldClose) {
            close(() => onClose());
          } else {
            Animated.spring(translateY, {
              toValue: 0,
              useNativeDriver: true,
              speed: 28,
              bounciness: 0,
              overshootClamping: true,
            }).start();
          }
        },
      }),
    [close, onClose, translateY],
  );

  const onProgress = useCallback(
    (p: number) => {
      setProgress((prev) => {
        const next = [...prev];
        next[index] = clamp01(p);
        return next;
      });
    },
    [index],
  );

  const renderItem = useCallback(
    ({ item, index: itemIndex }: { item: OfferPromotion; index: number }) => {
      const active = itemIndex === index;
      return (
        <View style={{ width: W, height: H }}>
          <StorySlide
            offer={item}
            active={active}
            muted={muted}
            imageDurationMs={durationMs}
            onProgress={(p) => active && onProgress(p)}
            onDone={() => active && goNext()}
          />
        </View>
      );
    },
    [index, muted, durationMs, onProgress, goNext],
  );

  const current =
    index >= 0 && index < offers.length ? offers[index] : undefined;

  if (!mounted) return null;

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={() => close(() => onClose())}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />

      <Animated.View
        style={[styles.sheet, { transform: [{ translateY }] }]}
        {...panResponder.panHandlers}
      >
        <FlatList
          ref={listRef}
          data={offers}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(o) => o.id}
          renderItem={renderItem}
          viewabilityConfig={viewabilityConfig}
          onViewableItemsChanged={onViewableItemsChanged}
          onMomentumScrollEnd={(e) => {
            const nextIndex = Math.round(e.nativeEvent.contentOffset.x / W);
            if (nextIndex !== index) goTo(nextIndex);
          }}
          getItemLayout={(_, i) => ({ length: W, offset: W * i, index: i })}
          directionalLockEnabled
        />

        <View pointerEvents="box-none" style={styles.tapZones}>
          <Pressable style={styles.tapLeft} onPress={goPrev} />
          <Pressable style={styles.tapRight} onPress={goNext} />
        </View>

        <LinearGradient
          colors={["rgba(0,0,0,0.55)", "transparent"]}
          style={[styles.topBar, { paddingTop: insets.top + 10 }]}
          pointerEvents="auto"
        >
          <StoryProgressBar
            count={count}
            activeIndex={index}
            progress={progress}
          />

          <View style={styles.topRow}>
            {current?.isNew ? (
              <View style={styles.newBadge}>
                <Sparkles size={14} color="#fff" fill="#fff" />
                <TText style={styles.newBadgeText} tKey="common.new" />
              </View>
            ) : (
              <View />
            )}

            <View style={styles.topActions}>
              {current?.videoUri ? (
                <Pressable
                  onPress={() => setMuted((m) => !m)}
                  style={styles.iconBtn}
                  hitSlop={10}
                >
                  {muted ? (
                    <VolumeX size={20} color="#fff" />
                  ) : (
                    <Volume2 size={20} color="#fff" />
                  )}
                </Pressable>
              ) : null}

              {/* ✅ Added: ExternalLink button, only if webUrl exists */}
              {current?.webUrl ? (
                <Pressable
                  onPress={handleOpenWeb}
                  style={styles.iconBtn}
                  hitSlop={10}
                >
                  <ExternalLink size={20} color="#fff" />
                </Pressable>
              ) : null}

              <Pressable
                onPress={() => close(() => onClose())}
                style={styles.iconBtn}
                hitSlop={10}
              >
                <X size={20} color="#fff" />
              </Pressable>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000" },
  sheet: { flex: 1, backgroundColor: "#000" },
  media: { flex: 1, backgroundColor: "#000" },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    zIndex: 20,
    elevation: 20,
  },

  progressRow: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressTrack: {
    flex: 1,
    height: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.35)",
    overflow: "hidden",
  },
  progressFill: {
    height: 3,
    borderRadius: 999,
    backgroundColor: "#fff",
  },

  topRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topActions: { flexDirection: "row", gap: 10, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },

  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: BankingColors.accentPink + "E6",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  newBadgeText: {
    color: "#fff",
    fontSize: FontSize.sm,
    fontFamily: FontFamily.bold,
  },

  tapZones: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 5,
    elevation: 5,
  },
  tapLeft: { flex: 1 },
  tapRight: { flex: 1 },

  centerFrame: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Fills available space but stays centered and keeps aspect ratio (contain)
  mediaContain: {
    width: "100%",
    height: "100%",
  },
});
