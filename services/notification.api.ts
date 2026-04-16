// services/notification.api.ts
// Based on Postman collection "alerts" folder :contentReference[oaicite:2]{index=2}

import api from "./lib/axios";
import type {
  AlertsListResponse,
  AlertResponseItem,
  CreateAlertRequest,
  UpdateAlertRequest,
  PushNotificationItem,
  PushNotificationsListResponse,
} from "@/types/notification.type";

/* ============================================================
 * ALERTS — LIST / CREATE / UPDATE / ENABLE
 * ============================================================ */

export const getAlerts = async (): Promise<AlertsListResponse> => {
  const { data } = await api.get<AlertsListResponse>("/api/alerts");
  return data;
};

export const createAlert = async (
  body: CreateAlertRequest,
): Promise<AlertResponseItem> => {
  const { data } = await api.post<AlertResponseItem>("/api/alerts", body);
  return data;
};

/**
 * Postman: PUT {{baseUrl}}/api/alerts/update
 * Response: 204 No Content
 */
export const updateAlert = async (
  body: UpdateAlertRequest,
  alertId: string,
): Promise<void> => {
  const url = `/api/alerts/${alertId}`;
  const fullUrl = `${api.defaults.baseURL}${url}`;

  console.log("🚀 PUT Request:");
  console.log("URL:", fullUrl);
  console.log("Body:", body);

  try {
    const response = await api.put(url, body);

    console.log("✅ Response received:");
    console.log("Status:", response.status);
    console.log("Data:", response.data); // will likely be empty for 204
  } catch (error: any) {
    console.log("❌ Request failed:");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log("Data:", error.response.data);
    } else {
      console.log("Error message:", error.message);
    }

    throw error;
  }
};

/**
 * PATCH /api/alerts/{Id}/enable (204 No Content)
 * Postman item name says EnableOrDisableAlert but path is /enable
 */
export const enableAlert = async (alertId: string): Promise<void> => {
  await api.patch(`/api/alerts/${alertId}/enable`);
};

/**
 * PATCH /api/alerts/{Id}/disable (204 No Content)
 * Disable an existing alert
 */
export const disableAlert = async (alertId: string): Promise<void> => {
  await api.patch(`/api/alerts/${alertId}/disable`);
};

/**
 * DELETE /api/alerts/{alertId} (204 No Content)
 * Delete an existing alert
 */
export const deleteAlert = async (alertId: string): Promise<void> => {
  await api.delete(`/api/alerts/${alertId}`);
};

/* ============================================================
 * PUSH NOTIFICATIONS — LIST / MARK AS READ
 * ============================================================ */

/**
 * GET /api/alerts/push?token=&page=&size=
 * Postman includes token query but it can be empty.
 */
export const getPushNotifications = async (params?: {
  token?: string;
  page?: number;
  size?: number;
}): Promise<PushNotificationsListResponse> => {
  const { token = "", page = 1, size = 100 } = params ?? {};

  const { data } = await api.get<PushNotificationsListResponse>(
    "/api/alerts/push",
    {
      params: { token, page, size },
    },
  );

  return data;
};

/**
 * PATCH /api/alerts/push/{pushNotifId}/read
 * Response body empty (Postman 200 OK with empty body)
 */
export const markPushNotificationRead = async (
  pushNotifId: string,
): Promise<void> => {
  await api.patch(`/api/alerts/push/${pushNotifId}/read`);
};

/**
 * PATCH /api/alerts/push/readAll
 *
 */
export const markPushNotificationAllRead = async (): Promise<void> => {
  await api.patch(`/api/alerts/push/readAll`);
};
