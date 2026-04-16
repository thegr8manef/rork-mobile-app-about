import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-store';
import * as api from '@/services/mock-api';
import { ReloadCardInitRequest } from '@/types/card.type';

export const usePayBillerInit = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  const mutation = useMutation({
    mutationFn: (request: api.BillPaymentInitRequest) =>
      api.billPaymentInitApi(accessToken, request),
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const usePayBillerConfirm = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: api.BillPaymentConfirmRequest) =>
      api.billPaymentConfirmApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountMovements'] });
      queryClient.invalidateQueries({ queryKey: ['bills'] });
      queryClient.invalidateQueries({ queryKey: ['billPayments'] });
      console.log('Bill payment completed successfully');
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const useReloadCardInit = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  const mutation = useMutation({
    mutationFn: (request: ReloadCardInitRequest) =>
      api.reloadCardInitApi(accessToken, request),
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const useReloadCardConfirm = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: api.ReloadCardConfirmRequest) =>
      api.reloadCardConfirmApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountMovements'] });
      queryClient.invalidateQueries({ queryKey: ['cards'] });
      console.log('Card reloaded successfully');
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};
