import { log } from 'meteor/unchained:core-logger';
import { Countries } from 'meteor/unchained:core-countries';
import { CountryNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { countryId }, { userId }) {
  log(`mutation removeCountry ${countryId}`, { userId });
  if (!countryId) throw new InvalidIdError({ countryId });
  const country = Countries.findOne({ _id: countryId });
  if (!country) throw new CountryNotFoundError({ countryId });
  Countries.remove({ _id: countryId });
  return country;
}
