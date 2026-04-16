import { SchoolingFolder, SchoolingTransferType } from '@/types/banking';

export const mockTransferTypes: SchoolingTransferType[] = [
  {
    id: 'reload_card',
    name: 'Reload Card',
    description: 'Add funds to student card',
    icon: 'credit-card',
  },
  {
    id: 'transfer',
    name: 'Direct Transfer',
    description: 'Transfer to school account',
    icon: 'send',
  },
];

export const mockSchoolingFolders: SchoolingFolder[] = [
  {
    id: '56789009',
    schoolName: 'International School Paris',
    studentName: 'Ahmed Bennour',
    studentId: '8990097658900987',
    remainingAmount: 22000,
    totalAmount: 25000.00,
    currency: 'EUR',
    academicYear: '2024-2025',
    grade: '10th Grade',
    transferTypes: mockTransferTypes,
    lastPaymentDate: '2024-09-17T10:30:00Z',
    status: 'active',
  },
  {
    id: '56789010',
    schoolName: 'Berlin International School',
    studentName: 'Ahmed Bennour',
    studentId: '8990097658900987',
    remainingAmount: 22000,
    totalAmount: 25000.00,
    currency: 'EUR',
    academicYear: '2024-2025',
    grade: '8th Grade',
    transferTypes: mockTransferTypes,
    lastPaymentDate: '2024-09-17T14:15:00Z',
    status: 'active',
  },
  {
    id: '56789011',
    schoolName: 'American School London',
    studentName: 'Ahmed Bennour',
    studentId: '8990097658900987',
    remainingAmount: 22000,
    totalAmount: 25000.00,
    currency: 'TND',
    academicYear: '2024-2025',
    grade: '5th Grade',
    transferTypes: mockTransferTypes,
    lastPaymentDate: '2024-08-30T09:00:00Z',
    status: 'active',
  },
];

export const getSchoolingFolders = async (): Promise<SchoolingFolder[]> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return mockSchoolingFolders;
};

export const getSchoolingFolder = async (id: string): Promise<SchoolingFolder | null> => {
  await new Promise(resolve => setTimeout(resolve, 300));
  return mockSchoolingFolders.find(folder => folder.id === id) || null;
};
