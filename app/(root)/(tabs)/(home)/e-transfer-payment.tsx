import React, { useEffect, useState } from "react";
import { View, StyleSheet, ActivityIndicator, Pressable } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { router, useLocalSearchParams, Stack } from "expo-router";
import { BankingColors, FontSize, Spacing, FontFamily } from "@/constants";
import ConfirmModal from "@/components/ui/ConfirmModal";
import TText from "@/components/TText";
import { X } from "lucide-react-native";

export default function ETransferPaymentScreen() {
  const params = useLocalSearchParams<{
    orderId: string;
    clickToPayUrl: string;
    amount: string;
    currency: string;
  }>();

  const [cancelModal, setCancelModal] = useState({ visible: false });

  // ✅ add this
  const [showRedirecting, setShowRedirecting] = useState(true);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);
  useEffect(() => {
    openPaymentBrowser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openPaymentBrowser = React.useCallback(async () => {
    try {
      console.log("Opening payment URL:", params.clickToPayUrl);

      const result = await WebBrowser.openBrowserAsync(
        "https://www.attijaribank.com.tn/fr",
        {
          dismissButtonStyle: "close",
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
          controlsColor: BankingColors.primary,
          toolbarColor: BankingColors.primary,
          windowName: "E-Transfer Payment" },
      );

      console.log("Browser result:", result);

      // ✅ hide loader immediately when browser closes
      setShowRedirecting(false);

      // ✅ keep your logic (unchanged)
      timeoutRef.current = setTimeout(() => {
        router.replace("/e-transfer-history"); // or "/transfer-history" if that's your screen
      }, 3000);

      if (result.type === "cancel") {
        setCancelModal({ visible: true });

        // ❌ your old code did nothing
        // setTimeout(() => { ({ visible: false }); }, 1000);

        setTimeout(() => setCancelModal({ visible: false }), 1000);
      } else if (result.type === "dismiss") {
        console.log("Browser dismissed");
        router.replace("/e-transfer-history");
      }
    } catch (error) {
      console.error("Error opening browser:", error);
      setCancelModal({ visible: true });
      setShowRedirecting(false);
    }
  }, [params.clickToPayUrl]);

  return (
    <>
      {/* ✅ only show loader while browser is open */}
      {showRedirecting && (
        <View style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={BankingColors.primary} />
            <TText tKey="etransfer.redirecting" style={styles.loadingText} />
          </View>
        </View>
      )}

      <ConfirmModal
        visible={cancelModal.visible}
        titleKey="etransfer.cancelled"
        descriptionKey="etransfer.cancelledMessage"
        primaryButtonKey="modal.ok"
        onPrimaryPress={() => {
          setCancelModal({ visible: false });
          router.back();
        }}
        onClose={() => {
          setCancelModal({ visible: false });
          router.back();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BankingColors.background },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BankingColors.background,
    gap: Spacing.md },
  loadingText: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.semibold,
    color: BankingColors.text,
    marginTop: Spacing.md } });
