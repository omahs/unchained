import { PaymentCredentialsHelperTypes } from '@unchainedshop/types/payments.js';

export const PaymentCredentials: PaymentCredentialsHelperTypes = {
  async user(obj, _, { modules }) {
    return modules.users.findUserById(obj.userId);
  },

  async paymentProvider(obj, _, { modules }) {
    return modules.payment.paymentProviders.findProvider({
      paymentProviderId: obj.paymentProviderId,
    });
  },

  async isValid(obj, _, context) {
    const { modules, userId } = context;

    return modules.payment.paymentProviders.validate(
      obj.paymentProviderId,
      { userId, token: obj },
      context,
    );
  },
};
