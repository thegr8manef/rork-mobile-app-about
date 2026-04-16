import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView } from "react-native";
import { X } from "lucide-react-native";
import { BankingColors,
  Spacing,
  FontSize,
  BorderRadius,
  Shadow,
  IconSize,
  InputHeight, FontFamily } from "@/constants";
import useShowMessage from "@/hooks/useShowMessage";

interface OTPModalProps {
  visible: boolean;
  onClose: () => void;
  onVerify: (otp: string) => Promise<boolean>;
  phoneNumber?: string;
}

export default function OTPModal({
  visible,
  onClose,
  onVerify,
  phoneNumber }: OTPModalProps) {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const { showMessageError, showMessageSuccess } = useShowMessage();
  useEffect(() => {
    if (visible) {
      setOtp(["", "", "", "", "", ""]);
      setResendTimer(30);
      setCanResend(false);
      startTimer();
    }
  }, [visible]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (resendTimer > 0 && visible) {
      interval = setInterval(() => {
        setResendTimer((prev) => {
          if (prev <= 1) {
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [resendTimer, visible]);

  const startTimer = () => {
    setResendTimer(30);
    setCanResend(false);
  };

  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const otpArray = text.slice(0, 6).split("");
      const newOtp = [...otp];
      otpArray.forEach((char, i) => {
        if (index + i < 6 && /^\d*$/.test(char)) {
          newOtp[index + i] = char;
        }
      });
      setOtp(newOtp);

      const lastIndex = Math.min(index + otpArray.length, 5);
      inputRefs.current[lastIndex]?.focus();

      if (newOtp.every((digit) => digit !== "")) {
        handleVerify(newOtp.join(""));
      }
      return;
    }

    if (/^\d*$/.test(text)) {
      const newOtp = [...otp];
      newOtp[index] = text;
      setOtp(newOtp);

      if (text && index < 5) {
        inputRefs.current[index + 1]?.focus();
      }

      if (newOtp.every((digit) => digit !== "")) {
        handleVerify(newOtp.join(""));
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otpValue: string) => {
    setIsVerifying(true);
    try {
      const success = await onVerify(otpValue);
      if (!success) {
        showMessageError("Erreur", "Code OTP invalide");
        setOtp(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      console.error("OTP verification error:", error);
      showMessageError("Erreur", "Une erreur s'est produite");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (!canResend) return;

    console.log("Resending OTP...");
    showMessageSuccess("Succès", "Un nouveau code OTP a été envoyé");
    startTimer();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={IconSize.lg} color={BankingColors.textSecondary} />
            </TouchableOpacity>

            <Text style={styles.title}>Vérification OTP</Text>
            <Text style={styles.subtitle}>
              Entrez le code à 6 chiffres envoyé à votre numéro
              {phoneNumber && ` ${phoneNumber}`}
            </Text>

            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[styles.otpInput, digit && styles.otpInputFilled]}
                  value={digit}
                  onChangeText={(text) => handleOtpChange(text, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={1}
                  selectTextOnFocus
                  editable={!isVerifying}
                  autoFocus={index === 0}
                  contextMenuHidden={true}
                />
              ))}
            </View>

            {isVerifying && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={BankingColors.primary} />
                <Text style={styles.loadingText}>Vérification en cours...</Text>
              </View>
            )}

            <View style={styles.resendContainer}>
              <TouchableOpacity
                onPress={handleResend}
                disabled={!canResend}
                style={styles.resendButton}
              >
                <Text
                  style={[
                    styles.resendText,
                    !canResend && styles.resendTextDisabled,
                  ]}
                >
                  Renvoyer le code
                </Text>
              </TouchableOpacity>
              {!canResend && (
                <Text style={styles.timerText}>({resendTimer}s)</Text>
              )}
            </View>

            <Text style={styles.infoText}>
              Vous n&apos;avez pas reçu le code ? Vérifiez vos SMS ou demandez
              un nouveau code
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: BankingColors.overlay },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl },
  container: {
    backgroundColor: BankingColors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xxl,
    width: "100%",
    maxWidth: 400,
    ...Shadow.lg },
  closeButton: {
    position: "absolute",
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1,
    padding: Spacing.xs },
  title: {
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.bold,
    color: BankingColors.text,
    marginBottom: Spacing.sm,
    textAlign: "center" },
  subtitle: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xxxl,
    lineHeight: 20 },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xxl,
    gap: Spacing.sm },
  otpInput: {
    flex: 1,
    height: InputHeight.lg,
    borderWidth: 2,
    borderColor: BankingColors.border,
    borderRadius: BorderRadius.lg,
    textAlign: "center",
    fontSize: FontSize.xxl,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    backgroundColor: BankingColors.background },
  otpInputFilled: {
    borderColor: BankingColors.primary,
    backgroundColor: BankingColors.surface },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.md,
    marginBottom: Spacing.xl },
  loadingText: {
    fontSize: FontSize.base,
    color: BankingColors.textSecondary },
  resendContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg },
  resendButton: {
    paddingVertical: Spacing.sm },
  resendText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.primary },
  resendTextDisabled: {
    color: BankingColors.borderMedium },
  timerText: {
    fontSize: FontSize.md,
    color: BankingColors.textSecondary },
  infoText: {
    fontSize: FontSize.sm,
    color: BankingColors.textLight,
    textAlign: "center",
    lineHeight: 18 } });
