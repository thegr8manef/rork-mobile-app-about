import { AlertsListResponse } from "@/types/notification.type";

export const FALLBACK_ALERTS: AlertsListResponse = {
  count: 3,
  date: [
    {
      id: "d122011c-260a-4bf2-b5cf-d386a5eeb3ec",
      accountId: "924fd811-54a6-4fee-bc59-ee67446a92a9",
      type: "overMvtC",
      minAmount: 100,
      maxAmount: 200,
      startDate: "2025-11-07",
      endDate: "2032-01-07",
      receptionChannels: ["email"],
      enabled: false,
      contactDetails: {
        mail: null,
        telNumber: null,
      },
    },
    {
      id: "a7bbf221-5a46-4f6f-9f40-2208acb90b11",
      accountId: "924fd811-54a6-4fee-bc59-ee67446a92a9",
      type: "overMvtC",
      minAmount: 50,
      maxAmount: 120,
      startDate: "2025-10-01",
      endDate: "2030-01-01",
      receptionChannels: ["push"],
      enabled: true,
      contactDetails: {
        mail: null,
        telNumber: null,
      },
    },
    {
      id: "31f9a0f4-7dd5-4a5d-9f9c-c813fd4c5cc",
      accountId: "924fd811-54a6-4fee-bc59-e67446a92a9",
      type: "overMvtC",
      minAmount: 200,
      maxAmount: 400,
      startDate: "2026-01-01",
      endDate: "2033-12-31",
      receptionChannels: ["email", "push"],
      enabled: true,
      contactDetails: {
        mail: null,
        telNumber: null,
      },
    },
  ],
};
