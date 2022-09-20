import { Context } from '@unchainedshop/types/api';
import { Country } from '@unchainedshop/types/countries';
import { Currency } from '@unchainedshop/types/currencies';
import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { Enrollment } from '@unchainedshop/types/enrollments';
import { Order as OrderType } from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { OrderPrice } from '@unchainedshop/types/orders.pricing';
import { PaymentProvider } from '@unchainedshop/types/payments';
import { User } from '@unchainedshop/types/user';
import crypto from 'crypto';

type HelperType<P, T> = (order: OrderType, params: P, context: Context) => T;

interface OrderHelperTypes {
  supportedDeliveryProviders: HelperType<never, Promise<Array<DeliveryProvider>>>;
  supportedPaymentProviders: HelperType<never, Promise<Array<PaymentProvider>>>;
  currency: HelperType<never, Promise<Currency>>;
  country: HelperType<never, Promise<Country>>;
  discounts: HelperType<never, Promise<Array<OrderDiscount>>>;
  delivery: HelperType<never, Promise<OrderDelivery>>;
  enrollment: HelperType<never, Promise<Enrollment>>;
  payment: HelperType<never, Promise<OrderPayment>>;
  items: HelperType<never, Promise<Array<OrderPosition>>>;
  status: HelperType<never, string>;
  total: HelperType<{ category: string }, Promise<OrderPrice>>;
  user: HelperType<never, Promise<User>>;
}

export const Order: OrderHelperTypes = {
  supportedDeliveryProviders: async (obj, _, context) =>
    context.modules.delivery.findSupported(
      {
        order: obj,
      },
      context,
    ),

  supportedPaymentProviders: async (obj, _, context) =>
    context.modules.payment.paymentProviders.findSupported(
      {
        order: obj,
      },
      context,
    ),

  currency: async (obj, _, { modules }) => modules.currencies.findCurrency({ isoCode: obj.currency }),
  country: async (obj, _, { modules }) => modules.countries.findCountry({ isoCode: obj.countryCode }),

  discounts: async (obj, _, { modules }) =>
    modules.orders.discounts.findOrderDiscounts({ orderId: obj._id }),

  delivery: async (obj, _, { modules }) =>
    modules.orders.deliveries.findDelivery({
      orderDeliveryId: obj.deliveryId,
    }),

  enrollment: async (obj, _, { modules }) =>
    modules.enrollments.findEnrollment({
      orderId: obj._id,
    }),

  items: async (obj, _, { modules }) =>
    modules.orders.positions.findOrderPositions({
      orderId: obj._id,
    }),

  payment: async (obj, _, { modules }) =>
    modules.orders.payments.findOrderPayment({
      orderPaymentId: obj.paymentId,
    }),

  status: (obj) => {
    if (obj.status === null) {
      return 'OPEN';
    }
    return obj.status;
  },

  total: async (obj, params: { category: string }, { modules }) => {
    const pricingSheet = modules.orders.pricingSheet(obj);

    if (pricingSheet.isValid()) {
      const price = pricingSheet.total({ category: params.category, useNetPrice: false });

      return {
        _id: crypto
          .createHash('sha256')
          .update([obj._id, price.amount, price.currency].join(''))
          .digest('hex'),
        ...price,
      };
    }
    return null;
  },

  user: async (obj, _, { modules }) => modules.users.findUserById(obj.userId),
};
