import { Schemas } from '@unchainedshop/utils';
import SimpleSchema from 'simpl-schema';

export const CountriesSchema = new SimpleSchema(
  {
    isoCode: { type: String, required: true },
    isActive: Boolean,
    authorId: { type: String, required: true },
    defaultCurrencyId: String,
    ...Schemas.timestampFields,
  },
  { requiredByDefault: false },
);
