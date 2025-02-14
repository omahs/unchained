import { Db } from '@unchainedshop/types/common.js';
import { User } from '@unchainedshop/types/user.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const UsersCollection = async (db: Db) => {
  const Users = db.collection<User>('users');

  await buildDbIndexes<User>(Users, [
    {
      index: {
        username: 1,
      },
      options: {
        unique: true,
        sparse: true,
      },
    },
    {
      index: {
        'emails.address': 1,
      } as any,
      options: {
        unique: true,
        sparse: true,
      },
    },

    {
      index: {
        'services.email.verificationTokens.token': 1,
      } as any,
      options: {
        sparse: true,
      },
    },

    {
      index: {
        'services.password.reset.token': 1,
      } as any,
      options: {
        sparse: true,
      },
    },

    {
      index: {
        'services.resume.loginTokens.hashedToken': 1,
      } as any,
      options: {
        sparse: true,
      },
    },

    {
      index: {
        _id: 'text',
        username: 'text',
        'emails.address': 'text',
        'profile.displayName': 'text',
        'lastBillingAddress.firstName': 'text',
        'lastBillingAddress.lastName': 'text',
        'lastBillingAddress.company': 'text',
        'lastBillingAddress.addressLine': 'text',
        'lastBillingAddress.addressLine2': 'text',
      } as any,
      options: {
        weights: {
          _id: 9,
          'emails.address': 7,
          'profile.displayName': 5,
          'lastBillingAddress.firstName': 3,
          'lastBillingAddress.lastName': 3,
          'lastBillingAddress.company': 1,
          'lastBillingAddress.addressLine': 1,
          'lastBillingAddress.addressLine2': 1,
        },
        name: 'user_fulltext_search',
      },
    },
  ]);

  return Users;
};
