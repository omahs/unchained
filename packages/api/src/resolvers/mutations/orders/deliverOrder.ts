import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { OrderDeliveryStatus } from '@unchainedshop/types/orders.deliveries';
import {
  OrderNotFoundError,
  OrderWrongDeliveryStatusError,
  OrderWrongStatusError,
  InvalidIdError,
} from '../../../errors';

export default async function deliverOrder(
  root: Root,
  { orderId }: { orderId: string },
  context: Context,
) {
  const { modules, userId } = context;
  log('mutation deliverOrder', { orderId, userId });

  if (!orderId) throw new InvalidIdError({ orderId });

  const order = await modules.orders.findOrder({ orderId });
  if (!order) throw new OrderNotFoundError({ orderId });

  if (modules.orders.isCart(order)) {
    throw new OrderWrongStatusError({ status: order.status });
  }

  const orderDelivery = await modules.orders.deliveries.findDelivery({
    orderDeliveryId: order.deliveryId,
  });

  if (
    modules.orders.deliveries.normalizedStatus(orderDelivery) !== OrderDeliveryStatus.OPEN &&
    order.confirmed
  ) {
    throw new OrderWrongDeliveryStatusError({
      status: orderDelivery.status,
    });
  }

  await modules.orders.deliveries.markAsDelivered(orderDelivery);
  return modules.orders.processOrder(order, {}, context);
}
