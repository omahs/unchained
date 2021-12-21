import {
  IPaymentAdapter
} from '@unchainedshop/types/payments';
import { log, LogLevel } from 'meteor/unchained:logger';
import { PaymentError } from './PaymentError';

export const PaymentAdapter: IPaymentAdapter = {
  key: '',
  label: '',
  version: '',

  initialConfiguration: [],

  typeSupported: () => {
    return false;
  },

  actions: () => {
    return {
      configurationError: async () => {
        return PaymentError.NOT_IMPLEMENTED;
      },

      isActive: async () => {
        return false;
      },

      isPayLaterAllowed: () => {
        return false;
      },

      charge: async () => {
        // if you return true, the status will be changed to PAID

        // if you return false, the order payment status stays the
        // same but the order status might change

        // if you throw an error, you cancel the checkout process
        return false;
      },

      register: async () => {
        return {
          token: '',
        };
      },

      sign: async () => {
        return null;
      },

      validate: async () => {
        return false;
      },
    };
  },

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
};
