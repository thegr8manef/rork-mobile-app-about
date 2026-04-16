import React, { useRef, useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Animated,
  ImageBackground } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Sparkles } from "lucide-react-native";
import { BankingColors } from "@/constants/banking-colors";
import { Spacing } from "@/constants/spacing";
import { BorderRadius, IconSize } from "@/constants/sizes";
import { FontSize, FontFamily } from "@/constants/typography";
import TText from "@/components/TText";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const HORIZONTAL_PADDING = 24;
const STORY_WIDTH = SCREEN_WIDTH - (HORIZONTAL_PADDING * 2);
const STORY_HEIGHT = 220;

interface WelcomeStory {
  id: string;
  titleKey: string;
  descriptionKey: string;
  imageUri: string;
  isNew?: boolean;
}

const welcomeStories: WelcomeStory[] = [
  {
    id: "1",
    titleKey: "loginStories.security.title",
    descriptionKey: "loginStories.security.description",
    imageUri: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&h=500&fit=crop",
    isNew: true },
  {
    id: "2",
    titleKey: "loginStories.transfers.title",
    descriptionKey: "loginStories.transfers.description",
    imageUri: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=800&h=500&fit=crop" },
  {
    id: "3",
    titleKey: "loginStories.support.title",
    descriptionKey: "loginStories.support.description",
    imageUri: "https://images.unsplash.com/photo-1556740758-90de374c12ad?w=800&h=500&fit=crop" },
  {
    id: "4",
    titleKey: "loginStories.savings.title",
    descriptionKey: "loginStories.savings.description",
    imageUri: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=500&fit=crop",
    isNew: true },
];

const AUTO_SCROLL_INTERVAL = 4000;

export default function LoginWelcomeStories() {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % welcomeStories.length;
      setActiveIndex(nextIndex);
      flatListRef.current?.scrollToOffset({
        offset: nextIndex * STORY_WIDTH,
        animated: true });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [activeIndex]);

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const handleMomentumScrollEnd = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / STORY_WIDTH);
    setActiveIndex(index);
  };

  const renderStory = ({ item }: { item: WelcomeStory }) => {
    return (
      <TouchableOpacity activeOpacity={0.95} style={styles.storyCard}>
        <ImageBackground
          source={{ uri: item.imageUri }}
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.85)"]}
            locations={[0, 0.5, 1]}
            style={styles.storyGradient}
          >
            {item.isNew && (
              <View style={styles.newBadge}>
                <Sparkles size={IconSize.xs} color={BankingColors.white} fill={BankingColors.white} />
                <TText style={styles.newBadgeText} tKey="common.new" />
              </View>
            )}
            
            <View style={styles.storyContent}>
              <TText tKey={item.titleKey} style={styles.storyTitle} />
              <TText tKey={item.descriptionKey} style={styles.storyDescription} numberOfLines={2} />
            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={welcomeStories}
        renderItem={renderStory}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        scrollEventThrottle={16}
        snapToInterval={STORY_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.flatListContent}
        getItemLayout={(_, index) => ({
          length: STORY_WIDTH,
          offset: STORY_WIDTH * index,
          index })}
      />
      
      <View style={styles.pagination}>
        {welcomeStories.map((_, index) => {
          const inputRange = [
            (index - 1) * STORY_WIDTH,
            index * STORY_WIDTH,
            (index + 1) * STORY_WIDTH,
          ];
          
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [8, 24, 8],
            extrapolate: "clamp" });
          
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.4, 1, 0.4],
            extrapolate: "clamp" });
          
          return (
            <Animated.View
              key={index}
              style={[
                styles.paginationDot,
                {
                  width: dotWidth,
                  opacity,
                  backgroundColor: index === activeIndex ? BankingColors.primary : BankingColors.textSecondary },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl },
  flatListContent: {
    paddingHorizontal: HORIZONTAL_PADDING },
  storyCard: {
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12 },
  imageBackground: {
    width: "100%",
    height: "100%" },
  image: {
    borderRadius: BorderRadius.xl },
  storyGradient: {
    flex: 1,
    padding: Spacing.lg,
    justifyContent: "space-between" },
  newBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.accentPink + "E6",
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    alignSelf: "flex-start",
    gap: Spacing.xs },
  newBadgeText: {
    color: BankingColors.white,
    fontSize: FontSize.xs,
    fontFamily: FontFamily.bold },
  storyContent: {
    gap: Spacing.sm },
  storyTitle: {
    fontSize: FontSize.lg,
    fontFamily: FontFamily.bold,
    color: BankingColors.white,
    lineHeight: FontSize.lg * 1.3 },
  storyDescription: {
    fontSize: FontSize.sm,
    color: "rgba(255,255,255,0.9)",
    lineHeight: FontSize.sm * 1.5 },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.xs },
  paginationDot: {
    height: 8,
    borderRadius: 4 } });
