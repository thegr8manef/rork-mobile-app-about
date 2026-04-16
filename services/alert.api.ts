import { AlertResponse, AlertToggleAction, CreateAlertRequest, UpdateAlertRequest } from "@/types/notifications";
import api from "./lib/axios";

/* ------------------------------------------------------------------ */
/* Utils                                                              */
/* ------------------------------------------------------------------ */
const logBaseUrl = () => {
  console.log("[API BASE URL]", api.defaults.baseURL);
};


export async function createAlert(
  body: CreateAlertRequest
): Promise<AlertResponse> {
    logBaseUrl();
    console.log("[API] createAlert", body);

    const { data } = await api.post<AlertResponse>(
        "/api/alerts",
        body
    );

    return data;
};


export async function updateAlert(
  alertId: string,
  body: UpdateAlertRequest,
): Promise<AlertResponse> {
  const { data } = await api.put<AlertResponse>(
        `/api/alerts/${alertId}`,
        body
    );

    return data;
}

export async function getAlerts(
): Promise<AlertResponse[]> {
  const { data } = await api.get<{data :AlertResponse[]}>(
        `/api/alerts`
    );

    // console.log("🚀 ~ file: alert.api.ts:88 ~ getAlerts ~ data:", data);

    return data.data;
}


export async function deleteAlert(
      alertId: string,
): Promise<void> {
  const response = await api.delete<void>(
        `/api/alerts/${alertId}`
    );

    // If backend returns 204 No Content
  if (response.status === 204) {
    return;
  }
}


export async function toggleAlert(
  alertId: string,
  action: AlertToggleAction,
): Promise<void> {
    console.log("🚀 ~ file: alert.api.ts:88 ~ toggleAlert ~ data:", action);
    console.log("🚀 ~ file: alert.api.ts:88 ~ toggleAlert ~ url:",  `/api/alerts/${alertId}/${action}`);


  const response = await api.patch<AlertResponse>(
    `/api/alerts/${alertId}/${action}`
  );

  console.log("🚀 ~ file: alert.api.ts:88 ~ toggleAlert ~ data:", response);

  // If backend returns 204 No Content
  if (response.status === 204) {
    return;
  }
}