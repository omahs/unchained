import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { PaymentProviderNotFoundError, InvalidIdError } from '../../../errors';

export default async (
  root: Root,
  { paymentProviderId }: { paymentProviderId: string },
  { modules, userId }: Context,
) => {
  log(`mutation removePaymentProvider ${paymentProviderId}`, { userId });

  if (!paymentProviderId) throw new InvalidIdError({ paymentProviderId });
  if (
    !(await modules.payment.paymentProviders.providerExists({
      paymentProviderId,
    }))
  )
    throw new PaymentProviderNotFoundError({ paymentProviderId });

  return modules.payment.paymentProviders.delete(paymentProviderId, userId);
};
