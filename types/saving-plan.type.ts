export type SavingsType = "MNT" | "PRC";
export type SavingPlanStatus = "ACTIVE" | "DISABLED";

export interface SavingPlan {
  savingsAccountId: string;
  cardId: string;
  dueDate: string;
  savingsType: "PRC" | "MNT";
  savingsAmount: number | null;
  savingsPercentage: number | null;
  maxSavingsAmount: number | null;
  subscriptionDate: string;
  savingsPlanId: string;
  accountId: string;
  status: "RE" | "VA" | "MO" | null;
}

export interface SavingPlansResponse {
  count: number;
  data: SavingPlan[];
}

export interface CreateSavingPlanRequest {
  savingsAccountId: string;
  cardId: string;
  accountId?: string;
  dueDate?: string;
  savingsType: SavingsType;
  savingsAmount: number | null;
  savingsPercentage: number | null;
  maxSavingsAmount: number;
  subscriptionDate: string;
}
export interface GlobalSavingPlanResponse {
  requestId: string;
}

export interface GlobalSavingPlanConfirmRequest {
  confirmationMethod: string;
  confirmationValue: string;
  requestId: string;
  challengeConfirmationValue?: GlobalSavingPlanChallengeConfirmationValue;
}
export type GlobalSavingPlanChallengeConfirmationValue = {
  deviceId: string;
  challengeId: string;
  proof: string;
};
export interface UpdateSavingPlanRequest {
  id: string;
  accountId?: string;
  cardId?: string;
  savingsAccountId: string;
  savingsType: SavingsType;
  savingsValue: number;
  maximumAmount: number;
  status: SavingPlanStatus;
  endDate: string;
}
