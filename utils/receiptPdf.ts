// utils/receiptPdf.ts
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';
import { Share, Platform } from 'react-native';
import { Asset } from 'expo-asset';

export type ReceiptStatus = 'success' | 'error';

export type ReceiptData = {
  title: string;
  status: ReceiptStatus;

  // Main message shown in the PDF
  message: string;

  // Optional fields
  transactionId?: string | null;
  amount?: number | null;
  date?: Date;

  // Optional (used only to build a nicer filename)
  actionType?: string;
};

const escapeHtml = (s: string) =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const formatTND = (value: number) =>
  new Intl.NumberFormat('fr-TN', {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3 }).format(value);

/**
 * Convert a bundled asset image (require('...png')) into a base64 data URI
 * so it can be embedded in the HTML for expo-print.
 */
const getPngDataUriFromAsset = async (assetModule: number): Promise<string> => {
  const asset = Asset.fromModule(assetModule);

  if (!asset.localUri) {
    await asset.downloadAsync();
  }

  const uri = asset.localUri || asset.uri;
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: 'base64' as any });


  return `data:image/png;base64,${base64}`;
};

export const buildReceiptHtml = (data: ReceiptData, logoDataUri?: string) => {
  const isSuccess = data.status === 'success';

  const title = escapeHtml(data.title);
  const msg = escapeHtml(data.message);

  const ref = escapeHtml(data.transactionId ?? '-');
  const amt = data.amount != null ? `${formatTND(data.amount)} TND` : '-';
  const dateStr = (data.date ?? new Date()).toLocaleString('fr-TN');

  const badgeBg = isSuccess ? '#ECFDF5' : '#FEF2F2';
  const badgeText = isSuccess ? '#065F46' : '#991B1B';
  const badgeLabel = isSuccess ? 'SUCCÈS' : 'ÉCHEC';

  const logoHtml = logoDataUri
    ? `
      <div style="text-align:center;margin-bottom:14px;">
        <img src="${logoDataUri}" style="width:128px;height:64px;border-radius:16px;" />
      </div>
    `
    : '';

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial; padding: 24px; color: #111; }
        .card { border: 1px solid #E5E7EB; border-radius: 16px; padding: 20px; }
        .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
        .status { display: inline-block; padding: 6px 10px; border-radius: 999px; font-size: 12px; font-weight: 700; background: ${badgeBg}; color: ${badgeText}; }
        .msg { margin-top: 14px; font-size: 14px; line-height: 20px; }
        .row { display: flex; justify-content: space-between; gap: 16px; margin-top: 14px; padding-top: 14px; border-top: 1px dashed #E5E7EB; }
        .col { flex: 1; }
        .label { color: #6B7280; font-size: 12px; }
        .value { font-size: 14px; font-weight: 600; margin-top: 4px; word-break: break-word; }
        .amount { font-size: 22px; font-weight: 800; margin-top: 6px; }
        .right { text-align: right; }
        .footer { margin-top: 18px; font-size: 11px; color: #6B7280; line-height: 16px; }
      </style>
    </head>
    <body>
      ${logoHtml}
      <div class="card">
        <div class="title">${title}</div>
        <div class="status">${badgeLabel}</div>

        <div class="msg">${msg}</div>

        <div class="row">
          <div class="col">
            <div class="label">Montant</div>
            <div class="amount">${escapeHtml(amt)}</div>
          </div>
          <div class="col right">
            <div class="label">Date</div>
            <div class="value">${escapeHtml(dateStr)}</div>
          </div>
        </div>

        <div class="row">
          <div class="col">
            <div class="label">Référence</div>
            <div class="value">${ref}</div>
          </div>
          <div class="col right">
            <div class="label">Statut</div>
            <div class="value">${isSuccess ? 'Confirmé' : 'Refusé'}</div>
          </div>
        </div>

        <div class="footer">
          Ce document est généré automatiquement depuis l’application.
        </div>
      </div>
    </body>
  </html>
  `;
};

/**
 * Generates a PDF file from receipt data and opens the native share sheet.
 * Returns the generated PDF URI (useful for logs / preview).
 *
 * By default it shares the URI returned by expo-print directly (no FileSystem copy).
 * If you *really* want a custom filename, set `renameToNiceFilename: true`.
 */
export const shareReceiptPdf = async (
  data: ReceiptData,
  options?: { renameToNiceFilename?: boolean }
): Promise<string> => {
  // IMPORTANT: adjust the require path depending on where this file lives.
  // If this file is in "utils/", then "../assets/..." is usually correct.
  const logoDataUri = await getPngDataUriFromAsset(
    require('../assets/images/newlogo.png')
  );

  const html = buildReceiptHtml(data, logoDataUri);

  // 1) Create PDF from HTML
  const { uri } = await Print.printToFileAsync({
    html,
    base64: false });

  let shareUri = uri;

  // 2) Optional: rename/copy to a nicer filename (ONLY if FileSystem.documentDirectory exists in your types/runtime)
  if (options?.renameToNiceFilename) {
    const safeRef = (data.transactionId || 'no-ref').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `recu_${data.actionType || 'tx'}_${safeRef}_${Date.now()}.pdf`;

    // Some TS setups complain about documentDirectory; this keeps runtime safe.
    const dir = (FileSystem as any).documentDirectory as string | undefined;

    if (dir) {
      const newUri = dir + filename;
      await FileSystem.copyAsync({ from: uri, to: newUri });
      shareUri = newUri;
    }
  }

  // 3) Share
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(shareUri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Partager le reçu',
      UTI: Platform.OS === 'ios' ? 'com.adobe.pdf' : undefined });
  } else {
    // Fallback (rare)
    await Share.share({
      title: 'Reçu de transaction',
      message: 'Voici le reçu de la transaction.',
      url: shareUri });
  }

  return shareUri;
};
