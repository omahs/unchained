import { Collection, ModuleMutations } from '@unchainedshop/types/common';
import {
  Order,
  OrderMutations,
  OrdersModule,
} from '@unchainedshop/types/orders';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries';
import { OrderDiscount } from '@unchainedshop/types/orders.discounts';
import { OrderPayment } from '@unchainedshop/types/orders.payments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  dbIdToString,
  generateDbFilterById,
  generateDbMutations,
} from 'meteor/unchained:utils';
import { OrdersSchema } from '../db/OrdersSchema';

const ORDER_EVENTS: string[] = [
  'ORDER_ADD_DISCOUNT',
  'ORDER_ADD_PRODUCT',
  'ORDER_CREATE',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
];

export const configureOrderModuleMutations = ({
  Orders,
  OrderPositions,
  OrderDeliveries,
  OrderPayments,
  OrderDiscounts,
  updateStatus,
  updateCalculation,
}: {
  Orders: Collection<Order>;
  OrderPositions: Collection<OrderPosition>;
  OrderDeliveries: Collection<OrderDelivery>;
  OrderPayments: Collection<OrderPayment>;
  OrderDiscounts: Collection<OrderDiscount>;
  updateStatus: OrdersModule['updateStatus'];
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  const mutations = generateDbMutations<Order>(
    Orders,
    OrdersSchema
  ) as ModuleMutations<Order>;

  return {
    create: async (
      { orderNumber, currency, countryCode, billingAddress, contact },
      userId
    ) => {
      const orderId = await mutations.create(
        {
          created: new Date(),
          createdBy: userId,
          status: null,
          billingAddress,
          contact,
          userId,
          currency,
          countryCode,
          calculation: [],
          log: [],
          orderNumber,
        },
        userId
      );

      const order = await Orders.findOne(generateDbFilterById(orderId));
      emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId, userId) => {
      const deletedCount = await mutations.delete(orderId, userId);
      emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    setDeliveryProvider: async (
      orderId,
      deliveryProviderId,
      requestContext
    ) => {
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId = dbIdToString(
        delivery
          ? delivery._id
          : (
              await requestContext.modules.orders.deliveries.create(
                {
                  calculation: [],
                  deliveryProviderId,
                  log: [],
                  orderId,
                  status: null,
                },
                requestContext.userId
              )
            )._id
      );

      log(`Set Delivery Provider ${deliveryProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          deliveryId,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);

      emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId, requestContext) => {
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });
      const paymentId = dbIdToString(
        payment
          ? payment._id
          : (
              await requestContext.modules.orders.payments.create(
                {
                  calculation: [],
                  paymentProviderId,
                  log: [],
                  orderId,
                  status: null,
                },
                requestContext.userId
              )
            )._id
      );

      log(`Set Payment Provider ${paymentProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { paymentId, updated: new Date() },
      });

      const order = await updateCalculation(orderId, requestContext);

      emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },

    updateBillingAddress: async (orderId, billingAddress, requestContext) => {
      log('Update Invoicing Address', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          billingAddress,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'billing' });
      return order;
    },

    updateContact: async (orderId, contact, requestContext) => {
      log('Update Contact', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          contact,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateContext: async (orderId, context, requestContext) => {
      log('Update Arbitrary Context', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          context,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const order = await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE', { order, field: 'context' });
      return order;
    },

    updateStatus,
    updateCalculation,
  };
};
