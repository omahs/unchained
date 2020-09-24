import { Meteor } from 'meteor/meteor';
import { Users } from 'meteor/unchained:core-users';
import {
  accountsPassword,
  accountsServer,
} from 'meteor/unchained:core-accountsjs';
import omit from 'lodash.omit';
import hashPassword from '../../../hashPassword';

export default async function createUser(root, options, context) {
  Meteor._nodeCodeMustBeInFiber(); // eslint-disable-line
  if (!options.password && !options.plainPassword) {
    throw new Error('Password is required');
  }
  const mappedOptions = options;
  if (!mappedOptions.password) {
    mappedOptions.password = hashPassword(mappedOptions.plainPassword);
    delete mappedOptions.plainPassword;
  }
  const userId = await accountsPassword.createUser(mappedOptions);
  const { user, token } = await accountsServer.loginWithUser(
    Users.findOne(userId),
  );

  return {
    id: user._id,
    token: token.token,
    tokenExpires: token.when,
    user: omit(user, ['services', 'roles']),
  };
}
