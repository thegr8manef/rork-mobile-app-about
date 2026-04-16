import React, { useEffect, useState } from "react";
import {
  View,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  Platform,
  Share,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Eye,
  EyeOff,
  Fingerprint,
  ScanFace,
  KeyRound,
  AlertCircleIcon,
} from "lucide-react-native";
import TText from "@/components/TText";
import messaging from "@react-native-firebase/messaging";

import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorIcon,
  FormControlErrorText,
} from "@/components/ui/form-control";

import { Controller } from "react-hook-form";
import {
  BankingColors,
  BorderRadius,
  ButtonHeight,
  FontSize,
  Spacing,
  FontFamily,
} from "@/constants";
import { useTranslation } from "react-i18next";

type Props = {
  control: any;
  errors: any;
  touchedFields: any;

  showPassword: boolean;
  setShowPassword: (v: boolean | ((p: boolean) => boolean)) => void;

  loading: boolean;
  onSubmit: () => void;

  onForgotPassword: () => void;
  onActivateAccount: () => void;
  onHelpPress: () => void;

  showBackToQuickLogin: boolean;
  onBackToQuickLogin: () => void;

  triggerLightHaptic: () => void;

  canSubmit: boolean;

  biometricType?: string | null;
  canUseBiometric?: boolean;
  canUsePasscode?: boolean;
};

export default function TraditionalLoginView({
  control,
  errors,
  touchedFields,
  showPassword,
  setShowPassword,
  loading,
  onSubmit,
  onForgotPassword,
  onActivateAccount,
  onHelpPress,
  showBackToQuickLogin,
  onBackToQuickLogin,
  triggerLightHaptic,
  canSubmit,
  biometricType,
  canUseBiometric = false,
  canUsePasscode = false,
}: Props) {
  const isDisabled = loading || !canSubmit;
  const { height: windowHeight } = useWindowDimensions();
  const { bottom: bottomInset } = useSafeAreaInsets();
  const { t } = useTranslation();

  const [fcmToken, setFcmToken] = useState<string>("");

  useEffect(() => {
    let mounted = true;

    async function loadToken() {
      try {
        if (Platform.OS === "ios") {
          const authStatus = await messaging().requestPermission();
          const enabled =
            authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
            authStatus === messaging.AuthorizationStatus.PROVISIONAL;
          if (!enabled) return;
        }
        const token = await messaging().getToken();
        if (mounted) setFcmToken(token || "");
      } catch {}
    }

    loadToken();
    return () => { mounted = false; };
  }, []);

  const showUsernameError = !!touchedFields?.username && !!errors.username;
  const showPasswordError = !!touchedFields?.password && !!errors.password;

  const renderQuickLoginIcon = () => {
    if (canUseBiometric) {
      if (biometricType === "faceId") return <ScanFace size={24} color={BankingColors.primary} />;
      return <Fingerprint size={24} color={BankingColors.primary} />;
    }
    if (canUsePasscode) return <KeyRound size={24} color={BankingColors.primary} />;
    return <Fingerprint size={24} color={BankingColors.primary} />;
  };

  const isSmallScreen = windowHeight < 700;
  const logoHeight = isSmallScreen ? 100 : 130;

  return (
    <View style={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Image
          source={require("@assets/images/newlogo.png")}
          style={[styles.logo, { height: logoHeight }]}
          resizeMode="contain"
        />
        <TText tKey="login" style={styles.title} />
        <TText
          tKey="subtitle"
          style={styles.subtitle}
          numberOfLines={2}
          ellipsizeMode="tail"
        />
      </View>

      {/* Card with dashed border */}
      <View style={styles.card}>
        {/* Username */}
        <FormControl isInvalid={showUsernameError}>
          <FormControlLabel>
            <FormControlLabelText>
              <TText tKey="usernameLabel" style={styles.label} />
            </FormControlLabelText>
          </FormControlLabel>

          <Controller
            control={control}
            name="username"
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                style={styles.input}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
                editable={!loading}
              />
            )}
          />

          {showUsernameError && (
            <FormControlError style={styles.errorRow}>
              <FormControlErrorIcon as={AlertCircleIcon} style={styles.errorIcon} />
              <FormControlErrorText style={styles.errorText}>
                {t(errors.username?.message)}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Password */}
        <FormControl isInvalid={showPasswordError}>
          <FormControlLabel>
            <FormControlLabelText>
              <TText tKey="passwordLabel" style={styles.label} />
            </FormControlLabelText>
          </FormControlLabel>

          <View style={styles.passwordContainer}>
            <Controller
              control={control}
              name="password"
              render={({ field: { value, onChange, onBlur } }) => (
                <TextInput
                  style={styles.passwordInput}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureTextEntry={__DEV__ ? false : !showPassword}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={onSubmit}
                  autoCapitalize="none"
                />
              )}
            />
            <TouchableOpacity
              onPress={() => {
                triggerLightHaptic();
                setShowPassword((p) => !p);
              }}
              style={styles.eyeIcon}
            >
              {showPassword ? (
                <EyeOff size={20} color={BankingColors.primary} />
              ) : (
                <Eye size={20} color={BankingColors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {showPasswordError && (
            <FormControlError style={styles.errorRow}>
              <FormControlErrorIcon as={AlertCircleIcon} style={styles.errorIcon} />
              <FormControlErrorText style={styles.errorText}>
                {t(errors.password?.message)}
              </FormControlErrorText>
            </FormControlError>
          )}
        </FormControl>

        {/* Submit button + quick login icon row */}
        <View style={styles.loginRow}>
          <TouchableOpacity
            style={[styles.loginButton, isDisabled && styles.loginButtonDisabled]}
            onPress={onSubmit}
            disabled={isDisabled}
          >
            {loading ? (
              <ActivityIndicator color={BankingColors.white} />
            ) : (
              <TText tKey="submitButton" style={styles.loginButtonText} />
            )}
          </TouchableOpacity>

          {showBackToQuickLogin && (
            <TouchableOpacity style={styles.biometricButton} onPress={onBackToQuickLogin}>
              {renderQuickLoginIcon()}
            </TouchableOpacity>
          )}
        </View>

        {/* Forgot password — centered inside card */}
        <TouchableOpacity onPress={onForgotPassword} style={styles.forgotPassword}>
          <TText tKey="forgotPasswordInline" style={styles.forgotPasswordText} />
        </TouchableOpacity>
      </View>


      {/* Bottom help */}
      <View style={[styles.bottomLinks, { paddingBottom: Math.max(bottomInset, Spacing.lg) }]}>
        <TouchableOpacity style={styles.helpButton} onPress={onHelpPress}>
          <TText tKey="help" style={styles.helpButtonText} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xxl,
    backgroundColor: BankingColors.background,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xxxl,
  },
  logo: {
    width: 220,
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    marginBottom: Spacing.sm,
    textAlign: "center",
    color: BankingColors.black,
  },
  subtitle: {
    fontSize: FontSize.base,
    textAlign: "center",
    color: BankingColors.loginSubtitle,
    lineHeight: FontSize.base * 1.4,
    // paddingHorizontal: Spacing.md,
    includeFontPadding: false,
  },

  card: {
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.lg,
    shadowColor: BankingColors.shadowBlack,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },

  label: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
    color: BankingColors.textPrimary,
  },
  input: {
    backgroundColor: BankingColors.white,
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.borderGray,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: BankingColors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: BankingColors.borderGray,
  },
  passwordInput: {
    flex: 1,
    padding: Spacing.lg,
    fontSize: FontSize.base,
    color: BankingColors.textPrimary,
  },
  eyeIcon: { padding: Spacing.lg },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  errorIcon: { color: BankingColors.error ?? "#E53935" },
  errorText: {
    color: BankingColors.error ?? "#E53935",
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
  },

  loginButton: {
    flex: 1,
    backgroundColor: BankingColors.primary,
    borderRadius: BorderRadius.xxl,
    height: ButtonHeight.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonDisabled: { opacity: 0.5 },
  loginButtonText: {
    color: BankingColors.white,
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
  },

  forgotPassword: {
    alignItems: "center",
    paddingVertical: Spacing.xs,
  },
  forgotPasswordText: {
    color: BankingColors.forgotPassword,
    fontSize: FontSize.base,
    fontFamily: FontFamily.medium,
    textAlign: "center",
  },

  loginRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  biometricButton: {
    width: ButtonHeight.lg,
    height: ButtonHeight.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: BankingColors.primary,
    justifyContent: "center",
    alignItems: "center",
  },

  bottomLinks: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  },
  helpButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
  },
  helpButtonText: {
    color: BankingColors.black,
    fontSize: FontSize.base,
    fontFamily: FontFamily.semibold,
  },
});
