import { PaymentMethods } from './PaymentMethods';
import { Request } from './Request';
import { Response } from './Response';
import { TransactionAmount } from './Transaction';

export interface PaymentPageInitializeInput extends Request {
  ConfigSet?: string;
  TerminalId: string;
  Payment: {
    Amount: TransactionAmount;
    OrderId?: string;
    PayerNote?: string;
    Description: string;
    MandateId?: string;
    Options?: {
      PreAuth?: boolean;
      AllowPartialAuthorization?: boolean;
    };
  };
  Recurring?: {
    initial: boolean;
  };
  Installment?: {
    initial: boolean;
  };
  PaymentMethods?: PaymentMethods[];
  PaymentMethodsOptions?: Map<string, Map<string, string>>;
  Authentication?: {
    Exemption?: string;
    ThreeDsChallenge?: string;
  };
  Wallets?: string[];
  Payer?: {
    IpAddress?: string;
    LanguageCode?: string;
  };
  BillingAddress?: Map<string, string>;
  DeliveryAddress?: Map<string, string>;
  RegisterAlias?: {
    IdGenerator: 'MANUAL' | 'RANDOM' | 'RANDOM_UNIQUE';
    Id?: string;
    Lifetime?: number;
  };
  ReturnUrls: {
    Success: string;
    Fail: string;
    Abort?: string;
  };
}

export interface PaymentPageInitializeResponse extends Response {
  Token: string;
  Expiration: string; // ISO8601 UTC
  RedirectUrl: string;
}
