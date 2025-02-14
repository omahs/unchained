import {
  IProductPricingAdapter,
  IProductPricingDirector,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  ProductPricingContext,
} from '@unchainedshop/types/products.pricing.js';
import { BasePricingDirector } from '@unchainedshop/utils';
import { ProductPricingSheet } from './ProductPricingSheet.js';

const baseDirector = BasePricingDirector<
  ProductPricingContext,
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingAdapter
>('ProductPricingDirector');

export const ProductPricingDirector: IProductPricingDirector = {
  ...baseDirector,

  async buildPricingContext({ item: orderPosition, ...context }, unchainedAPI) {
    const { modules } = unchainedAPI;

    if (!orderPosition) {
      return {
        discounts: [],
        ...context,
        ...unchainedAPI,
      } as ProductPricingAdapterContext;
    }

    const product = await modules.products.findProduct({
      productId: orderPosition.productId,
    });

    const order = await modules.orders.findOrder({
      orderId: orderPosition.orderId,
    });
    const user = await modules.users.findUserById(order.userId);
    const discounts = await modules.orders.discounts.findOrderDiscounts({
      orderId: orderPosition.orderId,
    });

    return {
      country: order.countryCode,
      currency: order.currency,
      ...context,
      ...unchainedAPI,
      discounts,
      order,
      product,
      quantity: orderPosition.quantity,
      configuration: orderPosition.configuration,
      user,
    };
  },

  async actions(pricingContext, unchainedAPI) {
    const actions = await baseDirector.actions(pricingContext, unchainedAPI, this.buildPricingContext);
    return {
      ...actions,
      calculationSheet() {
        const context = actions.getContext();
        return ProductPricingSheet({
          calculation: actions.getCalculation(),
          currency: context.currency,
          quantity: context.quantity,
        });
      },
    };
  },
};
