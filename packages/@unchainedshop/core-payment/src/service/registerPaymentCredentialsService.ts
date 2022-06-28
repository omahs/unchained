import { RegisterPaymentCredentialsService } from '@unchainedshop/types/payments';

export const registerPaymentCredentialsService: RegisterPaymentCredentialsService = async (
  paymentProviderId,
  paymentContext,
  requestContext,
) => {
  const { modules, userId } = requestContext;
  const registration = await modules.payment.paymentProviders.register(
    paymentProviderId,
    paymentContext,
    requestContext,
  );

  if (!registration) return null;

  const paymentCredentialsId = await modules.payment.paymentCredentials.upsertCredentials({
    userId,
    paymentProviderId,
    ...registration,
  });

  return modules.payment.paymentCredentials.findPaymentCredential({
    paymentCredentialsId,
    userId,
    paymentProviderId,
  });
};
