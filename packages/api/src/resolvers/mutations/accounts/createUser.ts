import { UserData } from '@unchainedshop/types/accounts.js';
import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { hashPassword } from '../../../hashPassword.js';
import {
  AuthOperationFailedError,
  EmailAlreadyExistsError,
  UsernameAlreadyExistsError,
  UsernameOrEmailRequiredError,
} from '../../../errors.js';

export default async function createUser(root: Root, params: UserData, context: Context) {
  const { modules, userId } = context;

  log('mutation createUser', { email: params.email, username: params.username, userId });

  if (!params.plainPassword && !params.webAuthnPublicKeyCredentials) {
    throw new Error('Password or Public Key is required');
  }

  const mappedUser = { ...params };
  if (mappedUser.plainPassword) {
    mappedUser.password = hashPassword(mappedUser.plainPassword);
  }
  delete mappedUser.plainPassword;
  delete mappedUser.webAuthnPublicKeyCredentials;

  const webAuthnService =
    params.webAuthnPublicKeyCredentials &&
    (await modules.accounts.webAuthn.verifyCredentialCreation(
      params.username,
      params.webAuthnPublicKeyCredentials,
    ));
  let newUserId;
  try {
    newUserId = await modules.accounts.createUser(mappedUser, {
      skipPasswordEnrollment: !!webAuthnService,
    });
  } catch (e) {
    if (e.code === 'EmailAlreadyExists') throw new EmailAlreadyExistsError({ email: params?.email });
    else if (e.code === 'UsernameAlreadyExists')
      throw new UsernameAlreadyExistsError({ username: params?.username });
    else if (e.code === 'UsernameOrEmailRequired')
      throw new UsernameOrEmailRequiredError({ username: params?.username });
    else throw new AuthOperationFailedError({ username: params?.username, email: params.email });
  }

  if (newUserId && webAuthnService) {
    await modules.users.updateUser(
      { _id: newUserId },
      {
        $push: {
          'services.webAuthn': webAuthnService,
        },
      },
      {},
    );
  }

  return modules.accounts.createLoginToken(newUserId, context);
}
