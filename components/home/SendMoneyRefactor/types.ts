export type TransferType = "ponctuel" | "permanent";

export type Frequency =
  | "hebdomadaire"
  | "mensuelle"
  | "trimestrielle"
  | "semestrielle"
  | "annuelle";

export type FormValues = {
  amount: string;
  executionDate: Date;
  endDate?: Date;
  description: string;
};
