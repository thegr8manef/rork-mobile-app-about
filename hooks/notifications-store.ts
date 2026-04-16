import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import {
  Notification,
  NotificationConfig,
  AlertConfig,
  CreateAlertRequest,
  UpdateAlertRequest,
  AlertResponse,
  AlertToggleAction,
} from "@/types/notifications";
import { useAuth } from "./auth-store";
import * as api from "@/services/mock-api";
import * as alertApi from "@/services/alert.api";

export const [NotificationsProvider, useNotifications] = createContextHook(
  () => {
    const { authState } = useAuth();
    const accessToken = authState.accessToken || "";
    const queryClient = useQueryClient();

    const notificationsQuery = useQuery({
      queryKey: ["notifications", accessToken],
      queryFn: () => api.fetchNotificationsApi(accessToken),
      enabled: !!accessToken,
      staleTime: 1000 * 60 * 5,
    });

    const configsQuery = useQuery({
      queryKey: ["notificationConfigs", accessToken],
      queryFn: () => api.fetchNotificationConfigsApi(accessToken),
      enabled: !!accessToken,
      staleTime: 1000 * 60 * 5,
    });

    // const alertsQuery = useQuery({
    //   queryKey: ["alertConfigs", accessToken],
    //   queryFn: () => alertApi.getAlerts(),
    //   enabled: !!accessToken,
    //   staleTime: 2,
    // });

    const markAsReadMutation = useMutation({
      mutationFn: (id: string) => api.markNotificationReadApi(accessToken, id),
      onMutate: async (id) => {
        await queryClient.cancelQueries({ queryKey: ["notifications"] });
        const previousNotifications = queryClient.getQueryData([
          "notifications",
          accessToken,
        ]);

        queryClient.setQueryData(
          ["notifications", accessToken],
          (old: Notification[] | undefined) => {
            if (!old) return old;
            return old.map((n) => (n.id === id ? { ...n, read: true } : n));
          }
        );

        return { previousNotifications };
      },
      onError: (err, id, context) => {
        if (context?.previousNotifications) {
          queryClient.setQueryData(
            ["notifications", accessToken],
            context.previousNotifications
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    });

    const markAllAsReadMutation = useMutation({
      mutationFn: () => api.markAllNotificationsReadApi(accessToken),
      onMutate: async () => {
        await queryClient.cancelQueries({ queryKey: ["notifications"] });
        const previousNotifications = queryClient.getQueryData([
          "notifications",
          accessToken,
        ]);

        queryClient.setQueryData(
          ["notifications", accessToken],
          (old: Notification[] | undefined) => {
            if (!old) return old;
            return old.map((n) => ({ ...n, read: true }));
          }
        );

        return { previousNotifications };
      },
      onError: (err, variables, context) => {
        if (context?.previousNotifications) {
          queryClient.setQueryData(
            ["notifications", accessToken],
            context.previousNotifications
          );
        }
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      },
    });

    const updateConfigMutation = useMutation({
      mutationFn: (config: NotificationConfig) =>
        api.updateNotificationConfigApi(accessToken, config),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["notificationConfigs"] });
        console.log("Notification config updated successfully");
      },
    });

    const toggleAlertMutation = useMutation({
      mutationFn: ({
        alertId,
        action,
      }: {
        alertId: string;
        action: AlertToggleAction;
      }) => alertApi.toggleAlert(alertId, action),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["alertConfigs"] });
        console.log("alertConfigs config updated successfully");
      },
    });

    const createAlertMutation = useMutation({
      mutationFn: (alert: CreateAlertRequest) => alertApi.createAlert(alert),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["alertConfigs"] });
        console.log("Alert created successfully");
      },
    });

    const updateAlertMutation = useMutation({
      mutationFn: ({
        alertId,
        alert,
      }: {
        alertId: string;
        alert: UpdateAlertRequest;
      }) => alertApi.updateAlert(alertId, alert),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["alertConfigs"] });
        console.log("Alert updated successfully");
      },
    });

    const deleteAlertMutation = useMutation({
      mutationFn: (alertId: string) => alertApi.deleteAlert(alertId),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["alertConfigs"] });
        console.log("Alert deleted successfully");
      },
    });

    // const notifications = (notificationsQuery.data || []) as Notification[];
    // const configs = (configsQuery.data || []) as NotificationConfig[];
    // const alerts = (alertsQuery.data || []) as AlertResponse[];

    // console.log("🚀 ~ file: notifications-store.ts:202 ~ useNotifications ~ alerts:", alerts);

    // const filteredNotifications = useMemo(
    //   () => notifications.filter(n => !n.disabled),
    //   [notifications]
    // );

    // const unreadCount = useMemo(
    //   () => filteredNotifications.filter(n => !n.read).length,
    //   [filteredNotifications]
    // );

    // const loading =
    //   notificationsQuery.isLoading ||
    //   configsQuery.isLoading ||
    //   alertsQuery.isLoading;

    // return useMemo(
    //   () => ({
    //     notifications: filteredNotifications,
    //     configs,
    //     alerts,
    //     loading,
    //     unreadCount,
    //     markAsRead: markAsReadMutation.mutate,
    //     markAllAsRead: markAllAsReadMutation.mutate,
    //     disableNotificationType: (id: string) => {
    //       console.log('Disabling notification type:', id);
    //     },
    //     updateConfig: updateConfigMutation.mutate,
    //     createAlert: createAlertMutation.mutate,
    //     updateAlert: updateAlertMutation.mutate,
    //     deleteAlert: deleteAlertMutation.mutate,
    //     toggleAlert: toggleAlertMutation.mutate,
    //   }),
    //   [
    //     filteredNotifications,
    //     configs,
    //     alerts,
    //     loading,
    //     unreadCount,
    //     markAsReadMutation.mutate,
    //     markAllAsReadMutation.mutate,
    //     updateConfigMutation.mutate,
    //     createAlertMutation.mutate,
    //     updateAlertMutation.mutate,
    //     deleteAlertMutation.mutate,
    //     toggleAlertMutation.mutate,
    //   ]
    // );
  }
);
