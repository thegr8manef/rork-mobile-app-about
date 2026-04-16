import { ApiBillerListResponse } from './commonBillers.type';

export interface ContractSearchCriteria {
  searchCriteria: string;
  searchCriteriaValue: string;
}

export interface SavedContract {
  id: string;
  billerId: string;
  label: string;
  isFavorite: boolean;
  searchCriterias: ContractSearchCriteria[];
}

export type GetSavedContractsResponse = ApiBillerListResponse<SavedContract>;
