import { ApiBillerListResponse } from './commonBillers.type';

export interface BillerCategory {
  categoryCode: string;
  categoryLabel: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface SearchCriterion {
  id: number;
  label: SelectOption;
  type: string;
  groupId: string;
  groupLabel: string;
  options: SelectOption[];
  isRequired: string | null;
  showInFormCondition: boolean;
  refRegexPattern?: string | null;
}

export interface Biller {
  id: string;
  label: string;
  type: string;
  category: BillerCategory;
  iconUrl: string;
  clientIdentityRequired: boolean | null;
  enabled: boolean;
  searchCriteria: SearchCriterion[];
}

export type GetBillersResponse = ApiBillerListResponse<Biller>;
