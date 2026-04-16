import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from './auth-store';
import * as api from '@/services/mock-api';

export const useSchoolingFolders = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  return useQuery({
    queryKey: ['schoolingFolders', accessToken],
    queryFn: () => api.fetchSchoolingFoldersApi(accessToken),
    enabled: authState.isAuthenticated && !!accessToken,
    staleTime: 1000 * 60 * 5,
  });
};

export const useSchoolingTransferInit = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';

  const mutation = useMutation({
    mutationFn: (request: api.SchoolingTransferInitRequest) =>
      api.schoolingTransferInitApi(accessToken, request),
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};

export const useSchoolingTransferConfirm = () => {
  const { authState } = useAuth();
  const accessToken = authState.accessToken || '';
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: api.SchoolingTransferConfirmRequest) =>
      api.schoolingTransferConfirmApi(accessToken, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      queryClient.invalidateQueries({ queryKey: ['accountMovements'] });
      queryClient.invalidateQueries({ queryKey: ['schoolingFolders'] });
      console.log('Schooling transfer completed successfully');
    },
  });

  return {
    ...mutation,
    isLoading: mutation.isPending,
  };
};
