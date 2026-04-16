import React, { useRef, useState } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ViewToken,
  Linking,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  interpolate,
  interpolateColor,
  withSpring,
  Extrapolate,
  type SharedValue,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { FontFamily, FontSize } from "@/constants";
import TText from "@/components/TText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface OnboardingStoriesProps {
  onComplete: () => void;
}

const SLIDES = [
  {
    id: "1",
    image: require("@/assets/onboardingStory/1.png"),
    titleKey: "onboarding.slide1.title",
    descKey: "onboarding.slide1.description",
  },
  {
    id: "2",
    image: require("@/assets/onboardingStory/2.png"),
    titleKey: "onboarding.slide2.title",
    descKey: "onboarding.slide2.description",
  },
  {
    id: "3",
    image: require("@/assets/onboardingStory/3.png"),
    titleKey: "onboarding.slide3.title",
    descKey: "onboarding.slide3.description",
  },
  {
    id: "4",
    image: require("@/assets/onboardingStory/4.png"),
    titleKey: "onboarding.slide4.title",
    descKey: "onboarding.slide4.description",
  },
] as const;

// Defined outside component to prevent re-mounting on parent re-renders
const PaginationDot = ({
  index,
  scrollX,
}: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [Spacing.sm, Spacing.xxl, Spacing.sm],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP,
    );

    const backgroundColor = interpolateColor(scrollX.value, inputRange, [
      BankingColors.textLight,
      BankingColors.primary,
      BankingColors.textLight,
    ]);

    return {
      width: withSpring(dotWidth, { damping: 15, stiffness: 100 }),
      opacity: withSpring(opacity, { damping: 15, stiffness: 100 }),
      backgroundColor,
    };
  });

  return <Animated.View style={[styles.paginationDot, animatedDotStyle]} />;
};

const SlideItem = ({
  item,
  index,
  scrollX,
}: {
  item: (typeof SLIDES)[number];
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedImageStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];

    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.82, 1, 0.82],
      Extrapolate.CLAMP,
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolate.CLAMP,
    );

    return { transform: [{ scale }], opacity };
  });

  return (
    <View style={styles.slide}>
      <Animated.View style={[styles.circleContainer, animatedImageStyle]}>
       
        <Image
          source={item.image}
          resizeMode="contain"
          style={styles.slideImage}
        />
      </Animated.View>
      <TText tKey={item.titleKey} style={styles.slideTitle} />
      <TText tKey={item.descKey} style={styles.slideDesc} />
    </View>
  );
};

export default function OnboardingStories({
  onComplete,
}: OnboardingStoriesProps) {
  const scrollX = useSharedValue(0);
  const flatListRef = useRef<any>(null);
  const currentIndexRef = useRef(0);
  const [currentIndex, setCurrentIndex] = useState(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const idx = viewableItems[0].index ?? 0;
        setCurrentIndex(idx);
        currentIndexRef.current = idx;
      }
    },
  ).current;

  const handleNext = () => {
    const nextIndex = currentIndexRef.current + 1;
    if (nextIndex < SLIDES.length) {
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <StatusBar
        backgroundColor={BankingColors.white}
        barStyle="dark-content"
        translucent={false}
      />
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("@/assets/images/newlogo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
      {/* Slides */}
      <Animated.FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        viewabilityConfig={viewabilityConfig}
        onViewableItemsChanged={onViewableItemsChanged}
        style={{ flex: 1 }}
        renderItem={({ item, index }) => (
          <SlideItem item={item} index={index} scrollX={scrollX} />
        )}
      />
      {/* Pagination dots — same style as cartes carousel */}
      <View style={styles.pagination}>
        {SLIDES.map((_, index) => (
          <PaginationDot key={index} index={index} scrollX={scrollX} />
        ))}
      </View>
      {/* Footer */}
      {isLastSlide ? (
        <View style={styles.lastSlideFooter}>
          <TouchableOpacity style={styles.connectButton} onPress={onComplete}>
            <TText tKey="onboarding.connect" style={styles.connectText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.callButton} onPress={() => Linking.openURL("tel:71111334")}>
            <TText tKey="onboarding.call" style={styles.callText} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.footer}>
          <TouchableOpacity onPress={onComplete} style={styles.skipButton}>
            <TText tKey="onboarding.skip" style={styles.skipText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <TText tKey="onboarding.next" style={styles.nextText} />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BankingColors.white,
  },
  logoContainer: {
    alignItems: "center",
  },
  logo: {
    width: "90%",
    height: 150,
    marginTop: -10,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
  },
  circleContainer: {
    width: SCREEN_WIDTH * 0.72,
    height: SCREEN_WIDTH * 0.72,
    alignItems: "center",
    justifyContent: "center",
    // marginBottom: Spacing.xxxl,
  },
  circleBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: SCREEN_WIDTH * 0.36,
    backgroundColor: "#EFEFEF",
  },
  slideImage: {
    width: "80%",
    height: "80%",
  },
  slideTitle: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.black,
    textAlign: "center",
    // marginBottom: Spacing.lg,
    lineHeight: 32,
  },
  slideDesc: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.onbordingLabel,
    textAlign: "center",
  },
  // Pagination — identical pattern to cartes carousel
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm,
  },
  paginationDot: {
    height: Spacing.md,
    minWidth: Spacing.md,
    borderRadius: Spacing.sm,
  },
  // Footer — normal slides
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  skipButton: {
    padding: Spacing.sm,
  },
  nextButton: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.huge,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    minWidth: 140,
    alignItems: "center",
  },
  // Footer — last slide
  lastSlideFooter: {
    paddingHorizontal: Spacing.xxl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },
  connectButton: {
    backgroundColor: BankingColors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  connectText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    textAlign: "center",
  },
  callButton: {
    borderWidth: 1.5,
    borderColor: BankingColors.backgroundGray,
    paddingVertical: Spacing.lg,
    borderRadius: 12,
    alignItems: "center",
  },
  callText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.onbordingLabel,
    textAlign: "center",
  },
  skipText: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.extrabold,
    color: BankingColors.black,
  },
  nextText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.white,
    textAlign: "center",
  },
});
