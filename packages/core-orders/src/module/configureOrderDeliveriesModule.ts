import {
  Collection,
  Filter,
  ModuleMutations,
} from '@unchainedshop/types/common';
import { OrdersModule } from '@unchainedshop/types/orders';
import {
  OrderDeliveriesModule,
  OrderDelivery,
} from '@unchainedshop/types/orders.deliveries';
import { DeliveryPricingDirector } from 'meteor/unchained:core-delivery';
import { emit, registerEvents } from 'meteor/unchained:events';
import { log } from 'meteor/unchained:logger';
import {
  generateDbFilterById,
  generateDbMutations,
  objectInvert,
  dbIdToString,
} from 'meteor/unchained:utils';
import { OrderDeliveriesSchema } from '../db/OrderDeliveriesSchema';
import { OrderDeliveryStatus } from '../db/OrderDeliveryStatus';
import { OrderPricingSheet } from '../director/OrderPricingSheet';

const ORDER_DELIVERY_EVENTS: string[] = ['ORDER_DELIVER'];

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

  const mutations = generateDbMutations<OrderDelivery>(
    OrderDeliveries,
    OrderDeliveriesSchema
  ) as ModuleMutations<OrderDelivery>;

  const updateStatus: OrderDeliveriesModule['updateStatus'] = async (
    orderDeliveryId,
    { status, info },
    userId
  ) => {
    log(`OrderDelivery ${orderDeliveryId} -> New Status: ${status}`);

    const date = new Date();
    const modifier = {
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
      /* @ts-ignore */
      modifier.$set.delivered = date;
    }

    const selector = buildFindByIdSelector(orderDeliveryId);
    await OrderDeliveries.updateOne(selector, modifier);
    return await OrderDeliveries.findOne(selector);
  };

  return {
    // Queries
    findDelivery: async ({ orderDeliveryId }) => {
      return await OrderDeliveries.findOne(
        buildFindByIdSelector(orderDeliveryId)
      );
    },

    // Transformations
    discounts: (orderDelivery, { order, orderDiscount }, { modules }) => {
      if (!orderDelivery) return []
      
      const pricingSheet = modules.orders.deliveries.pricingSheet(
        orderDelivery,
        order.currency
      );

      return pricingSheet
        .discountPrices(orderDiscount._id as string)
        .map((discount) => ({
          delivery: orderDelivery,
          ...discount,
        }));
    },

    normalizedStatus: (orderDelivery) => {
      return objectInvert(OrderDeliveryStatus)[orderDelivery.status || null];
    },
    isBlockingOrderFullfillment: (orderDelivery) => {
      if (orderDelivery.status === OrderDeliveryStatus.DELIVERED) return false;
      return true;
    },
    pricingSheet: (orderDelivery, currency) => {
      return OrderPricingSheet({
        calculation: orderDelivery.calculation,
        currency,
      });
    },

    // Mutations

    create: async (doc, userId) => {
      const orderDeliveryId = await mutations.create(
        { ...doc, context: doc.context || {}, status: null },
        userId
      );

      const orderDelivery = await OrderDeliveries.findOne(
        buildFindByIdSelector(orderDeliveryId)
      );
      return orderDelivery;
    },

    delete: async (orderDeliveryId, userId) => {
      const deletedCount = await mutations.delete(orderDeliveryId, userId);
      return deletedCount;
    },

    markAsDelivered: async (orderDelivery, userId) => {
      if (orderDelivery.status !== OrderDeliveryStatus.OPEN) return;
      const updatedOrderDelivery = await updateStatus(
        orderDelivery._id as string,
        {
          status: OrderDeliveryStatus.DELIVERED,
          info: 'mark delivered manually',
        },
        userId
      );
      emit('ORDER_DELIVER', { orderDelivery: updatedOrderDelivery });
    },

    send: async (orderDelivery, { order, deliveryContext }, requestContext) => {
      if (orderDelivery.status !== OrderDeliveryStatus.OPEN)
        return orderDelivery;

      const deliveryProvider =
        await requestContext.modules.delivery.findProvider({
          deliveryProviderId: orderDelivery.deliveryProviderId,
        });

      const deliveryProviderId = dbIdToString(deliveryProvider._id);

      const address =
        orderDelivery.context?.address || order || order.billingAddress || {};

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
        requestContext
      );

      if (arbitraryResponseData) {
        return await updateStatus(
          dbIdToString(orderDelivery._id) as string,
          {
            status: OrderDeliveryStatus.DELIVERED,
            info: JSON.stringify(arbitraryResponseData),
          },
          requestContext.userId
        );
      }

      return orderDelivery;
    },

    updateDelivery: async (
      orderDeliveryId,
      { orderId, context },
      requestContext
    ) => {
      log(`OrderDelivery ${orderDeliveryId} -> Update Context`, {
        orderId,
      });

      const selector = buildFindByIdSelector(orderDeliveryId);
      await OrderDeliveries.updateOne(selector, {
        $set: {
          context: context || {},
          updated: new Date(),
          updatedBy: requestContext.userId,
        },
      });

      const orderDelivery = await OrderDeliveries.findOne(selector);
      await updateCalculation(orderId, requestContext);
      emit('ORDER_UPDATE_DELIVERY', { orderDelivery });
      return orderDelivery;
    },

    updateStatus,

    updateCalculation: async (orderDelivery, requestContext) => {
      log(`OrderDelivery ${orderDelivery._id} -> Update Calculation`, {
        orderId: orderDelivery.orderId,
      });

      const pricing = DeliveryPricingDirector.actions(
        {
          item: orderDelivery,
        },
        requestContext
      );
      const calculation = await pricing.calculate();

      await OrderDeliveries.updateOne(
        buildFindByIdSelector(orderDelivery._id as string),
        {
          $set: {
            calculation,
            updated: new Date(),
            updatedBy: requestContext.userId,
          },
        }
      );

      return true;
    },
  };
};
