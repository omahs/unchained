import { AccountsPassword } from '@accounts/password';
import { User } from '@unchainedshop/types/user.js';

export class UnchainedAccountsPassword extends AccountsPassword<
  User & { id: string; deactivated: boolean }
> {}

// eslint-disable-next-line import/prefer-default-export
export const accountsPassword = new UnchainedAccountsPassword({});
