// hooks/use-notification.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAlert,
  deleteAlert,
  disableAlert,
  enableAlert,
  getAlerts,
  getPushNotifications,
  markPushNotificationAllRead,
  markPushNotificationRead,
  updateAlert,
} from "@/services/notification.api";
import type {
  CreateAlertRequest,
  UpdateAlertRequest,
} from "@/types/notification.type";
import useShowMessage from "./useShowMessage";

export const alertQueries = {
  alerts: ["alerts"] as const,
  push: (page: number, size: number, token: string) =>
    ["pushNotifications", page, size, token] as const,
};

/* ============================================================
 * Alerts
 * ============================================================ */

export function useAlerts() {
  const { showMessageError } = useShowMessage();

  return useQuery({
    queryKey: alertQueries.alerts,
    queryFn: async () => {
      try {
        const res = await getAlerts();
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Impossible de charger les alertes. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
  });
}

export function useCreateAlert() {
  const qc = useQueryClient();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return useMutation({
    mutationFn: async (body: CreateAlertRequest) => {
      try {
        const res = await createAlert(body);
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Création d'alerte impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
    onSuccess: async (data) => {
      showMessageSuccess("Création", "L’alerte a été créée avec succès.");
      await qc.invalidateQueries({ queryKey: alertQueries.alerts });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue.";

      showMessageError(
        "Erreur",
        `Création d'alerte échouée. (${status ?? "?"}) ${message}`,
      );
    },
  });
}

type UpdateAlertVars = {
  body: UpdateAlertRequest;
  alertId: string;
};

export function useUpdateAlert() {
  const qc = useQueryClient();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return useMutation<void, any, UpdateAlertVars>({
    mutationFn: async ({ body, alertId }) => {
      try {
        return await updateAlert(body, alertId);
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Erreur lors de la mise à jour. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
    onSuccess: async () => {
      showMessageSuccess(
        "Mise à jour",
        "La mise à jour a été effectuée avec succès.",
      );
      await qc.invalidateQueries({ queryKey: alertQueries.alerts });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue.";

      showMessageError(
        "Erreur",
        `Mise à jour échouée. (${status ?? "?"}) ${message}`,
      );
      console.log("status", status);
      console.log("message", message);
    },
  });
}

export function useEnableAlert() {
  const qc = useQueryClient();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return useMutation({
    mutationFn: async (alertId: string) => {
      try {
        const res = await enableAlert(alertId);
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Activation impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
    onSuccess: async (_, alertId) => {
      showMessageSuccess(
        "Alerte activée",
        "L’alerte a été activée avec succès.",
      );
      await qc.invalidateQueries({ queryKey: alertQueries.alerts });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue.";

      showMessageError(
        "Erreur",
        `Activation échouée. (${status ?? "?"}) ${message}`,
      );
    },
  });
}

export function useDisableAlert() {
  const qc = useQueryClient();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return useMutation({
    mutationFn: async (alertId: string) => {
      try {
        const res = await disableAlert(alertId);
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Désactivation impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
    onSuccess: async (_, alertId) => {
      showMessageSuccess(
        "Alerte désactivée",
        "Alerte a été désactivée avec succès.",
      );
      await qc.invalidateQueries({ queryKey: alertQueries.alerts });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue.";

      showMessageError(
        "Erreur",
        `Désactivation échouée. (${status ?? "?"}) ${message}`,
      );
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  const { showMessageError, showMessageSuccess } = useShowMessage();

  return useMutation({
    mutationFn: async (alertId: string) => {
      try {
        const res = await deleteAlert(alertId);
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Suppression impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
    onSuccess: async (_, alertId) => {
      showMessageSuccess(
        "Suppression",
        "L’alerte a été supprimée avec succès.",
      );
      await qc.invalidateQueries({ queryKey: alertQueries.alerts });
    },
    onError: (error: any) => {
      const status = error?.response?.status;
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Une erreur est survenue.";

      showMessageError(
        "Erreur",
        `Suppression échouée. (${status ?? "?"}) ${message}`,
      );
    },
  });
}

/* ============================================================
 * Push notifications
 * ============================================================ */

export function usePushNotifications(page = 1, size = 100, token = "") {
  const { showMessageError } = useShowMessage();

  return useQuery({
    queryKey: alertQueries.push(page, size, token),
    queryFn: async () => {
      try {
        const res = await getPushNotifications({ page, size, token });
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Impossible de charger les notifications. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },
  });
}

export function useMarkPushRead(page = 1, size = 100, token = "") {
  const qc = useQueryClient();
  const { showMessageError } = useShowMessage();

  return useMutation({
    mutationFn: async (pushNotifId: string) => {
      try {
        const res = await markPushNotificationRead(pushNotifId);
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Marquage en lu impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },

    // ✅ optimistic
    onMutate: async (pushNotifId: string) => {
      await qc.cancelQueries({ queryKey: alertQueries.push(page, size, token) });

      const prev = qc.getQueryData<any>(alertQueries.push(page, size, token));

      qc.setQueryData<any>(alertQueries.push(page, size, token), (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) =>
            n.id === pushNotifId ? { ...n, read: true } : n,
          ),
        };
      });

      return { prev };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(alertQueries.push(page, size, token), ctx.prev);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: alertQueries.push(page, size, token) });
    },
  });
}

export function useMarkPushAllRead(page = 1, size = 100, token = "") {
  const qc = useQueryClient();
  const { showMessageError } = useShowMessage();

  return useMutation({
    mutationFn: async () => {
      try {
        const res = await markPushNotificationAllRead();
        return res;
      } catch (error: any) {
        const status = error?.response?.status;
        const message =
          error?.response?.data?.message ||
          error?.message ||
          "Une erreur est survenue.";

        showMessageError(
          "Erreur",
          `Marquage en lu impossible. (${status ?? "?"}) ${message}`,
        );
        throw error;
      }
    },

    // ✅ optimistic
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: alertQueries.push(page, size, token) });

      const prev = qc.getQueryData<any>(alertQueries.push(page, size, token));

      qc.setQueryData<any>(alertQueries.push(page, size, token), (old) => {
        if (!old?.data) return old;
        return {
          ...old,
          data: old.data.map((n: any) => ({ ...n, read: true })),
        };
      });

      return { prev };
    },

    onError: (error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(alertQueries.push(page, size, token), ctx.prev);
    },

    onSettled: async () => {
      await qc.invalidateQueries({ queryKey: alertQueries.push(page, size, token) });
    },
  });
}
