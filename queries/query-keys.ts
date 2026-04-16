import { SearchBillsParams } from "@/types/billers.type";

export const queryKeys = {
  billers: {
    all: ['billers'] as const,
    payments: ['billers', 'payments'] as const,
    paymentObjects: (params: SearchBillsParams) =>
      ['billers', 'paymentObjects', params] as const,
  },

  contracts: {
    all: ['contracts'] as const,
    favorites: (isFavorite?: boolean) =>
      ['contracts', 'favorites', isFavorite] as const,
  },
};

