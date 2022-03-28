import {
  BasePricingAdapterContext,
  IBasePricingSheet,
  IPricingAdapter,
  PricingCalculation,
} from '@unchainedshop/types/pricing';
import { log, LogLevel } from 'meteor/unchained:logger';
import { BasePricingSheet } from './BasePricingSheet';

export const BasePricingAdapter = <
  Context extends BasePricingAdapterContext,
  Calculation extends PricingCalculation,
>(): IPricingAdapter<Context, Calculation, IBasePricingSheet<Calculation>> => ({
  key: '',
  label: '',
  version: '',
  orderIndex: 0,

  isActivatedFor: () => {
    return false;
  },

  actions: (params) => ({
    calculate: async () => {
      return [];
    },
    calculationSheet: () => BasePricingSheet(params),
    resultSheet: () => BasePricingSheet(params),
    getCalculation: () => params.calculation,
    getContext: () => params.context,
  }),

  log(message: string, { level = LogLevel.Debug, ...options } = {}) {
    return log(message, { level, ...options });
  },
});
