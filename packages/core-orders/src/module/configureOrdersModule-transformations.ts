import { Collection, FindOptions, Query } from '@unchainedshop/types/common';
import { Order, OrderTransformations } from '@unchainedshop/types/orders';
import { OrderStatus } from '../db/OrderStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

export const configureOrderModuleTransformations = ({
  Orders,
}: {
  Orders: Collection<Order>;
}): OrderTransformations => {
  return {
    discounted: async (order, orderDiscount, requestContext) => {
      const { modules } = requestContext;

      // Delivery discounts
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });
      const orderDeliveryDiscounts = modules.orders.deliveries.discounts(
        orderDelivery,
        { order, orderDiscount },
        requestContext,
      );

      // Payment discounts
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const orderPaymentDiscounts = modules.orders.payments.discounts(
        orderPayment,
        { order, orderDiscount },
        requestContext,
      );

      // Position discounts
      const orderPositions = await modules.orders.positions.findOrderPositions({
        orderId: order._id,
      });
      const orderPositionDiscounts = orderPositions.flatMap((orderPosition) =>
        modules.orders.positions.discounts(orderPosition, { order, orderDiscount }, requestContext),
      );

      // order discounts
      const pricingSheet = OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });

      const orderDiscounts = pricingSheet
        .discountPrices(orderDiscount._id)
        .map((discount) => ({ order, ...discount }));

      // All discounts
      const discounted = [
        ...orderPaymentDiscounts,
        ...orderDeliveryDiscounts,
        ...orderPositionDiscounts,
        ...orderDiscounts,
      ].filter(Boolean);

      return discounted;
    },

    discountTotal: async (order, orderDiscount, requestContext) => {
      const { modules } = requestContext;
      const orderDiscountId = orderDiscount._id;

      // Delivery discounts
      const orderDelivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });
      const orderDeliveryDiscountSum = modules.orders.deliveries
        .pricingSheet(orderDelivery, order.currency)
        .discountSum(orderDiscountId);

      // Payment discounts
      const orderPayment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const orderPaymentDiscountSum = modules.orders.payments
        .pricingSheet(orderPayment, order.currency)
        .discountSum(orderDiscountId);

      // Position discounts
      const orderPositions = await modules.orders.positions.findOrderPositions({
        orderId: order._id,
      });
      const orderPositionDiscounts = orderPositions.map((orderPosition) =>
        modules.orders.positions
          .pricingSheet(orderPosition, order.currency, requestContext)
          .discountSum(orderDiscountId),
      );

      // order discounts
      const orderDiscountSum = OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      }).discountSum(orderDiscountId);

      const prices = [
        orderDeliveryDiscountSum,
        orderPaymentDiscountSum,
        ...orderPositionDiscounts,
        orderDiscountSum,
      ];
      const amount = prices.reduce((oldValue, price) => oldValue + (price || 0), 0);
      return {
        amount,
        currency: order.currency,
      };
    },

    isCart: (order) => {
      return order.status === OrderStatus.OPEN;
    },
    cart: async (order, user) => {
      const selector: Query = {
        countryCode: order.countryContext || user.lastLogin.countryContext,
        status: { $eq: OrderStatus.OPEN },
        userId: user._id,
      };

      if (order.orderNumber) {
        selector.orderNumber = order.orderNumber;
      }

      const options: FindOptions = {
        sort: {
          updated: -1,
        },
      };
      return Orders.findOne(selector, options);
    },

    pricingSheet: (order) => {
      return OrderPricingSheet({
        calculation: order.calculation,
        currency: order.currency,
      });
    },
  };
};
