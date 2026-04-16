export type SecuritiesAccountItem = {
  accountNumber: string;
};

export type PortfolioApiRow = {
  securitiesAccount: string;
  valueCode: string;
  label: string;
  quantity: number;
  blockedQuantity: number;
  marketPrice: number;
  lastPriceEstimate: number;
  lastPriceEstimateDate: string; // "03-04-2025"
  unitCostPrice: number;
  costPriceEstimate: number;
  latentProfitLoss: number;
};

/** UI model (what your screen uses) */
export type PortfolioRow = {
  id: string;
  accountId: string;
  codeValeur: string;
  valeur: string;
  quantite: number;
  quantiteBloquee: number;
  coursBoursierTnd: number;
  prixRevientUnitaireTnd: number;
  lastPriceEstimate?: number;
  costPriceEstimate?: number;
  latentProfitLoss?: number;
  lastPriceEstimateDate?: string;
};
