export type NotificationType = 
  | 'transaction'
  | 'balance'
  | 'security'
  | 'payment'
  | 'loan'
  | 'card'
  | 'general';

export type NotificationChannel = 'push' | 'email' | 'sms';

export type AlertMovementType = 'debit' | 'credit';


export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  disabled: boolean;
  metadata?: {
    amount?: number;
    currency?: string;
    accountName?: string;
    link?: string;
    buttonText?: string;
    response?: string;
  };
}

export interface NotificationConfig {
  id: string;
  type: NotificationType;
  enabled: boolean;
  channels: NotificationChannel[];
  minBalance?: number;
  maxBalance?: number;
  minTransactionCount?: number;
}



export type AlertType = 'overMvtD' | 'overMvtC';
export type ReceptionChannel = 'email' | 'push' | 'sms';
export type AlertToggleAction = 'enable' | 'disable';

export interface ContactDetails {
  email?: string;
  phoneNumber?: string;
}

export interface CreateAlertRequest {
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  receptionChannels: ReceptionChannel[];
  contactDetails?: ContactDetails;
}

export interface AlertConfig {
  id: string;
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  enabled: boolean | null;
  receptionChannels: ReceptionChannel[];
  contactDetails?: ContactDetails;
}

export interface AlertResponse {
  id: string;
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  enabled: boolean | null;
  receptionChannels: ReceptionChannel[];
  contactDetails?: ContactDetails;
}


export interface UpdateAlertRequest {
  accountId: string;
  type: AlertType;
  minAmount: number;
  maxAmount: number;
  startDate: string; // yyyy-MM-dd
  endDate: string;   // yyyy-MM-dd
  receptionChannels: ReceptionChannel[];
  contactDetails?: ContactDetails;
}


