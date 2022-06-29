import { GetUserCountryService } from '@unchainedshop/types/user';

export const getUserCountryService: GetUserCountryService = async (user, params, { modules }) => {
  const userLocale = modules.users.userLocale(user, params);

  return modules.countries.findCountry({
    isoCode: userLocale.country.toUpperCase(),
  });
};
