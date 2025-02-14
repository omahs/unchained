import { Collection } from '@unchainedshop/types/common.js';
import { ModuleMutations } from '@unchainedshop/types/core.js';
import { Order, OrderStatus, OrderMutations, OrdersModule } from '@unchainedshop/types/orders.js';
import { OrderDelivery } from '@unchainedshop/types/orders.deliveries.js';
import { OrderPayment } from '@unchainedshop/types/orders.payments.js';
import { emit, registerEvents } from '@unchainedshop/events';
import { log, LogLevel } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { OrdersSchema } from '../db/OrdersSchema.js';

const ORDER_EVENTS: string[] = [
  'ORDER_CREATE',
  'ORDER_REMOVE',
  'ORDER_SET_DELIVERY_PROVIDER',
  'ORDER_SET_PAYMENT_PROVIDER',
  'ORDER_UPDATE',
];

export const configureOrderModuleMutations = ({
  Orders,
  OrderDeliveries,
  OrderPayments,
  initProviders,
  updateStatus,
  updateCalculation,
}: {
  Orders: Collection<Order>;
  OrderDeliveries: Collection<OrderDelivery>;
  OrderPayments: Collection<OrderPayment>;
  initProviders: OrdersModule['initProviders'];
  updateStatus: OrdersModule['updateStatus'];
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderMutations => {
  registerEvents(ORDER_EVENTS);

  const mutations = generateDbMutations<Order>(Orders, OrdersSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<Order>;

  return {
    create: async ({ userId, orderNumber, currency, countryCode, billingAddress, contact }) => {
      const orderId = await mutations.create({
        created: new Date(),
        status: null,
        billingAddress,
        contact,
        userId,
        currency,
        countryCode,
        calculation: [],
        log: [],
        orderNumber,
      });

      const order = await Orders.findOne(generateDbFilterById(orderId), {});

      await emit('ORDER_CREATE', { order });
      return order;
    },

    delete: async (orderId) => {
      const deletedCount = await mutations.delete(orderId);
      await emit('ORDER_REMOVE', { orderId });
      return deletedCount;
    },

    initProviders,

    invalidateProviders: async (unchainedAPI, maxAgeDays = 30) => {
      log('Orders: Start invalidating cart providers', {
        level: LogLevel.Verbose,
      });

      const ONE_DAY_IN_MILLISECONDS = 86400000;

      const minValidDate = new Date(new Date().getTime() - maxAgeDays * ONE_DAY_IN_MILLISECONDS);

      const orders = await Orders.find({
        status: { $eq: null },
        updated: { $gte: minValidDate },
      }).toArray();

      await Promise.all(orders.map((order) => initProviders(order, unchainedAPI)));
    },

    setDeliveryProvider: async (orderId, deliveryProviderId, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const delivery = await OrderDeliveries.findOne({
        orderId,
        deliveryProviderId,
      });
      const deliveryId =
        delivery?._id ||
        (
          await modules.orders.deliveries.create({
            calculation: [],
            deliveryProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;

      log(`Set Delivery Provider ${deliveryProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          deliveryId,
          updated: new Date(),
        },
      });

      const order = await updateCalculation(orderId, unchainedAPI);

      await emit('ORDER_SET_DELIVERY_PROVIDER', {
        order,
        deliveryProviderId,
      });

      return order;
    },

    setPaymentProvider: async (orderId, paymentProviderId, unchainedAPI) => {
      const { modules } = unchainedAPI;
      const payment = await OrderPayments.findOne({
        orderId,
        paymentProviderId,
      });

      const paymentId =
        payment?._id ||
        (
          await modules.orders.payments.create({
            calculation: [],
            paymentProviderId,
            log: [],
            orderId,
            status: null,
          })
        )._id;
      log(`Set Payment Provider ${paymentProviderId}`, { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: { paymentId, updated: new Date() },
      });

      const order = await updateCalculation(orderId, unchainedAPI);

      await emit('ORDER_SET_PAYMENT_PROVIDER', {
        order,
        paymentProviderId,
      });

      return order;
    },

    updateBillingAddress: async (orderId, billingAddress, unchainedAPI) => {
      log('Update Invoicing Address', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          billingAddress,
          updated: new Date(),
        },
      });

      const order = await updateCalculation(orderId, unchainedAPI);
      await emit('ORDER_UPDATE', { order, field: 'billing' });
      return order;
    },

    updateContact: async (orderId, contact, unchainedAPI) => {
      log('Update Contact', { orderId });

      const selector = generateDbFilterById(orderId);
      await Orders.updateOne(selector, {
        $set: {
          contact,
          updated: new Date(),
        },
      });

      const order = await updateCalculation(orderId, unchainedAPI);
      await emit('ORDER_UPDATE', { order, field: 'contact' });
      return order;
    },

    updateContext: async (orderId, context, unchainedAPI) => {
      if (!context) return false;

      log('Update Arbitrary Context', { orderId, context });
      const selector = generateDbFilterById<Order>(orderId);
      selector.status = { $in: [null, OrderStatus.PENDING] };
      const order = await Orders.findOne(selector);

      const result = await Orders.updateOne(selector, {
        $set: {
          context: { ...(order.context || {}), ...context },
          updated: new Date(),
        },
      });

      if (result.modifiedCount) {
        const calculatedOrder = await updateCalculation(orderId, unchainedAPI);
        await emit('ORDER_UPDATE', { order: calculatedOrder, field: 'context' });
        return true;
      }
      return false;
    },

    updateStatus,
    updateCalculation,
  };
};
