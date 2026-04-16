const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const API_DELAY = 800;
const API_DELAY_CARDS = 2000;
const API_DELAY_ACCOUNTS = 1800;
const API_DELAY_TRANSACTIONS = 1500;

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  customerCode: string;
}

export interface AccountType {
  code: string;
  designation: string;
}

export interface Currency {
  alphaCode: string;
  numericCode: number;
  designation: string;
  numberOfDecimals: number | null;
}

export interface Branch {
  code: string;
  designation: string;
  address: string | null;
}

export interface OverDraftAuthorization {
  overDraftLimitValue: string;
  expiryDate: string;
}

export interface AuthorizedOperations {
  code: string;
  designation: string;
}

export interface AccountClass {
  code: number;
  designation: string;
}

export interface Customer {
  customerNumber: string;
  displayName: string;
}

export interface Stoppage {
  StoppageCode: string | null;
  StoppageLabel: string | null;
  StoppageStartDate: string | null;
  StoppageEndDate: string | null;
  StoppageStatus: string | null;
  stoppageReason: string;
  stoppageEndReason: string;
}

export interface AccountDetail {
  id: string;
  accountType: AccountType;
  indicativeBalance: string;
  availableBalance: string;
  accountingBalance: string;
  ribFormatAccount: string;
  designationProduct: string | null;
  ibanFormatAccount: string;
  currencyAccount: Currency;
  accountTitle: string;
  branch: Branch;
  accountStatus: string;
  accountNumber: string;
  overDraftAuthorization: OverDraftAuthorization;
  authorizedOperations: AuthorizedOperations;
  lastMovementDate: string;
  lastCreditDate: string;
  lastDebitDate: string;
  customerCode: string;
  billingAccount: string | null;
  billingAmount: string | null;
  accountManager: string | null;
  fundReservation: string;
  transferredAccountFrom: string | null;
  transferredAccountTo: string | null;
  accountClass: AccountClass;
  customer: Customer;
  stoppage: Stoppage[];
}

export interface AccountsResponse {
  data: AccountDetail[];
  count: number;
}

export interface Movement {
  movementNumber: number;
  ledgerDate: string;
  valueDate: string;
  amount: string;
  currency: {
    alphaCode: string;
    numericCode: number;
    designation: string;
  };
  movementSide: 'D' | 'C';
  eventOperation: string;
  operationNature: string;
  additionalDescription: string | null;
  additionalInformations: string | null;
}

export interface MovementsResponse {
  data: Movement[];
  count: number;
}

export interface MovementsRequest {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  operationNature?: 'D' | 'C';
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  isUnauthorized(): boolean {
    return this.statusCode === 401 || this.statusCode === 403;
  }
}

const mockToken = 'mock_access_token_123456789';
const mockCustomerCode = 'cus_01875968';

const mockAccountData: AccountDetail = {
  id: "acc_00201_0088435110_788",
  accountType: {
    code: "027",
    designation: "DEPOTS A VUE EN TND PERSONNEL"
  },
  indicativeBalance: "-7069.934",
  availableBalance: "503.066",
  accountingBalance: "-2953.705",
  ribFormatAccount: "04133201008843511051",
  designationProduct: null,
  ibanFormatAccount: "TN5904133201008843511051",
  currencyAccount: {
    alphaCode: "TND",
    numericCode: 788,
    designation: "DINAR TUNISIEN",
    numberOfDecimals: null
  },
  accountTitle: "DEPOTS A VUE EN TND PERSONNEL",
  branch: {
    code: "00201",
    designation: "AGENCE ATTIJARI PERSO",
    address: null
  },
  accountStatus: "O",
  accountNumber: "0088435110",
  overDraftAuthorization: {
    overDraftLimitValue: "7573",
    expiryDate: "2099-12-31"
  },
  authorizedOperations: {
    code: "authorized operations code",
    designation: "authorized operations designation"
  },
  lastMovementDate: "2025-03-04",
  lastCreditDate: "2025-02-27",
  lastDebitDate: "2025-03-04",
  customerCode: mockCustomerCode,
  billingAccount: null,
  billingAmount: null,
  accountManager: null,
  fundReservation: "0.000",
  transferredAccountFrom: null,
  transferredAccountTo: null,
  accountClass: {
    code: 26111011,
    designation: "DEPOTS A VUE EN TND PERSONNEL"
  },
  customer: {
    customerNumber: "01875968",
    displayName: "ZOUBEIDI MOHAMED AYOUB"
  },
  stoppage: [
    {
      StoppageCode: null,
      StoppageLabel: null,
      StoppageStartDate: null,
      StoppageEndDate: null,
      StoppageStatus: null,
      stoppageReason: "FIAB2J10 11:21",
      stoppageEndReason: "CLIENT FIABILISEE PROD3J5 09:04"
    },
    {
      StoppageCode: null,
      StoppageLabel: null,
      StoppageStartDate: null,
      StoppageEndDate: null,
      StoppageStatus: null,
      stoppageReason: " ",
      stoppageEndReason: "R"
    }
  ]
};


const mockAccountData2: AccountDetail = {
  id: "acc_00202_0088435111_788",
  accountType: {
    code: "027",
    designation: "DEPOTS A VUE EN TND PERSONNEL"
  },
  indicativeBalance: "7069.934",
  availableBalance: "503.066",
  accountingBalance: "2953.705",
  ribFormatAccount: "04133201008843511051",
  designationProduct: null,
  ibanFormatAccount: "TN5904133201008843511051",
  currencyAccount: {
    alphaCode: "TND",
    numericCode: 788,
    designation: "DINAR TUNISIEN",
    numberOfDecimals: null
  },
  accountTitle: "DEPOTS A VUE EN TND PERSONNEL",
  branch: {
    code: "00201",
    designation: "AGENCE ATTIJARI PERSO",
    address: null
  },
  accountStatus: "O",
  accountNumber: "0088435110",
  overDraftAuthorization: {
    overDraftLimitValue: "7573",
    expiryDate: "2099-12-31"
  },
  authorizedOperations: {
    code: "authorized operations code",
    designation: "authorized operations designation"
  },
  lastMovementDate: "2025-03-04",
  lastCreditDate: "2025-02-27",
  lastDebitDate: "2025-03-04",
  customerCode: mockCustomerCode,
  billingAccount: null,
  billingAmount: null,
  accountManager: null,
  fundReservation: "0.000",
  transferredAccountFrom: null,
  transferredAccountTo: null,
  accountClass: {
    code: 26111011,
    designation: "DEPOTS A VUE EN TND PERSONNEL"
  },
  customer: {
    customerNumber: "01875968",
    displayName: "ZOUBEIDI MOHAMED AYOUB"
  },
  stoppage: [
    {
      StoppageCode: null,
      StoppageLabel: null,
      StoppageStartDate: null,
      StoppageEndDate: null,
      StoppageStatus: null,
      stoppageReason: "FIAB2J10 11:21",
      stoppageEndReason: "CLIENT FIABILISEE PROD3J5 09:04"
    },
    {
      StoppageCode: null,
      StoppageLabel: null,
      StoppageStartDate: null,
      StoppageEndDate: null,
      StoppageStatus: null,
      stoppageReason: " ",
      stoppageEndReason: "R"
    }
  ]
}

const mockMovements: Movement[] = [
  {
    movementNumber: 0,
    ledgerDate: "2025-03-05",
    valueDate: "2025-03-05",
    amount: "1.000",
    currency: {
      alphaCode: "TND",
      numericCode: 788,
      designation: "DINAR TUNISIEN"
    },
    movementSide: "D",
    eventOperation: "VIR IAG A DISTANCE",
    operationNature: "VIREMENT AGENCE HORS PLACE",
    additionalDescription: null,
    additionalInformations: null
  },
  {
    movementNumber: 0,
    ledgerDate: "2025-03-05",
    valueDate: "2025-03-05",
    amount: "1.000",
    currency: {
      alphaCode: "TND",
      numericCode: 788,
      designation: "DINAR TUNISIEN"
    },
    movementSide: "D",
    eventOperation: "VIR IAG A DISTANCE",
    operationNature: "VIREMENT AGENCE HORS PLACE",
    additionalDescription: null,
    additionalInformations: null
  },
  {
    movementNumber: 0,
    ledgerDate: "2025-03-04",
    valueDate: "2025-03-04",
    amount: "150.500",
    currency: {
      alphaCode: "TND",
      numericCode: 788,
      designation: "DINAR TUNISIEN"
    },
    movementSide: "C",
    eventOperation: "VIREMENT RECU",
    operationNature: "VIREMENT",
    additionalDescription: "Salary payment",
    additionalInformations: null
  },
  {
    movementNumber: 0,
    ledgerDate: "2025-03-03",
    valueDate: "2025-03-03",
    amount: "45.250",
    currency: {
      alphaCode: "TND",
      numericCode: 788,
      designation: "DINAR TUNISIEN"
    },
    movementSide: "D",
    eventOperation: "RETRAIT GAB",
    operationNature: "RETRAIT",
    additionalDescription: null,
    additionalInformations: null
  },
  {
    movementNumber: 0,
    ledgerDate: "2025-03-02",
    valueDate: "2025-03-02",
    amount: "28.750",
    currency: {
      alphaCode: "TND",
      numericCode: 788,
      designation: "DINAR TUNISIEN"
    },
    movementSide: "D",
    eventOperation: "PAIEMENT CB",
    operationNature: "ACHAT",
    additionalDescription: "Restaurant Le Gourmet",
    additionalInformations: null
  }
];

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function loginApi(request: LoginRequest): Promise<LoginResponse> {
  console.log('Mock API: Login request', { username: request.username });
  
  await delay(API_DELAY);

  if (request.username === '97873291' && request.password === '58671198') {
    console.log('Mock API: Login successful');
    return {
      accessToken: mockToken,
      customerCode: mockCustomerCode
    };
  }

  console.error('Mock API: Invalid credentials');
  throw new ApiError(401, 'Invalid username or password');
}

export async function getCustomerAccounts(accessToken: string): Promise<AccountsResponse> {
  console.log('Mock API: Fetching customer accounts');
  
  await delay(API_DELAY_ACCOUNTS);

  if (!accessToken ) {
    console.error('Mock API: Unauthorized access');
    throw new ApiError(401, 'Unauthorized - Invalid or missing access token');
  }

  // console.log('Mock API: Returning accounts data');
  return {
    data: [mockAccountData, mockAccountData2],
    count: 2
  };
}

export async function getAccountMovements(
  accountId: string,
  accessToken: string,
  params?: MovementsRequest
): Promise<MovementsResponse> {
  // console.log('Mock API: Fetching account movements', { accountId, params });
  
  await delay(API_DELAY);

  if (!accessToken ) {
    console.error('Mock API: Unauthorized access');
    throw new ApiError(401, 'Unauthorized - Invalid or missing access token');
  }

  let filteredMovements = [...mockMovements];

  if (params?.operationNature) {
    filteredMovements = filteredMovements.filter(
      m => m.movementSide === params.operationNature
    );
  }

  if (params?.minAmount !== undefined) {
    filteredMovements = filteredMovements.filter(
      m => parseFloat(m.amount) >= params.minAmount!
    );
  }

  if (params?.maxAmount !== undefined) {
    filteredMovements = filteredMovements.filter(
      m => parseFloat(m.amount) <= params.maxAmount!
    );
  }

  if (params?.startDate) {
    filteredMovements = filteredMovements.filter(
      m => m.ledgerDate >= params.startDate!
    );
  }

  if (params?.endDate) {
    filteredMovements = filteredMovements.filter(
      m => m.ledgerDate <= params.endDate!
    );
  }

  const page = params?.page || 0;
  const limit = params?.limit || 50;
  const start = page * limit;
  const paginatedMovements = filteredMovements.slice(start, start + limit);

  // console.log('Mock API: Returning movements', { count: paginatedMovements.length });
  return {
    data: paginatedMovements,
    count: filteredMovements.length
  };
}

export async function getAccountDetails(
  accountId: string,
  accessToken: string
): Promise<AccountDetail> {
  // console.log('Mock API: Fetching account details', { accountId });
  
  await delay(API_DELAY);

  if (!accessToken ) {
    console.error('Mock API: Unauthorized access');
    throw new ApiError(401, 'Unauthorized - Invalid or missing access token');
  }

  // console.log('Mock API: Returning account details');
  return mockAccountData;
}

export async function fetchBeneficiariesApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching beneficiaries');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockBeneficiaries } = await import('@/mocks/banking-data');
  // console.log('Mock API: Returning beneficiaries', { count: mockBeneficiaries.length });
  return mockBeneficiaries;
}

export interface BeneficiaryAddInitRequest {
  name: string;
  accountNumber: string;
  bankName: string;
}

export interface BeneficiaryAddInitResponse {
  requestId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  status: 'INIT';
  createdAt: string;
}

export interface BeneficiaryAddConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface BeneficiaryAddConfirmResponse {
  requestId: string;
  beneficiaryId: string;
  name: string;
  accountNumber: string;
  bankName: string;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
}

export async function beneficiaryAddInitApi(
  accessToken: string,
  request: BeneficiaryAddInitRequest
): Promise<BeneficiaryAddInitResponse> {
  // console.log('Mock API: Initiating beneficiary add', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailValidation = Math.random() < 0.05;
  if (shouldFailValidation) {
    throw new ApiError(400, 'Invalid beneficiary request', {
      errorCode: 'INVALID_RIB',
      message: 'Le RIB fourni est invalide',
    });
  }

  const requestId = `benef_add_req_${Date.now()}`;

  const response: BeneficiaryAddInitResponse = {
    requestId,
    name: request.name,
    accountNumber: request.accountNumber,
    bankName: request.bankName,
    status: 'INIT',
    createdAt: new Date().toISOString(),
  };

  // console.log('Mock API: Beneficiary add initiated', { requestId });
  return response;
}

export async function beneficiaryAddConfirmApi(
  accessToken: string,
  request: BeneficiaryAddConfirmRequest
): Promise<BeneficiaryAddConfirmResponse> {
  // console.log('Mock API: Confirming beneficiary add', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const response: BeneficiaryAddConfirmResponse = {
    requestId: request.requestId,
    beneficiaryId: `ben_${Date.now()}`,
    name: 'John Doe',
    accountNumber: '12345678901234567890',
    bankName: 'Amen Bank',
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
  };

  // console.log('Mock API: Beneficiary add confirmed', { requestId: request.requestId });
  return response;
}

export interface BeneficiaryDeleteInitRequest {
  beneficiaryId: string;
}

export interface BeneficiaryDeleteInitResponse {
  requestId: string;
  beneficiaryId: string;
  status: 'INIT';
  createdAt: string;
}

export interface BeneficiaryDeleteConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface BeneficiaryDeleteConfirmResponse {
  requestId: string;
  beneficiaryId: string;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
}



export async function beneficiaryDeleteConfirmApi(
  accessToken: string,
  request: BeneficiaryDeleteConfirmRequest
): Promise<BeneficiaryDeleteConfirmResponse> {
  // console.log('Mock API: Confirming beneficiary delete', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const response: BeneficiaryDeleteConfirmResponse = {
    requestId: request.requestId,
    beneficiaryId: 'ben_123',
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
  };

  // console.log('Mock API: Beneficiary delete confirmed', { requestId: request.requestId });
  return response;
}

export async function createBeneficiaryApi(accessToken: string, data: any): Promise<any> {
  // console.log('Mock API: Creating beneficiary', data);
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const newBeneficiary = {
    ...data,
    id: `ben_${Date.now()}`,
    addedDate: new Date().toISOString(),
    isFrequent: false,
  };

  // console.log('Mock API: Beneficiary created', { id: newBeneficiary.id });
  return newBeneficiary;
}

export async function deleteBeneficiaryApi(accessToken: string, beneficiaryId: string): Promise<void> {

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Beneficiary deleted');
}

export interface CardsApiResponse {
  count: number;
  data: any[];
}

export async function fetchCardsApi(accessToken: string): Promise<CardsApiResponse> {
  // console.log('Mock API: Fetching cards');
  await delay(API_DELAY_CARDS);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const mockCardsData = [
    {
      id: "card_49854861_13600580",
      cardCode: "49854861",
      pcipan: "549492******5577",
      namePrinted: "BAKHOUCH IYED",
      product: {
        code: "63821",
        description: "8DIGIT Carte Gold Nationale Personnel niv-1"
      },
      numTel: "+21694640111",
      expiryDate: "2028-05-28T05:07:56",
      cardStatus: {
        activation: "1",
        opposition: "1",
        perso: "4"
      },
      accounts: [
        {
          accountNumber: "2010062599089",
          available: "855.542",
          typeAvailable: "1",
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: "TND"
          },
          accountType: "1",
          accountStatus: "1",
          accountCheck: "0"
        }
      ],
      limits: [
        {
          typetrx: 0,
          periodicity: 1,
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: ""
          },
          currentLimit: 1500.0,
          maxLimit: 1000.0,
          remaing: 1499.8
        },
        {
          typetrx: 1,
          periodicity: 1,
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: ""
          },
          currentLimit: 1500.0,
          maxLimit: 500.0,
          remaing: 1500.0
        }
      ],
      globalLimit: 1500,
      globalRemaining: 1499,
      international: false
    },
    {
      id: "card_50035641_13600580",
      cardCode: "50035641",
      pcipan: "456782******6683",
      namePrinted: "iyed bakhouch",
      product: {
        code: "71881",
        description: "Carte Signature Cadres ABT"
      },
      numTel: "+21694640111",
      expiryDate: "2027-07-03T07:13:20",
      cardStatus: {
        activation: "0",
        opposition: "1",
        perso: "1"
      },
      accounts: [
        {
          accountNumber: "2010062599089",
          available: "855.542",
          typeAvailable: "1",
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: "TND"
          },
          accountType: "1",
          accountStatus: "1",
          accountCheck: "0"
        }
      ],
      limits: [
        {
          typetrx: 0,
          periodicity: 1,
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: ""
          },
          currentLimit: 15000.0,
          maxLimit: 15000.0,
          remaing: 12000.0
        },
        {
          typetrx: 1,
          periodicity: 1,
          currency: {
            alphaCode: "TND",
            numericCode: 788,
            designation: ""
          },
          currentLimit: 15000.0,
          maxLimit: 15000.0,
          remaing: 13500.0
        }
      ],
      globalLimit: 15000,
      globalRemaining: 12000,
      international: true
    }
  ];

  // console.log('Mock API: Returning cards', { count: mockCardsData.length });
  return {
    count: mockCardsData.length,
    data: mockCardsData
  };
}

export async function toggleCardStatusApi(accessToken: string, cardId: string, isActive: boolean): Promise<any> {
  // console.log('Mock API: Toggling card status', { cardId, isActive });
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Card status updated');
  return { id: cardId, isActive };
}

export interface CardTransactionsApiResponse {
  count: number;
  data: any[];
}

export async function fetchCardTransactionsApi(
  accessToken: string,
  cardId: string,
  startDate?: string,
  endDate?: string
): Promise<CardTransactionsApiResponse> {
  // console.log('Mock API: Fetching card transactions', { cardId, startDate, endDate });
  await delay(API_DELAY_TRANSACTIONS);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const mockTransactions = [
    {
      amount: 1.0,
      currency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      datetime: "2024-05-24T14:03:25",
      shortLabel: "Goods/Service Purchase",
      transactionRef: "000242067673",
      authCode: 414514950594,
      status: {
        code: "0",
        description: "EN ATTENTE DE VALIDATION"
      },
      convertedAmount: 1.0,
      accountCurrency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      label: "BOUTIQUE_TEST_ATB     >TUNIS        >TUN",
      action: 0
    },
    {
      amount: 1.9,
      currency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      datetime: "2024-05-24T13:50:23",
      shortLabel: "Goods/Service Purchase",
      transactionRef: "000242066461",
      authCode: 414513950593,
      status: {
        code: "0",
        description: "EN ATTENTE DE VALIDATION"
      },
      convertedAmount: 1.9,
      accountCurrency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      label: "BOUTIQUE_TEST_ATB     >TUNIS        >TUN",
      action: 0
    },
    {
      amount: 45.5,
      currency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      datetime: "2024-05-20T10:30:00",
      shortLabel: "ATM Withdrawal",
      transactionRef: "000242055432",
      authCode: 414512950591,
      status: {
        code: "1",
        description: "VALIDÉE"
      },
      convertedAmount: 45.5,
      accountCurrency: {
        alphaCode: "TND",
        numericCode: 788,
        designation: "TND"
      },
      label: "ATM WITHDRAWAL CARTHAGE",
      action: 1
    }
  ];

  // console.log('Mock API: Returning card transactions', { count: mockTransactions.length });
  return {
    count: mockTransactions.length,
    data: mockTransactions
  };
}

export async function createTransferApi(accessToken: string, data: any): Promise<any> {
  // console.log('Mock API: Creating transfer', data);
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const transaction = {
    id: `txn_${Date.now()}`,
    ...data,
    date: new Date().toISOString(),
    status: 'completed',
  };

  // console.log('Mock API: Transfer created', { id: transaction.id });
  return transaction;
}




export async function fetchAccountsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching accounts');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockAccounts } = await import('@/mocks/banking-data');
  // console.log('Mock API: Returning accounts', { count: mockAccounts.length });
  return mockAccounts;
}

export async function fetchLoansApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching loans');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockLoans } = await import('@/mocks/banking-data');
  // console.log('Mock API: Returning loans', { count: mockLoans.length });
  return mockLoans;
}

export async function fetchLoanPaymentsApi(accessToken: string, loanId: string): Promise<any[]> {
  // console.log('Mock API: Fetching loan payments', { loanId });
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockLoanPayments } = await import('@/mocks/banking-data');
  const filtered = mockLoanPayments.filter(p => p.loanId === loanId);
  
  // console.log('Mock API: Returning loan payments', { count: filtered.length });
  return filtered;
}

export async function fetchSchoolingFoldersApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching schooling folders');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockSchoolingFolders } = await import('@/mocks/schooling-data');
  // console.log('Mock API: Returning schooling folders', { count: mockSchoolingFolders.length });
  return mockSchoolingFolders;
}

export async function createSchoolingTransferApi(accessToken: string, data: any): Promise<any> {
  // console.log('Mock API: Creating schooling transfer', data);
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const transfer = {
    id: `schl_${Date.now()}`,
    ...data,
    date: new Date().toISOString(),
    status: 'completed',
  };

  // console.log('Mock API: Schooling transfer created', { id: transfer.id });
  return transfer;
}


export async function fetchBillersApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching billers');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockBillers } = await import('@/mocks/billers-data');
  // console.log('Mock API: Returning billers', { count: mockBillers.length });
  return mockBillers;
}

export async function fetchBillerContractsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching biller contracts');
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockContracts } = await import('@/mocks/billers-data');
  // console.log('Mock API: Returning contracts', { count: mockContracts.length });
  return mockContracts;
}

export async function createBillerContractApi(accessToken: string, data: any): Promise<any> {
  // console.log('Mock API: Creating biller contract', data);
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const contract = {
    ...data,
    id: `c${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  // console.log('Mock API: Contract created', { id: contract.id });
  return contract;
}

export async function updateBillerContractApi(accessToken: string, contractId: string, data: any): Promise<any> {
  // console.log('Mock API: Updating biller contract', { contractId, data });
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const updated = {
    id: contractId,
    ...data,
  };

  // console.log('Mock API: Contract updated');
  return updated;
}

export async function deleteBillerContractApi(accessToken: string, contractId: string): Promise<void> {
  // console.log('Mock API: Deleting biller contract', { contractId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Contract deleted');
}

export async function fetchBillsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching bills');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockBills } = await import('@/mocks/billers-data');
  // console.log('Mock API: Returning bills', { count: mockBills.length });
  return mockBills;
}

export async function payBillApi(accessToken: string, billId: string, accountId: string): Promise<any> {
  // console.log('Mock API: Paying bill', { billId, accountId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const payment = {
    id: `pay${Date.now()}`,
    billId,
    accountId,
    paymentDate: new Date().toISOString(),
    reference: `PAY-${Date.now()}`,
    status: 'success',
  };

  // console.log('Mock API: Bill payment created', { id: payment.id });
  return payment;
}

export async function fetchBillPaymentsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching bill payments');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockBillPayments } = await import('@/mocks/billers-data');
  // console.log('Mock API: Returning bill payments', { count: mockBillPayments.length });
  return mockBillPayments;
}

export async function fetchNotificationsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching notifications');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockNotifications } = await import('@/mocks/notifications-data');
  // console.log('Mock API: Returning notifications', { count: mockNotifications.length });
  return mockNotifications;
}

export async function markNotificationReadApi(accessToken: string, notificationId: string): Promise<void> {
  // console.log('Mock API: Marking notification as read', { notificationId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Notification marked as read');
}

export async function markAllNotificationsReadApi(accessToken: string): Promise<void> {
  // console.log('Mock API: Marking all notifications as read');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: All notifications marked as read');
}

export async function fetchNotificationConfigsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching notification configs');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockNotificationConfigs } = await import('@/mocks/notifications-data');
  // console.log('Mock API: Returning notification configs', { count: mockNotificationConfigs.length });
  return mockNotificationConfigs;
}

export async function updateNotificationConfigApi(accessToken: string, config: any): Promise<any> {
  // console.log('Mock API: Updating notification config', config);
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Notification config updated');
  return config;
}

export async function fetchChequesApi(accessToken: string, accountId?: string): Promise<any[]> {
  // console.log('Mock API: Fetching cheques', { accountId });
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockCheques } = await import('@/mocks/cheques-data');
  const filtered = accountId 
    ? mockCheques.filter(c => c.accountId === accountId)
    : mockCheques;

  // console.log('Mock API: Returning cheques', { count: filtered.length });
  return filtered;
}

export async function fetchBankingBillsApi(accessToken: string, accountId?: string): Promise<any[]> {
  // console.log('Mock API: Fetching banking bills', { accountId });
  await delay(API_DELAY);

  if (!accessToken ) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockBills } = await import('@/mocks/bills-data');
  const filtered = accountId 
    ? mockBills.filter(b => b.accountId === accountId)
    : mockBills;

  // console.log('Mock API: Returning banking bills', { count: filtered.length });
  return filtered;
}

export async function fetchAlertConfigsApi(accessToken: string): Promise<any[]> {
  // console.log('Mock API: Fetching alert configs');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const { mockAlertConfigs } = await import('@/mocks/notifications-data');
  // console.log('Mock API: Returning alert configs', { count: mockAlertConfigs.length });
  return mockAlertConfigs;
}

export async function createAlertConfigApi(accessToken: string, alert: any): Promise<any> {
  // console.log('Mock API: Creating alert config', alert);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const newAlert = {
    ...alert,
    id: `alert_${Date.now()}`,
    createdAt: new Date(),
  };

  // console.log('Mock API: Alert config created', { id: newAlert.id });
  return newAlert;
}

export async function updateAlertConfigApi(accessToken: string, alert: any): Promise<any> {
  // console.log('Mock API: Updating alert config', alert);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Alert config updated');
  return alert;
}

export async function deleteAlertConfigApi(accessToken: string, alertId: string): Promise<void> {
  // console.log('Mock API: Deleting alert config', { alertId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Alert config deleted');
}

export interface TransactionConfirmRequest {
  actionType: 'transfer' | 'beneficiary' | 'bill' | 'reload' | 'schooling';
  data: any;
  otp: string;
}

export interface TransactionConfirmResponse {
  success: boolean;
  transactionId: string;
  message: string;
  data: any;
}

export interface CardInfo {
  id: string;
  nameprinted: string;
  expirydate: string;
}

export interface CardApiResponse {
  count: number;
  data: CardInfo[];
}

const mockCardData: Record<string, CardInfo> = {
  '5304482910974890': {
    id: 'card_43469561_99999999',
    nameprinted: 'CHAOUCH AHMED',
    expirydate: '16/06/2027',
  },
  '1234567890123456': {
    id: 'card_12345678_11111111',
    nameprinted: 'ZOUBEIDI MOHAMED AYOUB',
    expirydate: '24/12/2026',
  },
  '9876543210987654': {
    id: 'card_98765432_22222222',
    nameprinted: 'BEN ALI FATMA',
    expirydate: '15/08/2028',
  },
};

export async function fetchCardByNumberApi(
  cardNumber: string,
  accessToken: string
): Promise<CardApiResponse> {
  // console.log('Mock API: Fetching card info', { cardNumber });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const cardInfo = mockCardData[cardNumber];

  if (cardInfo) {
    // console.log('Mock API: Card found', { cardNumber });
    return {
      count: 1,
      data: [cardInfo],
    };
  }

  // console.log('Mock API: Card not found', { cardNumber });
  return {
    count: 0,
    data: [],
  };
}

export async function confirmTransactionApi(
  accessToken: string,
  request: TransactionConfirmRequest
): Promise<TransactionConfirmResponse> {
  // console.log('Mock API: Confirming transaction', { actionType: request.actionType });
  await delay(API_DELAY_TRANSACTIONS);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFail = Math.random() < 0.2;

  if (shouldFail) {
    throw new ApiError(500, 'La transaction a échoué. Veuillez réessayer plus tard.');
  }

  const transactionId = `TXN${Date.now()}`;
  const response: TransactionConfirmResponse = {
    success: true,
    transactionId,
    message: 'Transaction effectuée avec succès',
    data: request.data,
  };

  // console.log('Mock API: Transaction confirmed', { transactionId });
  return response;
}

export async function updateCardLimitApi(
  accessToken: string,
  cardId: string,
  newLimit: string
): Promise<any> {
  // console.log('Mock API: Updating card limit', { cardId, newLimit });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Card limit updated successfully');
  return {
    cardId,
    newLimit,
    updatedAt: new Date().toISOString(),
  };
}

export async function cardActionApi(
  accessToken: string,
  cardId: string,
  action: 'activate' | 'disable' | 'resetPin'
): Promise<any> {
  // console.log('Mock API: Performing card action', { cardId, action });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: Card action completed successfully');
  return {
    cardId,
    action,
    status: 'success',
    updatedAt: new Date().toISOString(),
  };
}

export interface CardReloadRequest {
  amount: string;
  AccountDebtor: string;
}

export interface CardReloadResponse {
  id: string;
  status: string;
  amount: string;
  accountDebtor: string;
  cardId: string;
  cardNumber: string;
}

export async function reloadCardInitApi(
  accessToken: string,
  cardId: string,
  request: CardReloadRequest
): Promise<CardReloadResponse> {
  // console.log('Mock API: Initiating card reload', { cardId, request });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailCardType = Math.random() < 0.1;
  const shouldFailCardStatus = Math.random() < 0.1;

  if (shouldFailCardType) {
    throw new ApiError(400, 'Invalid card type', {
      error: { code: 'INVALID_CARD_TYPE' },
    });
  }

  if (shouldFailCardStatus) {
    throw new ApiError(400, 'Invalid card status', {
      error: { code: 'INVALID_CARD_STATUS' },
    });
  }

  const reloadId = `reload_${Date.now()}`;
  
  const cardInfo = Object.values(mockCardData)[0] || {
    id: cardId,
    nameprinted: 'Card Holder',
    expirydate: '12/2027',
  };

  // console.log('Mock API: Card reload initiated', { reloadId });
  return {
    id: reloadId,
    status: 'INIT',
    amount: request.amount,
    accountDebtor: request.AccountDebtor,
    cardId: cardInfo.id,
    cardNumber: cardId,
  };
}

export interface CardReloadConfirmRequest {
  confirmationType: string;
  confirmationValue: string;
}

export async function reloadCardConfirmApi(
  accessToken: string,
  cardId: string,
  reloadId: string,
  request: CardReloadConfirmRequest
): Promise<CardReloadResponse> {
  // console.log('Mock API: Confirming card reload', { cardId, reloadId, request });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      error: { code: 'INVALID_OTP' },
    });
  }

  const shouldFailSystem = Math.random() < 0.1;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      error: { code: 'SYSTEM_ERROR' },
    });
  }

  const cardInfo = Object.values(mockCardData)[0] || {
    id: cardId,
    nameprinted: 'Card Holder',
    expirydate: '12/2027',
  };

  // console.log('Mock API: Card reload confirmed', { reloadId });
  return {
    id: reloadId,
    status: 'EXECUTED',
    amount: '3000',
    accountDebtor: 'acc_001',
    cardId: cardInfo.id,
    cardNumber: cardId,
  };
}

export interface Activate3DSecureRequest {
  endDate: string;
}

export async function activate3DSecureApi(
  accessToken: string,
  cardId: string,
  request: Activate3DSecureRequest
): Promise<any> {
  // console.log('Mock API: Activating 3D Secure', { cardId, endDate: request.endDate });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  // console.log('Mock API: 3D Secure activated successfully');
  return {
    cardId,
    endDate: request.endDate,
    status: 'active',
    activatedAt: new Date().toISOString(),
  };
}

export interface CardReloadHistoryItem {
  id: string;
  amount: number;
  debtor: {
    rib: string;
  };
  transactionEve: string;
  executionDate: string;
  status: 'NOT_EXECUTED' | 'EXECUTING' | 'EXECUTED' | 'REJECTED';
}

export interface CardReloadHistoryResponse {
  count: number;
  data: CardReloadHistoryItem[];
}

export async function fetchCardReloadHistoryApi(
  accessToken: string,
  cardId: string,
  startDate?: string,
  endDate?: string,
  page?: number,
  size?: number
): Promise<CardReloadHistoryResponse> {
  // console.log('Mock API: Fetching card reload history', { cardId, startDate, endDate, page, size });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const mockReloadHistory: CardReloadHistoryItem[] = [
    {
      id: 'rea_5348696c-81fc-4ebd-931b-5c82a59ae781',
      amount: 3000,
      debtor: {
        rib: '04133201007351060418',
      },
      transactionEve: '16763',
      executionDate: '2024-10-03',
      status: 'EXECUTED',
    },
    {
      id: 'rea_7789254d-92ba-5fed-842c-6d93b68bf892',
      amount: 1500,
      debtor: {
        rib: '04133201008843511051',
      },
      transactionEve: '16764',
      executionDate: '2024-09-28',
      status: 'EXECUTED',
    },
    {
      id: 'rea_3342896a-73ef-6abc-753d-8e14c79cg903',
      amount: 2000,
      debtor: {
        rib: '04133201007351060418',
      },
      transactionEve: '16765',
      executionDate: '2024-09-15',
      status: 'EXECUTED',
    },
    {
      id: 'rea_9983447b-84fg-7bcd-864e-9f25d80dh014',
      amount: 500,
      debtor: {
        rib: '04133201008843511051',
      },
      transactionEve: '16766',
      executionDate: '2024-09-10',
      status: 'REJECTED',
    },
    {
      id: 'rea_2214558c-95gh-8cde-975f-0g36e91ei125',
      amount: 2500,
      debtor: {
        rib: '04133201007351060418',
      },
      transactionEve: '16767',
      executionDate: '2024-08-25',
      status: 'EXECUTED',
    },
  ];

  let filteredHistory = [...mockReloadHistory];

  if (startDate) {
    filteredHistory = filteredHistory.filter(h => h.executionDate >= startDate);
  }

  if (endDate) {
    filteredHistory = filteredHistory.filter(h => h.executionDate <= endDate);
  }

  const pageNum = page || 0;
  const pageSize = size || 50;
  const start = pageNum * pageSize;
  const paginatedHistory = filteredHistory.slice(start, start + pageSize);

  // console.log('Mock API: Returning card reload history', { count: paginatedHistory.length });
  return {
    count: filteredHistory.length,
    data: paginatedHistory,
  };
}

export interface TransferInitRequest {
  amount: string;
  debtorAccountId: string;
  creditorAccountId: string | null;
  beneficiaryId: string | null;
  remittenceInformation: string;
  frequency: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | null;
  executionDate: string;
  endExecutionDate: string | null;
}

export interface TransferInitResponse {
  id: string;
  status: 'INIT';
  amount: string;
  debtorAccountId: string;
  creditorAccountId?: string;
  beneficiaryId?: string;
  remittenceInformation: string;
  frequency?: string;
  executionDate: string;
  endExecutionDate?: string;
}

export interface TransferConfirmRequest {
  confirmationType: string;
  confirmationValue: string;
}

export interface TransferConfirmResponse {
  id: string;
  status: 'EXECUTED';
  amount: string;
  debtorAccountId: string;
  creditorAccountId?: string;
  beneficiaryId?: string;
  remittenceInformation: string;
  frequency?: string;
  executionDate: string;
  endExecutionDate?: string;
  transactionRef: string;
  executedAt: string;
}

const TRANSFER_ERROR_CODES = [
  'INVALID_CREDITOR_ACCOUNT',
  'UNAUTHORIZED_DEBTOR_ACCOUNT_TRANSFER',
  'ACCESS_DENIED',
  'UNAUTHORIZED_DEBTOR_ACCOUNT_TYPE',
  'UNAUTHORIZED_CREDITOR_ACCOUNT_TYPE',
  'UNAUTHORIZED_DEBTOR_ACCOUNT',
  'INVALID_INPUT',
  'UNAUTHORIZED_CREDITOR_ACCOUNT_TRANSFER',
  'INSUFFICIENT_FUNDS',
];

export async function transferInitApi(
  accessToken: string,
  request: TransferInitRequest
): Promise<TransferInitResponse> {
  // console.log('Mock API: Initiating transfer', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFail = Math.random() < 0.15;

  if (shouldFail) {
    const errorCode = TRANSFER_ERROR_CODES[Math.floor(Math.random() * TRANSFER_ERROR_CODES.length)];
    throw new ApiError(400, 'Transfer initialization failed', {
      error: { code: errorCode },
    });
  }

  const transferId = `vir_${Date.now()}`;

  const response: TransferInitResponse = {
    id: transferId,
    status: 'INIT',
    amount: request.amount,
    debtorAccountId: request.debtorAccountId,
    remittenceInformation: request.remittenceInformation,
    executionDate: request.executionDate,
  };

  if (request.creditorAccountId) {
    response.creditorAccountId = request.creditorAccountId;
  }

  if (request.beneficiaryId) {
    response.beneficiaryId = request.beneficiaryId;
  }

  if (request.frequency) {
    response.frequency = request.frequency;
  }

  if (request.endExecutionDate) {
    response.endExecutionDate = request.endExecutionDate;
  }

  // console.log('Mock API: Transfer initiated', { transferId });
  return response;
}

export async function transferConfirmApi(
  accessToken: string,
  transferId: string,
  request: TransferConfirmRequest
): Promise<TransferConfirmResponse> {
  // console.log('Mock API: Confirming transfer', { transferId, request });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      error: { code: 'INVALID_OTP' },
    });
  }

  const shouldFailSystem = Math.random() < 0.1;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      error: { code: 'INTERNAL_SERVER_ERROR' },
    });
  }

  const response: TransferConfirmResponse = {
    id: transferId,
    status: 'EXECUTED',
    amount: '1000',
    debtorAccountId: 'acc_001',
    beneficiaryId: 'ben_001',
    remittenceInformation: 'Transfer',
    executionDate: new Date().toISOString().split('T')[0],
    transactionRef: `TRF${Date.now()}`,
    executedAt: new Date().toISOString(),
  };

  // console.log('Mock API: Transfer confirmed', { transferId });
  return response;
}

export interface ETransferInitRequest {
  amount: string;
  creditorAccountId: string;
  deeplink: string;
}

export interface ETransferInitResponse {
  orderId: string;
  amount: string;
  currency: string;
  clickToPayUrl: string;
  status: 'PENDING';
}

export async function eTransferInitApi(
  accessToken: string,
  request: ETransferInitRequest
): Promise<ETransferInitResponse> {
  // console.log('Mock API: Initiating e-transfer', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const orderId = `etrf_${Date.now()}`;
  // const clickToPayUrl = `https://payment.example.com/clicktopay?orderId=${orderId}&amount=${request.amount}&accountId=${request.creditorAccountId}`;
  const clickToPayUrl = request.deeplink + `https://ipay.clictopay.com/payment/merchants/CLICTOPAY/payment.html?mdOrder=de0895d7-445e-494b-83df-9b4b96272931&language=fr`;
  const response: ETransferInitResponse = {
    orderId,
    amount: request.amount,
    currency: 'EUR',
    clickToPayUrl,
    status: 'PENDING',
  };

  // console.log('Mock API: E-transfer initiated', { orderId });
  return response;
}

export interface ETransferHistoryItem {
  id: string;
  orderId: string;
  amount: string;
  currency: string;
  creditorAccountId: string;
  creditorAccountTitle: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  createdAt: string;
  executedAt?: string;
}

export interface InstallmentInitRequest {
  transactionId: string;
  cardId: string;
  numberOfMonths: number;
  paymentDate: string;
}

export interface InstallmentInitResponse {
  requestId: string;
  transactionId: string;
  principalAmount: number;
  numberOfMonths: number;
  monthlyPayment: number;
  firstPaymentDate: string;
  status: 'INIT';
  createdAt: string;
}

export async function installmentInitApi(
  accessToken: string,
  request: InstallmentInitRequest
): Promise<InstallmentInitResponse> {
  // console.log('Mock API: Initiating installment', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailValidation = Math.random() < 0.1;
  if (shouldFailValidation) {
    throw new ApiError(400, 'Invalid installment request', {
      errorCode: 'INVALID_INSTALLMENT_REQUEST',
      message: 'Le nombre de mois doit être entre 3 et 12',
    });
  }

  const requestId = `inst_req_${Date.now()}`;
  const principalAmount = 1250.5;
  const monthlyPayment = principalAmount / request.numberOfMonths;

  const response: InstallmentInitResponse = {
    requestId,
    transactionId: request.transactionId,
    principalAmount,
    numberOfMonths: request.numberOfMonths,
    monthlyPayment,
    firstPaymentDate: request.paymentDate,
    status: 'INIT',
    createdAt: new Date().toISOString(),
  };

  // console.log('Mock API: Installment initiated', { requestId });
  return response;
}

export interface InstallmentConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface InstallmentConfirmResponse {
  requestId: string;
  transactionId: string;
  principalAmount: number;
  numberOfMonths: number;
  monthlyPayment: number;
  firstPaymentDate: string;
  lastPaymentDate: string;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
}

export async function installmentConfirmApi(
  accessToken: string,
  request: InstallmentConfirmRequest
): Promise<InstallmentConfirmResponse> {
  // console.log('Mock API: Confirming installment', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const firstPaymentDate = new Date();
  firstPaymentDate.setDate(firstPaymentDate.getDate() + 30);
  const lastPaymentDate = new Date(firstPaymentDate);
  lastPaymentDate.setMonth(lastPaymentDate.getMonth() + 11);

  const response: InstallmentConfirmResponse = {
    requestId: request.requestId,
    transactionId: 'trans_12345',
    principalAmount: 1250.5,
    numberOfMonths: 12,
    monthlyPayment: 104.21,
    firstPaymentDate: firstPaymentDate.toISOString().split('T')[0],
    lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
  };

  // console.log('Mock API: Installment confirmed', { requestId: request.requestId });
  return response;
}

export async function fetchETransferHistoryApi(
  accessToken: string
): Promise<ETransferHistoryItem[]> {
  // console.log('Mock API: Fetching e-transfer history');
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const mockETransfers: ETransferHistoryItem[] = [
    {
      id: 'etransfer_001',
      orderId: 'etrf_1701234567890',
      amount: '250.00',
      currency: 'EUR',
      creditorAccountId: 'acc_00201_0088435110_788',
      creditorAccountTitle: 'DEPOTS A VUE EN TND PERSONNEL',
      status: 'COMPLETED',
      createdAt: '2024-12-15T10:30:00Z',
      executedAt: '2024-12-15T10:31:45Z',
    },
    {
      id: 'etransfer_002',
      orderId: 'etrf_1701234567891',
      amount: '500.00',
      currency: 'USD',
      creditorAccountId: 'acc_00202_0088435111_788',
      creditorAccountTitle: 'DEPOTS A VUE EN TND PERSONNEL',
      status: 'PENDING',
      createdAt: '2024-12-16T08:15:00Z',
    },
    {
      id: 'etransfer_003',
      orderId: 'etrf_1701234567892',
      amount: '100.00',
      currency: 'EUR',
      creditorAccountId: 'acc_00201_0088435110_788',
      creditorAccountTitle: 'DEPOTS A VUE EN TND PERSONNEL',
      status: 'COMPLETED',
      createdAt: '2024-12-10T14:22:00Z',
      executedAt: '2024-12-10T14:23:12Z',
    },
    {
      id: 'etransfer_004',
      orderId: 'etrf_1701234567893',
      amount: '75.50',
      currency: 'EUR',
      creditorAccountId: 'acc_00202_0088435111_788',
      creditorAccountTitle: 'DEPOTS A VUE EN TND PERSONNEL',
      status: 'FAILED',
      createdAt: '2024-12-08T16:45:00Z',
    },
  ];

  // console.log('Mock API: Returning e-transfer history', { count: mockETransfers.length });
  return mockETransfers;
}

export interface CardActionInitRequest {
  cardId: string;
  action: 'activate' | 'disable' | 'resetPin' | 'modifyLimit' | 'activate3DSecure';
  newLimit?: string;
  endDate?: string;
}

export interface CardActionInitResponse {
  requestId: string;
  cardId: string;
  action: string;
  status: 'INIT';
  createdAt: string;
  newLimit?: string;
  endDate?: string;
}

export interface CardActionConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface CardActionConfirmResponse {
  requestId: string;
  cardId: string;
  action: string;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
  newLimit?: string;
  endDate?: string;
}

export interface BillPaymentInitRequest {
  billId: string;
  accountId: string;
  amount: number;
}

export interface BillPaymentInitResponse {
  requestId: string;
  billId: string;
  accountId: string;
  amount: number;
  status: 'INIT';
  createdAt: string;
}

export interface BillPaymentConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface BillPaymentConfirmResponse {
  requestId: string;
  billId: string;
  accountId: string;
  amount: number;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
  reference: string;
}

export async function billPaymentInitApi(
  accessToken: string,
  request: BillPaymentInitRequest
): Promise<BillPaymentInitResponse> {
  // console.log('Mock API: Initiating bill payment', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailValidation = Math.random() < 0.05;
  if (shouldFailValidation) {
    throw new ApiError(400, 'Invalid bill payment request', {
      errorCode: 'INSUFFICIENT_FUNDS',
      message: 'Solde insuffisant pour effectuer ce paiement',
    });
  }

  const requestId = `bill_req_${Date.now()}`;

  const response: BillPaymentInitResponse = {
    requestId,
    billId: request.billId,
    accountId: request.accountId,
    amount: request.amount,
    status: 'INIT',
    createdAt: new Date().toISOString(),
  };

  // console.log('Mock API: Bill payment initiated', { requestId });
  return response;
}

export async function billPaymentConfirmApi(
  accessToken: string,
  request: BillPaymentConfirmRequest
): Promise<BillPaymentConfirmResponse> {
  // console.log('Mock API: Confirming bill payment', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const response: BillPaymentConfirmResponse = {
    requestId: request.requestId,
    billId: 'bill_12345',
    accountId: 'acc_001',
    amount: 150.50,
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
    reference: `BILL-${Date.now()}`,
  };

  // console.log('Mock API: Bill payment confirmed', { requestId: request.requestId });
  return response;
}

export interface SchoolingTransferInitRequest {
  folderId: string;
  fromAccountId: string;
  amount: number;
  transferType: 'reload_card' | 'transfer';
  description?: string;
}

export interface SchoolingTransferInitResponse {
  requestId: string;
  folderId: string;
  fromAccountId: string;
  amount: number;
  transferType: string;
  status: 'INIT';
  createdAt: string;
}

export interface SchoolingTransferConfirmRequest {
  requestId: string;
  confirmationMethod: 'OTP';
  confirmationValue: string;
}

export interface SchoolingTransferConfirmResponse {
  requestId: string;
  folderId: string;
  fromAccountId: string;
  amount: number;
  transferType: string;
  status: 'EXECUTED' | 'FAILED';
  executedAt: string;
  reference: string;
}

export async function schoolingTransferInitApi(
  accessToken: string,
  request: SchoolingTransferInitRequest
): Promise<SchoolingTransferInitResponse> {
  // console.log('Mock API: Initiating schooling transfer', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailValidation = Math.random() < 0.05;
  if (shouldFailValidation) {
    throw new ApiError(400, 'Invalid schooling transfer request', {
      errorCode: 'INSUFFICIENT_FUNDS',
      message: 'Solde insuffisant pour effectuer ce transfert',
    });
  }

  const requestId = `schl_req_${Date.now()}`;

  const response: SchoolingTransferInitResponse = {
    requestId,
    folderId: request.folderId,
    fromAccountId: request.fromAccountId,
    amount: request.amount,
    transferType: request.transferType,
    status: 'INIT',
    createdAt: new Date().toISOString(),
  };

  // console.log('Mock API: Schooling transfer initiated', { requestId });
  return response;
}

export async function schoolingTransferConfirmApi(
  accessToken: string,
  request: SchoolingTransferConfirmRequest
): Promise<SchoolingTransferConfirmResponse> {
  // console.log('Mock API: Confirming schooling transfer', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const response: SchoolingTransferConfirmResponse = {
    requestId: request.requestId,
    folderId: 'folder_001',
    fromAccountId: 'acc_001',
    amount: 500.00,
    transferType: 'reload_card',
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
    reference: `SCHL-${Date.now()}`,
  };

  // console.log('Mock API: Schooling transfer confirmed', { requestId: request.requestId });
  return response;
}

export async function cardActionInitApi(
  accessToken: string,
  request: CardActionInitRequest
): Promise<CardActionInitResponse> {
  // console.log('Mock API: Initiating card action', request);
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  const shouldFailValidation = Math.random() < 0.05;
  if (shouldFailValidation) {
    throw new ApiError(400, 'Invalid card action request', {
      errorCode: 'INVALID_CARD_ACTION',
      message: 'Action non autorisée pour cette carte',
    });
  }

  const requestId = `card_act_${Date.now()}`;

  const response: CardActionInitResponse = {
    requestId,
    cardId: request.cardId,
    action: request.action,
    status: 'INIT',
    createdAt: new Date().toISOString(),
  };

  if (request.newLimit) {
    response.newLimit = request.newLimit;
  }

  if (request.endDate) {
    response.endDate = request.endDate;
  }

  // console.log('Mock API: Card action initiated', { requestId });
  return response;
}

export async function cardActionConfirmApi(
  accessToken: string,
  request: CardActionConfirmRequest
): Promise<CardActionConfirmResponse> {
  // console.log('Mock API: Confirming card action', { requestId: request.requestId });
  await delay(API_DELAY);

  if (!accessToken) {
    throw new ApiError(401, 'Unauthorized');
  }

  if (request.confirmationValue !== '123456') {
    throw new ApiError(400, 'Invalid OTP', {
      errorCode: 'INVALID_OTP',
      message: 'Code OTP invalide',
    });
  }

  const shouldFailSystem = Math.random() < 0.05;
  if (shouldFailSystem) {
    throw new ApiError(500, 'System error', {
      errorCode: 'INTERNAL_SERVER_ERROR',
      message: 'Erreur système. Veuillez réessayer plus tard',
    });
  }

  const response: CardActionConfirmResponse = {
    requestId: request.requestId,
    cardId: 'card_12345',
    action: 'activate',
    status: 'EXECUTED',
    executedAt: new Date().toISOString(),
  };

  // console.log('Mock API: Card action confirmed', { requestId: request.requestId });
  return response;
}