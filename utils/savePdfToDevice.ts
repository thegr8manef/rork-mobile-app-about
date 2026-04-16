import * as Sharing from "expo-sharing";
import { File, Paths } from "expo-file-system";

type ShowMessageFn = (title: string, message: string) => void;

export async function savePdfToDevice(
  base64: string,
  filename: string,
  options?: {
    showMessageSuccess?: ShowMessageFn;
    showMessageError?: ShowMessageFn;
    dialogTitle?: string;
  }
) {
  const showSuccess = options?.showMessageSuccess;
  const showError = options?.showMessageError;

  try {
    const cleanBase64 = base64.includes("base64,") ? base64.split("base64,")[1] : base64;

    const file = new File(Paths.cache, filename);
    file.write(cleanBase64, { encoding: "base64" });

    const isSharingAvailable = await Sharing.isAvailableAsync();

    if (isSharingAvailable) {
      await Sharing.shareAsync(file.uri, {
        mimeType: "application/pdf",
        dialogTitle: options?.dialogTitle ?? "Enregistrer le reçu de virement",
        UTI: "com.adobe.pdf" });

      showSuccess?.("Succès", "Document PDF partagé ✅");
      return file.uri;
    }

    showError?.("Erreur", "Le partage n'est pas disponible sur cet appareil");
    throw new Error("Sharing not available");
  } catch (error) {
    console.log("❌ Save PDF error:", error);
    showError?.("Erreur", "Impossible d'enregistrer le PDF. Veuillez réessayer.");
    throw error;
  }
}
