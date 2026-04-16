// types/notification.type.ts
// Based on Postman collection "alerts" folder :contentReference[oaicite:1]{index=1}

export interface PushNotificationsListResponse {
  count: number;
  data: PushNotificationItem[];
}
export type AlertReceptionChannel = "email" | "sms" | "push";

export type AlertType = string; // ex: "overBalance", "overMvtC" (keep string for flexibility)

export interface AlertContactDetails {
  email?: string | null;
  phoneNumber?: string | null;

  // If backend ever sends legacy keys, keep optional
  mail?: string | null;
  telNumber?: string | null;
}

export interface AlertResponseItem {
  id: string;
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  receptionChannels: AlertReceptionChannel[];
  enabled: boolean | null; // Postman shows null sometimes
  contactDetails: AlertContactDetails;
}

export interface AlertsListResponse {
  count: number;
  data: AlertResponseItem[]; // ✅ Postman uses "data"
}

export interface CreateAlertRequest {
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  receptionChannels: AlertReceptionChannel[];
  contactDetails: {
    email: string;
    phoneNumber: string;
  };
}

/**
 * PUT /api/alerts/update payload (from Postman originalRequest)
 * - alertId is required
 * - Postman uses accountUUID in update payload (not accountId)
 */
export interface UpdateAlertRequest {
  alertId: string;
  accountId: string; // keep as-is from collection
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string;
  endDate: string;
  receptionChannels: AlertReceptionChannel[];
  contactDetails: {
    email: string;
    phoneNumber: string;
  };
}

/* ---------------- Push notifications ---------------- */

export interface PushNotificationData {
  title: string;
  body: string;
}

export interface PushNotificationItem {
  id: string; // ex: "notification_..."
  customerId: string; // ex: "cus_..."
  timestamp: string; // ISO with timezone
  read: boolean;
  alertId: string | null;
  data: PushNotificationData;
}
