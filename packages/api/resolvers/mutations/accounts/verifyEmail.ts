import { log } from 'meteor/unchained:logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function verifyEmail(
  root: Root,
  { token }: { token: any },
  context: Context
) {
  const { modules, userId } = context;

  log(`mutation verifyEmail ${userId}`, { userId });

  const unverifiedUser = await modules.accounts.findUnverifiedUserByToken(
    token
  );

  await modules.accounts.verifyEmail(token);
  const verifiedUser = modules.users.findUser({ userId: unverifiedUser.id });

  await modules.accounts.emit('VerifyEmailSuccess', verifiedUser);

  return modules.accounts.createLoginToken(unverifiedUser.id, context);
}
