import { BasePricingSheet } from '@unchainedshop/utils';
import {
  PaymentPricingCalculation,
  PaymentPricingRowCategory,
  IPaymentPricingSheet,
} from '@unchainedshop/types/payments.pricing.js';
import { IBasePricingSheet, PricingSheetParams } from '@unchainedshop/types/pricing.js';

export const PaymentPricingSheet = (
  params: PricingSheetParams<PaymentPricingCalculation>,
): IPaymentPricingSheet => {
  const basePricingSheet: IBasePricingSheet<PaymentPricingCalculation> = BasePricingSheet(params);

  const pricingSheet: IPaymentPricingSheet = {
    ...basePricingSheet,

    addDiscount({ amount, isTaxable, isNetPrice, discountId, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Discount,
        amount,
        isTaxable,
        isNetPrice,
        discountId,
        meta,
      });
    },

    addFee({ amount, isTaxable, isNetPrice, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Payment,
        amount,
        isTaxable,
        isNetPrice,
        meta,
      });
    },

    addTax({ amount, rate, meta }) {
      basePricingSheet.calculation.push({
        category: PaymentPricingRowCategory.Tax,
        amount,
        isTaxable: false,
        isNetPrice: false,
        rate,
        meta,
      });
    },

    taxSum() {
      return basePricingSheet.sum({
        category: PaymentPricingRowCategory.Tax,
      });
    },

    feeSum() {
      return basePricingSheet.sum({
        category: PaymentPricingRowCategory.Payment,
      });
    },

    discountSum(discountId) {
      return basePricingSheet.sum({
        category: PaymentPricingRowCategory.Discount,
        discountId,
      });
    },

    discountPrices(explicitDiscountId) {
      const discountIds = pricingSheet
        .getDiscountRows(explicitDiscountId)
        .map(({ discountId }) => discountId);

      return [...new Set(discountIds)]
        .map((discountId) => {
          const amount = basePricingSheet.sum({
            category: PaymentPricingRowCategory.Discount,
            discountId,
          });
          if (!amount) {
            return null;
          }
          return {
            discountId,
            amount: Math.round(amount),
            currency: basePricingSheet.currency,
          };
        })
        .filter(Boolean);
    },

    getFeeRows() {
      return basePricingSheet.filterBy({
        category: PaymentPricingRowCategory.Item,
      });
    },

    getDiscountRows(discountId) {
      return basePricingSheet.filterBy({
        category: PaymentPricingRowCategory.Discount,
        discountId,
      });
    },

    getTaxRows() {
      return basePricingSheet.filterBy({
        category: PaymentPricingRowCategory.Tax,
      });
    },
  };

  return pricingSheet;
};
