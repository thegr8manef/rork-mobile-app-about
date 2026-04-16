// src/queries/billers.queries.ts
import { useQuery } from "@tanstack/react-query";
import {
  getAllPaymentsBillersApi,
  getAllPaymentsApi,
  searchPaymentObjectsApi,
  GetPaymentObjectsParams,
} from "@/services/billers1.api";
import { queryKeys } from "./query-keys";

/* ---------------- BILLERS LIST ---------------- */

export const useGetAllPaymentsBillers = () =>
  useQuery({
    queryKey: queryKeys.billers.all,
    queryFn: getAllPaymentsBillersApi,
    staleTime: 1000 * 60 * 5,
  });

/* ---------------- PAYMENTS LIST ---------------- */

export const useGetAllPayments = () =>
  useQuery({
    queryKey: queryKeys.billers.payments,
    queryFn: getAllPaymentsApi,
    staleTime: 1000 * 60 * 5,
  });

/* ---------------- PAYMENT OBJECTS SEARCH ---------------- */

export const useSearchPaymentObjects = (
  params: GetPaymentObjectsParams
) =>
  useQuery({
    queryKey: queryKeys.billers.paymentObjects(params),
    queryFn: () => searchPaymentObjectsApi(params),
    enabled: !!params.billerId,
    //keepPreviousData: true,
  });
