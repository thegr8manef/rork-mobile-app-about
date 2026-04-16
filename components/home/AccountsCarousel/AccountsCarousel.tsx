import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState } from "react";
import {
  View,
  FlatList,
  StyleSheet,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent } from "react-native";
import { router } from "expo-router";
import axios from "axios";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  interpolate,
  interpolateColor,
  withSpring,
  Extrapolate,
  type SharedValue } from "react-native-reanimated";

import { BankingColors, Spacing, FontSize, FontFamily, BorderRadius, Shadow, AvatarSize } from "@/constants";
import AccountCard from "@/components/AccountCard";
import AccountSkeleton from "@/components/AccountSkeleton";
import { verticalScale } from "react-native-size-matters";
import { useCustomerAccounts } from "@/hooks/use-accounts-api";
import AccountErrorCard from "./Accounterrorcard";
import { Inbox } from "lucide-react-native";
import TText from "@/components/TText";
import { TouchableOpacity } from "react-native";
import { height } from "@/utils/scale";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;

type Props = {
  showBalance: boolean;
  onToggleBalance: () => void;
  onAccountChange?: (accountId: string | null) => void;
  setAccountCount: (count: number | null) => void;
  onError?: (hasError: boolean) => void;
};

const PaginationDot = ({
  index,
  scrollX }: {
  index: number;
  scrollX: SharedValue<number>;
}) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * CARD_WIDTH,
      index * CARD_WIDTH,
      (index + 1) * CARD_WIDTH,
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

    const backgroundColor = interpolateColor(
      scrollX.value,
      inputRange,
      [
        BankingColors.textLight,
        BankingColors.primary,
        BankingColors.textLight,
      ],
    );

    return {
      width: withSpring(dotWidth, { damping: 15, stiffness: 100 }),
      opacity: withSpring(opacity, { damping: 15, stiffness: 100 }),
      backgroundColor };
  });

  return <Animated.View style={[styles.paginationDot, animatedDotStyle]} />;
};

function PaginationSkeleton() {
  return (
    <View style={styles.pagination} pointerEvents="none">
      <View style={[styles.paginationDot, styles.skeletonDot]} />
      <View style={[styles.paginationDot, styles.skeletonDotSmall]} />
    </View>
  );
}

export default function AccountsCarousel({
  showBalance,
  onToggleBalance,
  onAccountChange,
  setAccountCount,
  onError }: Props) {
  const {
    data: accountsResponse,
    isLoading,
    error,
    isError,
    isFetching,
    refetch } = useCustomerAccounts();


  const retryCountRef = useRef(0);
  const hasRedirectedRef = useRef(false);

  const isServerError =
    axios.isAxiosError(error) && (error.response?.status ?? 0) >= 500;

  useEffect(() => {
    if (!isError || !error || hasRedirectedRef.current) return;


    if (axios.isAxiosError(error) && error.response?.status === 500) {
      hasRedirectedRef.current = true;
      router.replace("/(system)/maintenance");
    }
  }, [isError, error]);

  useEffect(() => {
    if (accountsResponse?.data && !error) {
      retryCountRef.current = 0;
      hasRedirectedRef.current = false;
    }
  }, [accountsResponse?.data, error]);

  const handleRetry = useCallback(() => {
    retryCountRef.current += 1;

    if (retryCountRef.current > 1) {
      router.replace("/(system)/maintenance");
      return;
    }

    refetch();
  }, [refetch]);

  const accounts = useMemo(() => {
    const list = accountsResponse?.data || [];
    return [...list].sort((a, b) => a.displayIndex - b.displayIndex);
  }, [accountsResponse?.data]);

  const flatListRef = useRef<FlatList>(null);
  const [currentAccountIndex, setCurrentAccountIndex] = useState(0);
  const currentAccountIndexRef = useRef(0);
  const scrollX = useSharedValue(0);

  useEffect(() => {
    const hasError = !!error && !isLoading && !isFetching;
    onError?.(hasError);
  }, [error, isLoading, isFetching, onError]);

  useEffect(() => {
    if (accounts.length > 0) {
      const firstId = accounts[0]?.id ?? null;
      onAccountChange?.(firstId);
      setCurrentAccountIndex(0);
      setAccountCount(accounts.length);
    } else {
      onAccountChange?.(null);
      setCurrentAccountIndex(0);
      setAccountCount(accountsResponse?.data?.length ?? null);
    }
  }, [accounts, accountsResponse?.data?.length, onAccountChange, setAccountCount]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      scrollX.value = offsetX;

      const index = Math.round(offsetX / CARD_WIDTH);

      if (
        index !== currentAccountIndexRef.current &&
        index >= 0 &&
        index < accounts.length
      ) {
        currentAccountIndexRef.current = index;
        setCurrentAccountIndex(index);
        onAccountChange?.(accounts[index]?.id ?? null);
      }
    },
    [accounts, onAccountChange, scrollX],
  );

  if (error && !isLoading && !isFetching && !isServerError) {
    return (
      <View style={styles.section}>
        <View style={{ width: CARD_WIDTH, alignSelf: "center" }}>
          <AccountErrorCard onRetry={handleRetry} />
        </View>
      </View>
    );
  }

  if (isLoading || isFetching) {
    return (
      <View style={styles.section}>
        <View style={{ width: CARD_WIDTH, alignSelf: "center" }}>
          <AccountSkeleton />
        </View>
        <PaginationSkeleton />
      </View>
    );
  }

  if (accounts.length === 0) {
    return (
      <View style={styles.section}>
        <View style={{ width: CARD_WIDTH, alignSelf: "center" }}>
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Inbox size={AvatarSize.md} color={BankingColors.textLight} strokeWidth={1.5} />
            </View>
            <TText tKey="accounts.noAccountTitle" style={styles.emptyTitle} />
            <TText tKey="accounts.noAccountDesc" style={styles.emptyDesc} />
            <TouchableOpacity onPress={() => refetch()} style={styles.emptyBtn} activeOpacity={0.8}>
              <TText tKey="common.retry" style={styles.emptyBtnText} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <FlatList
        ref={flatListRef}
        data={accounts}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        snapToInterval={CARD_WIDTH}
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContent}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={{ width: CARD_WIDTH }}>
            <AccountCard
              account={item}
              showBalance={showBalance}
              onToggleBalance={onToggleBalance}
              onPress={() =>
                router.navigate({
                  pathname: "/(root)/(tabs)/(home)/account-details",
                  params: {
                    accountId: item.id,
                    currentAccountIndex: index.toString() } })
              }
            />
          </View>
        )}
      />

      {accounts.length > 1 && (
        <View style={styles.pagination}>
          {accounts.map((_, index) => (
            <PaginationDot key={index} index={index} scrollX={scrollX} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: verticalScale(Spacing.md),
    paddingTop: verticalScale(Spacing.md) },
  carouselContent: {
    paddingHorizontal: 0 },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.lg,
    gap: Spacing.sm },
  paginationDot: {
    height: Spacing.md,
    minWidth: Spacing.md,
    borderRadius: Spacing.sm },
  skeletonDot: {
    width: Spacing.xxl,
    backgroundColor: BankingColors.surfaceSecondary },
  skeletonDotSmall: {
    width: Spacing.sm,
    backgroundColor: BankingColors.surfaceSecondary,
    opacity: 0.5 },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.lg,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: BankingColors.borderNeutral,
    ...Shadow.card,
    minHeight: height / 6 },
  emptyIconCircle: {
    width: AvatarSize.xl,
    height: AvatarSize.xl,
    borderRadius: AvatarSize.xl / 2,
    backgroundColor: BankingColors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg },
  emptyTitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center" },
  emptyDesc: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: Spacing.xl },
  emptyBtn: {
    backgroundColor: BankingColors.primary,
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    ...Shadow.sm,
    minWidth: 200,
    alignItems: "center" },
  emptyBtnText: {
    color: BankingColors.surface,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold } });