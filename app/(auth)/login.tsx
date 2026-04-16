import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Animated,
  Dimensions,
  Platform,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Linking,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { useTranslation } from "react-i18next";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import FlashMessage from "react-native-flash-message";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useHaptic } from "@/utils/useHaptic";
import useShowMessage from "@/hooks/useShowMessage";
import { useAuth } from "@/hooks/auth-store";
import { loginApi } from "@/services/auth.api";
import { loginSchema } from "@/validation/loginScheme";
import type { z } from "zod";
import {
  ApiLoginError,
  LoginResponse,
  LoginCompleteResponse,
} from "@/types/auth.type";
import QuickLoginView from "@/components/auth/QuickLoginView";
import TraditionalLoginView from "@/components/auth/TraditionalLoginView";
import { BankingColors } from "@/constants";
import { queryClient } from "@/queryClient";
import { useProfile } from "@/hooks/use-accounts-api";
import { useIsFocused } from "@react-navigation/native";
import { BASE_URL } from "@/constants/base-url";
import { getFcmToken } from "@/notification/fcm";
import { usePatchFcmToken } from "@/hooks/use-accounts-api";

type LoginFormValues = z.infer<typeof loginSchema>;

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function LoginScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const focused = useIsFocused();
  const { t } = useTranslation();
  const { showMessageError } = useShowMessage();
  const insets = useSafeAreaInsets();

  const {
    triggerSuccessHaptic,
    triggerErrorHaptic,
    triggerMediumHaptic,
    triggerLightHaptic,
  } = useHaptic();

  const {
    deviceId,
    biometricType,
    savePendingCredentials,
    isLoading,
    authState,
    completeLogin,
    loginWithBiometric,
    setQuickLoginName,
    setDeviceOwnership,
    setPreferredLoginMethod,
  } = useAuth();
  console.log("🚀 ~ LoginScreen ~ deviceId:", deviceId);
  const patchFcmToken = usePatchFcmToken();
  const [showPassword, setShowPassword] = useState(false);
  const [localAuthLoading, setLocalAuthLoading] = useState(false);
  const [showTraditionalLogin, setShowTraditionalLogin] = useState(false);

  // ✅ NEW: prevent auto-redirect when navigating to setup screens
  const isNavigatingToSetup = useRef(false);

  // ✅ Track if login screen is still mounted (for async handlers)
  const isMountedRef = useRef(true);
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // ✅ profile (might be cleared by queryClient.clear)
  const { data: profile } = useProfile();

  const primaryUser =
    profile?.users?.find(
      (x) =>
        x.defaultUser === "true" ||
        x.defaultUser === "1" ||
        x.defaultUser === "Y",
    ) ?? profile?.users?.[0];

  const USER_FULL_NAME = useMemo(() => {
    const first = (primaryUser?.firstName ?? "").trim();
    const last = (primaryUser?.lastName ?? "").trim();
    const full = `${first} ${last}`.trim();
    return full || "-";
  }, [primaryUser?.firstName, primaryUser?.lastName]);

  // ✅ update zustand ONLY in effect (never in render)
  useEffect(() => {
    // Wrap the block:
    // if (__DEV__) {
    //   console.log("🔍 [name-effect] fired");
    //   console.log("🔍 hasTrustedDevice:", authState.hasTrustedDevice);
    //   console.log("🔍 isDeviceOwnedByCurrentUser:", authState.isDeviceOwnedByCurrentUser);
    //   console.log("🔍 USER_FULL_NAME:", USER_FULL_NAME);
    //   console.log("🔍 quickLoginName:", authState.quickLoginName);
    // }

    if (!setQuickLoginName) return;
    if (!authState.hasTrustedDevice) return;
    if (!authState.isDeviceOwnedByCurrentUser) return;

    if (USER_FULL_NAME !== "-" && USER_FULL_NAME !== authState.quickLoginName) {
      console.log("🔍 ➡️ SAVING name:", USER_FULL_NAME);
      setQuickLoginName(USER_FULL_NAME);
    }
  }, [
    USER_FULL_NAME,
    authState.quickLoginName,
    authState.hasTrustedDevice,
    authState.isDeviceOwnedByCurrentUser,
    setQuickLoginName,
  ]);

  // ✅ use stored name for display (survives queryClient.clear)
  const displayName = authState.quickLoginName ?? "-";

  /**
   * Quick Login gate (PASSKEY based)
   */
  // NEW
  const hasQuickLogin =
    Platform.OS !== "web" &&
    authState.hasTrustedDevice &&
    (authState.hasPasscode || authState.biometricEnabled);

  /**
   * Biometrics available
   */
  const biometricAvailable =
    Platform.OS !== "web" &&
    !!biometricType &&
    authState.hasTrustedDevice &&
    authState.biometricEnabled;

  /**
   * Passcode available
   */
  const passcodeAvailable =
    Platform.OS !== "web" &&
    authState.hasTrustedDevice &&
    authState.hasPasscode;

  // ✅ Animations for quick login
  const floatAnim1 = useRef(new Animated.Value(0)).current;
  const floatAnim2 = useRef(new Animated.Value(0)).current;
  const floatAnim3 = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const startAnimations = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    const loopFloat = (anim: Animated.Value, duration: number) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    };

    loopFloat(floatAnim1, 3000);
    loopFloat(floatAnim2, 4000);
    loopFloat(floatAnim3, 3500);
  };

  useEffect(() => {
    if (hasQuickLogin && !showTraditionalLogin) startAnimations();
  }, [hasQuickLogin, showTraditionalLogin]);

  const float1 = floatAnim1.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const float2 = floatAnim2.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 15],
  });

  const float3 = floatAnim3.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  // ✅ Form
  const {
    control,
    handleSubmit,
    clearErrors,
    formState: { errors, isSubmitting, isValid, isDirty, touchedFields },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
    mode: "onChange",
    reValidateMode: "onChange",
  });

  // ✅ button should be enabled ONLY if schema is valid AND user touched something
  const canSubmit = isValid && isDirty;

  // ✅ KEEP queryClient.clear(), but avoid calling it repeatedly
  const didClearOnce = useRef(false);

  useEffect(() => {
    if (!focused) return;

    if (!didClearOnce.current) {
      didClearOnce.current = true;
      queryClient.clear();
      console.log("✅ queryClient.clear() executed once on focus");
    }

    if (focused && didClearOnce.current) {
      loginMutation.reset();
    }
  }, [focused]);

  useEffect(() => {
    if (!focused) {
      didClearOnce.current = false;
      // ✅ Reset the ref when leaving the screen
      isNavigatingToSetup.current = false;
    }
  }, [focused]);

  // Redirect to home once authenticated — unless we're mid-setup (passcode/biometrics).
  useEffect(() => {
    if (authState.isAuthenticated && !isNavigatingToSetup.current) {
      router.replace("/(root)/(tabs)/(home)");
    }
  }, [authState.isAuthenticated, router]);

  /**
   * ✅ UPDATED: handleLoginSuccess uses isNavigatingToSetup ref
   */
  const handleLoginSuccess = async (
    res: LoginResponse,
    username?: string,
    password?: string,
  ) => {
    if (username && password) {
      await savePendingCredentials(username, password);
    }

    if (res.loginStatus === "MFA_REQUIRED") {
      router.replace({
        pathname: "/(auth)/verifymfa",
        params: { requestId: res.requestId },
      });
      return;
    }

    if (res.loginStatus === "LOGIN_ART_COMPLETE") {
      router.replace({
        pathname: "/(auth)/contact-data-validation",
        params: {
          accessToken: res.token.accessToken,
          refreshToken: res.token.refreshToken,
        },
      });
      return;
    }

    if (res.loginStatus === "CONTACT_DATA_VALIDATION") {
      router.replace({
        pathname: "/(auth)/contact-data-validation",
        params: { transactionId: res.requestId },
      });
      return;
    }

    if (res.loginStatus !== "LOGIN_COMPLETE" || !res.token?.accessToken) {
      console.log("Unhandled loginStatus:", res.loginStatus, res);
      return;
    }

    // ✅ Check device ownership BEFORE completeLogin
    const loginRes = res as LoginCompleteResponse;
    const isDeviceUsedByAnother =
      loginRes.isDeviceUsedByAnotherAccount === true;

    if (isDeviceUsedByAnother) {
      await setDeviceOwnership(false);
      await setPreferredLoginMethod("otp");
    } else {
      await setDeviceOwnership(true);
      await setPreferredLoginMethod("otp");
    }

    // Rediriger vers device-confidence tant que le device n'est pas de confiance
    const needsSetup = !isDeviceUsedByAnother && !authState.hasTrustedDevice;

    // ✅ If needs setup, set the ref BEFORE completeLogin
    if (needsSetup) {
      isNavigatingToSetup.current = true;
    }

    // ✅ NOW complete login
    await completeLogin(
      res.token.accessToken,
      res.token.refreshToken,
      authState.biometricEnabled,
    );

    // ✅ Send FCM token to backend
    try {
      const fcmToken = await getFcmToken();
      console.log("fcmToken:", fcmToken);
      if (fcmToken) {
        patchFcmToken.mutate(fcmToken);
      }
    } catch (e) {
      console.log("⚠️ [FCM] Failed to send token:", e);
    }

    // If another account owns device → done, redirect handles the rest
    if (isDeviceUsedByAnother) {
      return;
    }

    // ✅ Device belongs to current user — safe to save name
    if (USER_FULL_NAME !== "-" && USER_FULL_NAME !== authState.quickLoginName) {
      setQuickLoginName(USER_FULL_NAME);
    }

    // ✅ Navigate to setup if needed
    if (needsSetup) {
      router.navigate("/(auth)/device-confidence");
      return;
    }

    // else: isAuthenticated effect will redirect to home
  };

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: LoginFormValues) =>
      loginApi({ username, password, deviceId: deviceId ?? "" }),

    onSuccess: async (res, vars) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ [LOGIN] Success");
      console.log("👤 Username:", vars.username);
      console.log("📋 loginStatus:", res.loginStatus);
      console.log("🔑 requestId:", (res as any).requestId ?? "N/A");
      console.log(
        "🎫 accessToken:",
        (res as any).token?.accessToken
          ? `${(res as any).token.accessToken.slice(0, 20)}...`
          : "N/A",
      );
      console.log(
        "🔄 refreshToken:",
        (res as any).token?.refreshToken
          ? `${(res as any).token.refreshToken.slice(0, 20)}...`
          : "N/A",
      );
      console.log("📦 Full response:", JSON.stringify(res, null, 2));
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      triggerSuccessHaptic();
      await handleLoginSuccess(res, vars.username, vars.password);
    },

    onError: (err) => {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("❌ [LOGIN] Error");
      console.log(
        "🧨 Type:",
        err instanceof ApiLoginError
          ? "ApiLoginError"
          : ((err as any)?.constructor?.name ?? typeof err),
      );
      console.log("💬 Message:", (err as any)?.message ?? "N/A");
      console.log("🔢 errorCode:", (err as any)?.errorCode ?? "N/A");
      console.log(
        "📦 Full error:",
        JSON.stringify(err, Object.getOwnPropertyNames(err), 2),
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      triggerErrorHaptic();

      if (!(err instanceof ApiLoginError)) {
        showMessageError("UNEXPECTED_ERROR", "TRY_AGAIN_LATER");
        return;
      }

      switch (err.errorCode) {
        case "INVALID_CREDENTIALS":
          showMessageError("INVALID_CREDENTIALS", "PASSWORD_REQUIRED");
          break;

        case "ACCOUNT_BLOCKED":
          showMessageError("ACCOUNT_BLOCKED", "CONTACT_SUPPORT");
          router.replace("/(system)/user-blocked");
          break;

        case "ACCOUNT_LOCKED":
          router.replace("/(system)/account-locked");
          break;

        default:
          showMessageError("UNEXPECTED_ERROR", "TRY_AGAIN_LATER");
      }
    },
  });

  const isAnyLoginLoading =
    loginMutation.isPending || isSubmitting || localAuthLoading;

  const onSubmit = (data: LoginFormValues) => {
    if (!canSubmit) return;
    if (loginMutation.isPending || isSubmitting) return;
    loginMutation.mutate(data);
  };

  /**
   * ✅ UPDATED: handleBiometricLogin sets preferredLoginMethod
   */
  const handleBiometricLogin = async () => {
    if (!biometricAvailable || localAuthLoading) return;

    clearErrors();
    setLocalAuthLoading(true);
    triggerMediumHaptic();

    try {
      const result = await loginWithBiometric();

      if (!result) {
        triggerErrorHaptic();
        showMessageError("UNEXPECTED_ERROR", "TRY_AGAIN_LATER");
        return;
      }

      if (result.status === "SERVICE_UNAVAILABLE") {
        triggerErrorHaptic();
        showMessageError(
          t("common.serviceUnavailableTitle"),
          t("common.serviceUnavailableDesc"),
        );
        return;
      }

      if (result.status === "LOGIN_COMPLETE") {
        triggerSuccessHaptic();
        return;
      }

      triggerErrorHaptic();
      showMessageError("UNEXPECTED_ERROR", "TRY_AGAIN_LATER");
    } catch {
      triggerErrorHaptic();
      showMessageError("UNEXPECTED_ERROR", "TRY_AGAIN_LATER");
    } finally {
      if (isMountedRef.current) {
        setLocalAuthLoading(false);
      }
    }
  };

  /**
   * ✅ UPDATED: handlePasscodeLogin
   */
  const handlePasscodeLogin = () => {
    if (!passcodeAvailable) return;
    triggerLightHaptic();
    router.push("/(auth)/passcode-login");
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={{ flex: 1, backgroundColor: BankingColors.background }}>
        {hasQuickLogin && !showTraditionalLogin ? (
          <QuickLoginView
            displayName={displayName}
            biometricType={biometricType}
            canUseBiometric={biometricAvailable}
            canUsePasscode={authState.hasPasscode}
            loading={isAnyLoginLoading}
            biometricLoading={localAuthLoading}
            float1={float1}
            float2={float2}
            float3={float3}
            fadeAnim={fadeAnim}
            scaleAnim={scaleAnim}
            screenHeight={SCREEN_HEIGHT}
            onBiometricPress={handleBiometricLogin}
            onPasscodePress={handlePasscodeLogin}
            onOtherAccountPress={() => {
              triggerLightHaptic();
              setLocalAuthLoading(false);
              setShowTraditionalLogin(true);
            }}
            t={t}
          />
        ) : (
          <KeyboardAwareScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              flexGrow: 1,
              paddingTop: insets.top + 20,
            }}
            keyboardShouldPersistTaps="handled"
            enableOnAndroid
            extraScrollHeight={Platform.OS === "ios" ? 20 : 80}
            keyboardDismissMode="none"
          >
            <TraditionalLoginView
              canSubmit={canSubmit}
              control={control}
              errors={errors}
              touchedFields={touchedFields}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              loading={isAnyLoginLoading}
              onSubmit={handleSubmit(onSubmit)}
              onForgotPassword={() => {
                triggerLightHaptic();
                router.navigate("/(auth)/forgot-password");
              }}
              onActivateAccount={() => {
                triggerLightHaptic();
                router.navigate("/(auth)/forgot-password");
              }}
              onHelpPress={async () => {
                triggerLightHaptic();

                const url = "https://www.attijariup.com.tn/landingPage.html";

                const supported = await Linking.canOpenURL(url);

                if (supported) {
                  await Linking.openURL(url);
                } else {
                  console.log("Impossible d'ouvrir le lien :", url);
                }
              }}
              showBackToQuickLogin={hasQuickLogin}
              onBackToQuickLogin={() => {
                triggerLightHaptic();
                setShowTraditionalLogin(false);
              }}
              triggerLightHaptic={triggerLightHaptic}
              biometricType={biometricType}
              canUseBiometric={biometricAvailable}
              canUsePasscode={passcodeAvailable}
            />
          </KeyboardAwareScrollView>
        )}
        {/* 
        {__DEV__  && (
          <TouchableOpacity
            onPress={() => router.navigate("/(system)/account-locked")}
            style={{
              position: "absolute",
              bottom: insets.bottom + 12,
              right: 12,
              backgroundColor: BankingColors.accent,
              borderRadius: 8,
              paddingHorizontal: 10,
              paddingVertical: 7,
              opacity: 0.9,
              zIndex: 9999,
              elevation: 10,
            }}
          >
            <Animated.Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              DEV · blocked
            </Animated.Text>
          </TouchableOpacity>
        )} */}

        <FlashMessage position="bottom" />
      </View>
    </TouchableWithoutFeedback>
  );
}
