import { Collection, Filter, ModuleMutations, Update } from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderDeliveriesModule,
  OrderDelivery,
  OrderDeliveryStatus,
} from '@unchainedshop/types/orders.deliveries';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations } from '@unchainedshop/utils';
import { OrderDeliveriesSchema } from '../db/OrderDeliveriesSchema';

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER', 'ORDER_UPDATE_DELIVERY'];

const buildFindByIdSelector = (orderDeliveryId: string) =>
  generateDbFilterById(orderDeliveryId) as Filter<OrderDelivery>;

export const configureOrderDeliveriesModule = ({
  OrderDeliveries,
  updateCalculation,
}: {
  OrderDeliveries: Collection<OrderDelivery>;
  updateCalculation: OrdersModule['updateCalculation'];
}): OrderDeliveriesModule => {
  registerEvents(ORDER_DELIVERY_EVENTS);

  const mutations = generateDbMutations<OrderDelivery>(OrderDeliveries, OrderDeliveriesSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<OrderDelivery>;

  const normalizedStatus: OrderDeliveriesModule['normalizedStatus'] = (orderDelivery) => {
    return orderDelivery.status === null
      ? OrderDeliveryStatus.OPEN
      : (orderDelivery.status as OrderDeliveryStatus);
  };

  const updateStatus: OrderDeliveriesModule['updateStatus'] = async (
    orderDeliveryId,
    { status, info },
    userId,
  ) => {
    log(`OrderDelivery ${orderDeliveryId} -> New Status: ${status}`);

    const date = new Date();
    const modifier: Update<OrderDelivery> = {
      $set: { status, updated: new Date(), updatedBy: userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };
    if (status === OrderDeliveryStatus.DELIVERED) {
      modifier.$set.delivered = date;
    }

    const selector = buildFindByIdSelector(orderDeliveryId);
    await OrderDeliveries.updateOne(selector, modifier);
    return OrderDeliveries.findOne(selector, {});
  };

  return {
    // Queries
    findDelivery: async ({ orderDeliveryId }, options) => {
      return OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId), options);
    },

    // Transformations
    discounts: (orderDelivery, { order, orderDiscount }, context) => {
      const { modules } = context;
      if (!orderDelivery) return [];

      const pricingSheet = modules.orders.deliveries.pricingSheet(
        orderDelivery,
        order.currency,
        context,
      );

      return pricingSheet.discountPrices(orderDiscount._id).map((discount) => ({
        delivery: orderDelivery,
        ...discount,
      }));
    },

    isBlockingOrderConfirmation: async (orderDelivery, requestContext) => {
      const provider = await requestContext.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      const isAutoReleaseAllowed = await requestContext.modules.delivery.isAutoReleaseAllowed(
        provider,
        requestContext,
      );

      return !isAutoReleaseAllowed;
    },
    isBlockingOrderFullfillment: (orderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },

    normalizedStatus,

    pricingSheet: (orderDelivery, currency, { modules }) => {
      return modules.delivery.pricingSheet({
        calculation: orderDelivery.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc, userId) => {
      const orderDeliveryId = await mutations.create(
        { ...doc, context: doc.context || {}, status: null },
        userId,
      );

      const orderDelivery = await OrderDeliveries.findOne(buildFindByIdSelector(orderDeliveryId));
      return orderDelivery;
    },

    delete: async (orderDeliveryId, userId) => {
      const deletedCount = await mutations.delete(orderDeliveryId, userId);
      return deletedCount;
    },

    markAsDelivered: async (orderDelivery, userId) => {
      if (normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN) return;
      const updatedOrderDelivery = await updateStatus(
        orderDelivery._id,
        {
          status: OrderDeliveryStatus.DELIVERED,
          info: 'mark delivered manually',
        },
        userId,
      );
      emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
    },

    send: async (orderDelivery, { order, deliveryContext }, requestContext) => {
      if (normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN) return orderDelivery;

      const deliveryProvider = await requestContext.modules.delivery.findProvider({
        deliveryProviderId: orderDelivery.deliveryProviderId,
      });

      const deliveryProviderId = deliveryProvider._id;

      const address = orderDelivery.context?.address || order || order.billingAddress || {};

      const arbitraryResponseData = await requestContext.modules.delivery.send(
        deliveryProviderId,
        {
          order,
          orderDelivery,
          transactionContext: {
            ...(deliveryContext || {}),
            ...(orderDelivery.context || {}),
            address,
          },
        },
        requestContext,
      );

      if (arbitraryResponseData) {
        return updateStatus(
          orderDelivery._id,
          {
            status: OrderDeliveryStatus.DELIVERED,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId,
        );
      }

      return orderDelivery;
    },

    updateContext: async (orderDeliveryId, context, requestContext) => {
      const selector = buildFindByIdSelector(orderDeliveryId);
      const orderDelivery = await OrderDeliveries.findOne(selector, {});
      const { orderId } = orderDelivery;

      log(`OrderDelivery ${orderDeliveryId} -> Update Context`, {
        orderId,
      });

      const result = await OrderDeliveries.updateOne(selector, {
        $set: {
          context: { ...(orderDelivery.context || {}), ...context },
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      if (result.modifiedCount) {
        await updateCalculation(orderId, requestContext);
        emit('ORDER_UPDATE_DELIVERY', {
          orderDelivery: {
            ...orderDelivery,
            context: { ...(orderDelivery.context || {}), ...context },
          },
        });
        return true;
      }

      return false;
    },

    updateStatus,

    updateCalculation: async (orderDelivery, requestContext) => {
      log(`OrderDelivery ${orderDelivery._id} -> Update Calculation`, {
        orderId: orderDelivery.orderId,
      });

      const calculation = await requestContext.modules.delivery.calculate(
        {
          item: orderDelivery,
        },
        requestContext,
      );

      const selector = buildFindByIdSelector(orderDelivery._id);
      await OrderDeliveries.updateOne(selector, {
        $set: {
          calculation,
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      return OrderDeliveries.findOne(selector);
    },
  };
};
