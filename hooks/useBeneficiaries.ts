import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-store';
import * as api from '@/services/mock-api';
import { Beneficiary } from '@/types/banking';

export const useBeneficiaries = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  return useQuery({
    queryKey: ['beneficiaries', accessToken],
    queryFn: () => api.fetchBeneficiariesApi(accessToken),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};

export const useBeneficiaryAddInit = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  return useMutation({
    mutationFn: (request: api.BeneficiaryAddInitRequest) =>
      api.beneficiaryAddInitApi(accessToken, request),
  });
};

export const useBeneficiaryAddConfirm = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: api.BeneficiaryAddConfirmRequest) =>
      api.beneficiaryAddConfirmApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      console.log('Beneficiary added successfully');
    },
  });
};


export const useBeneficiaryDeleteConfirm = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: api.BeneficiaryDeleteConfirmRequest) =>
      api.beneficiaryDeleteConfirmApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      console.log('Beneficiary deleted successfully');
    },
  });
};

export const useAddBeneficiary = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<Beneficiary, 'id' | 'addedDate' | 'isFrequent'>) =>
      api.createBeneficiaryApi(accessToken, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      console.log('Beneficiary added successfully');
    },
    onError: (error: any) => {
  console.error("Beneficiary add failed", error?.response?.data || error);
}
  });
};


export const useDeleteBeneficiary = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (beneficiaryId: string) =>
      api.deleteBeneficiaryApi(accessToken, beneficiaryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaries'] });
      console.log('Beneficiary deleted successfully');
    },
  });
};
