// import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useMemo, useCallback } from 'react';
// import createContextHook from '@nkzw/create-context-hook';
// import { Biller, BillerContract, Bill, BillPayment } from '@/types/billers';
// import { useAuth } from './auth-store';
// import * as api from '@/services/mock-api';
// import { fetchBillersApi, fetchBillerContractsApi, fetchBillPaymentsApi } from '@/services/billers.api';

// export const [BillersProvider, useBillers] = createContextHook(() => {
//   const { authState } = useAuth();
//   const accessToken = authState.accessToken || '';
//   const queryClient = useQueryClient();

//   const billersQuery = useQuery({
//     queryKey: ['billers', accessToken],
//     queryFn: () => fetchBillersApi(accessToken),
//     enabled: !!accessToken,
//     staleTime: 1000 * 60 * 30,
//   });

//   const contractsQuery = useQuery({
//     queryKey: ['billerContracts', accessToken],
//     queryFn: () => fetchBillerContractsApi(accessToken),
//     enabled: !!accessToken,
//     staleTime: 1000 * 60 * 5,
//   });

//   const favoriteContractsQuery = useQuery({
//     queryKey: ['billerContracts', 'favorites', accessToken],
//     queryFn: () => fetchBillerContractsApi(accessToken, true),
//     enabled: !!accessToken,
//     staleTime: 1000 * 60 * 5,
//   });



//   const recentPaymentsQuery = useQuery({
//     queryKey: ['billPayments', 'recent', accessToken],
//     queryFn: async () => {
//       console.log('🔍 Fetching recent bill payments...');
//       const result = await fetchBillPaymentsApi(accessToken, 1, 10);
//       console.log('✅ Recent bill payments fetched:', result.count, 'payments');
//       return result;
//     },
//     enabled: !!accessToken,
//     staleTime: 1000 * 60 * 5,
//   });

//   const addContractMutation = useMutation({
//     mutationFn: (contract: Omit<BillerContract, 'id' | 'createdAt'>) => 
//       api.createBillerContractApi(accessToken, contract),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['billerContracts'] });
//       console.log('Contract added successfully');
//     },
//   });

//   const updateContractMutation = useMutation({
//     mutationFn: ({ contractId, updates }: { contractId: string; updates: Partial<BillerContract> }) => 
//       api.updateBillerContractApi(accessToken, contractId, updates),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['billerContracts'] });
//       console.log('Contract updated successfully');
//     },
//   });

//   const deleteContractMutation = useMutation({
//     mutationFn: (contractId: string) => 
//       api.deleteBillerContractApi(accessToken, contractId),
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ['billerContracts'] });
//       console.log('Contract deleted successfully');
//     },
//   });



//   const billers = useMemo(() => (billersQuery.data || []) as Biller[], [billersQuery.data]);
//   const contracts = useMemo(() => (contractsQuery.data || []) as BillerContract[], [contractsQuery.data]);
//   const favoriteContracts = useMemo(() => (favoriteContractsQuery.data || []) as BillerContract[], [favoriteContractsQuery.data]);
//   const recentPayments = useMemo(() => {
//     const paymentsData = (recentPaymentsQuery.data?.data || []) as BillPayment[];
//     console.log('💳 Recent payments in store:', paymentsData.length);
//     return paymentsData;
//   }, [recentPaymentsQuery.data]);

//   const isLoading = billersQuery.isLoading || contractsQuery.isLoading || recentPaymentsQuery.isLoading;
//   const isLoadingFavorites = favoriteContractsQuery.isLoading;

//   const getBillerById = useMemo(() => 
//     (billerId: string) => billers.find(b => b.id === billerId),
//     [billers]
//   );

//   const getContractsByBiller = useMemo(() => 
//     (billerId: string) => contracts.filter(c => c.billerId === billerId),
//     [contracts]
//   );



//   const getPaymentsByBiller = useMemo(() => 
//     (billerId: string) => recentPayments.filter(p => p.billerId === billerId),
//     [recentPayments]
//   );

//   const getFavoriteContracts = useMemo(() => 
//     () => favoriteContracts,
//     [favoriteContracts]
//   );

//   const addContractMutate = addContractMutation.mutate;
//   const updateContractMutate = updateContractMutation.mutate;
//   const deleteContractMutate = deleteContractMutation.mutate;

//   const toggleFavorite = useCallback((contractId: string) => {
//     const contract = contracts.find(c => c.id === contractId);
//     if (contract) {
//       updateContractMutate({ 
//         contractId, 
//         updates: { isFavorite: !contract.isFavorite } 
//       });
//     }
//   }, [contracts, updateContractMutate]);

//   const addContract = useCallback((contract: Omit<BillerContract, 'id' | 'createdAt'>) => {
//     addContractMutate(contract);
//   }, [addContractMutate]);

//   const updateContract = useCallback((contractId: string, updates: Partial<BillerContract>) => {
//     updateContractMutate({ contractId, updates });
//   }, [updateContractMutate]);

//   const deleteContract = useCallback((contractId: string) => {
//     deleteContractMutate(contractId);
//   }, [deleteContractMutate]);



//   return useMemo(() => ({
//     billers,
//     contracts,
//     favoriteContracts,
//     recentPayments,
//     isLoading,
//     isLoadingFavorites,
//     billersQuery,
//     contractsQuery,
//     recentPaymentsQuery,
//     addContract,
//     updateContract,
//     deleteContract,
//     toggleFavorite,
//     getBillerById,
//     getContractsByBiller,
//     getPaymentsByBiller,
//     getFavoriteContracts,
//   }), [
//     billers,
//     contracts,
//     favoriteContracts,
//     recentPayments,
//     isLoading,
//     isLoadingFavorites,
//     billersQuery,
//     contractsQuery,
//     recentPaymentsQuery,
//     addContract,
//     updateContract,
//     deleteContract,
//     toggleFavorite,
//     getBillerById,
//     getContractsByBiller,
//     getPaymentsByBiller,
//     getFavoriteContracts,
//   ]);
// });
