import { Schemas } from 'meteor/unchained:utils';
import SimpleSchema from 'simpl-schema';

import { Enrollments } from './collections';

const { logFields, contextFields, timestampFields, Address, Contact } = Schemas;

export const EnrollmentStatus = {
  INITIAL: 'INITIAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  TERMINATED: 'TERMINATED',
};

export const PeriodSchema = new SimpleSchema(
  {
    start: { type: Date, required: true },
    end: { type: Date, required: true },
    orderId: { type: String },
    isTrial: { type: Boolean },
  },
  {
    requiredByDefault: false,
  }
);

export const Schema = new SimpleSchema(
  {
    userId: { type: String, required: true },
    status: { type: String, required: true },
    productId: { type: String, required: true },
    quantity: { type: Number },
    configuration: Array,
    'configuration.$': {
      type: Object,
      required: true,
    },
    'configuration.$.key': {
      type: String,
      required: true,
    },
    'configuration.$.value': {
      type: String,
    },
    enrollmentNumber: String,
    expires: Date,
    meta: { type: Object, blackbox: true },
    billingAddress: Address,
    contact: Contact,
    currencyCode: String,
    countryCode: String,
    payment: { type: Object },
    'payment.paymentProviderId': String,
    'payment.context': contextFields.context,
    delivery: { type: Object },
    'delivery.deliveryProviderId': String,
    'delivery.context': contextFields.context,
    periods: { type: Array },
    'periods.$': { type: PeriodSchema, required: true },
    ...timestampFields,
    ...contextFields,
    ...logFields,
  },
  { requiredByDefault: false }
);

Enrollments.attachSchema(Schema);

export default () => {
  Enrollments.rawCollection().createIndex({ userId: 1 });
  Enrollments.rawCollection().createIndex({ productId: 1 });
  Enrollments.rawCollection().createIndex({ status: 1 });
};
