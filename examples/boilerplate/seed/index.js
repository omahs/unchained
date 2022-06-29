import { Users } from '@unchainedshop/core-users';
import { Countries } from '@unchainedshop/core-countries';
import { Currencies } from '@unchainedshop/core-currencies';
import { Languages } from '@unchainedshop/core-languages';
import { hashPassword } from '@unchainedshop/api';

import i18nConfiguration from './i18n.config';

const logger = console;

export default async () => {
  if (Users.find({ username: 'admin' }).count() > 0) {
    return;
  }
  const admin = await Users.createUser(
    {
      username: 'admin',
      roles: ['admin'],
      email: 'admin@unchained.local',
      password: hashPassword('password'),
      initialPassword: true,
      profile: { address: {} },
      guest: false,
    },
    {},
    { skipMessaging: true },
  );

  const { languages, currencies, countries } = i18nConfiguration;

  languages.forEach(({ isoCode, ...rest }) => {
    Languages.createLanguage({
      isoCode,
      isActive: true,
      authorId: admin._id,
      ...rest,
    });
  });

  const currencyCodeToObjectMap = currencies.reduce(
    (acc, { isoCode, ...rest }) => {
      const currencyObject = Currencies.createCurrency({
        isoCode,
        isActive: true,
        authorId: admin._id,
        ...rest,
      });
      return {
        ...acc,
        [isoCode]: currencyObject,
      };
    },
    {},
  );

  countries.forEach(({ isoCode, defaultCurrencyCode, ...rest }) => {
    Countries.createCountry({
      isoCode,
      isActive: true,
      authorId: admin._id,
      defaultCurrencyId: currencyCodeToObjectMap[defaultCurrencyCode]._id,
      ...rest,
    });
  });

  logger.log(`
      initialized database with user: admin@unchained.local / password`);
};
