export type Currency = {
  alphaCode: string;         
  numericCode: number;       
  designation: string;       
};

export type MovementSide = "C" | "D";

export type AccountMovement = {
  movementNumber: number;
  ledgerDate: string;        
  valueDate: string;         
  amount: string;           
  currency: Currency;
  movementSide: MovementSide;
  eventOperation: string;
  operationNature: string;
  additionalDescription: string | null;
  additionalInformations: string | null;
};

export type MovementsResponse = {
  count: number;
  data: AccountMovement[];
};
