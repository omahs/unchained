import { Context } from '@unchainedshop/types/api';
import { Enrollment } from '@unchainedshop/types/enrollments';
import { OrderPosition } from '@unchainedshop/types/orders.positions';
import { Product } from '@unchainedshop/types/products';
import { IWorkerAdapter } from '@unchainedshop/types/worker';
import {
  EnrollmentDirector,
  enrollmentsSettings,
  EnrollmentStatus,
} from '@unchainedshop/core-enrollments';
import { WorkerAdapter, WorkerDirector } from '@unchainedshop/core-worker';

const generateOrder = async (
  enrollment: Enrollment,
  params: {
    orderProducts: Array<{ orderPosition: OrderPosition; product: Product }>;
    orderContext?: any;
  } & { [x: string]: any },
  requestContext: Context,
) => {
  if (!enrollment.payment || !enrollment.delivery) return null;

  const { modules } = requestContext;
  const { orderProducts, orderContext, ...configuration } = params;
  let order = await modules.orders.create(
    {
      currency: enrollment.currencyCode,
      countryCode: enrollment.countryCode,
      contact: enrollment.contact,
      billingAddress: enrollment.billingAddress,
      originEnrollmentId: enrollment._id,
      ...configuration,
    },
    enrollment.userId,
  );
  const orderId = order._id;

  if (orderProducts) {
    await Promise.all(
      orderProducts.map(({ orderPosition, product }) =>
        modules.orders.positions.addProductItem(orderPosition, { order, product }, requestContext),
      ),
    );
  } else {
    const product = await modules.products.findProduct({
      productId: enrollment.productId,
    });
    await modules.orders.positions.addProductItem(
      { quantity: 1 },
      {
        order,
        product,
      },
      requestContext,
    );
  }

  const { paymentProviderId, context: paymentContext } = enrollment.payment;

  if (paymentProviderId) {
    await modules.orders.setPaymentProvider(orderId, paymentProviderId, requestContext);
  }
  const { deliveryProviderId, context: deliveryContext } = enrollment.delivery;
  if (deliveryProviderId) {
    await modules.orders.setDeliveryProvider(orderId, deliveryProviderId, requestContext);
  }

  order = await modules.orders.checkout(
    order._id,
    {
      paymentContext,
      deliveryContext,
      orderContext,
    },
    requestContext,
  );

  return order;
};

const GenerateOrderWorker: IWorkerAdapter<any, any> = {
  ...WorkerAdapter,

  key: 'shop.unchained.worker-plugin.generate-enrollment-orders',
  label: 'Generates new Orders from Enrollments',
  version: '1.0.0',
  type: 'ENROLLMENT_ORDER_GENERATOR',

  doWork: async (input, requestContext) => {
    const { modules } = requestContext;

    const enrollments = await modules.enrollments.findEnrollments({
      status: [EnrollmentStatus.ACTIVE, EnrollmentStatus.PAUSED],
    });

    const errors = (
      await Promise.all(
        enrollments.map(async (enrollment) => {
          try {
            const director = await EnrollmentDirector.actions({ enrollment }, requestContext as Context); // TODO: Type Refactor
            const period = await director.nextPeriod();
            if (period) {
              const configuration = await director.configurationForOrder({
                ...input,
                period,
              });
              if (configuration) {
                const order = await generateOrder(enrollment, configuration, requestContext as Context); // TODO: Type Refactor
                if (order) {
                  await modules.enrollments.addEnrollmentPeriod(enrollment._id, {
                    ...period,
                    orderId: order._id,
                  });
                }
              }
            }
          } catch (e) {
            return {
              name: e.name,
              message: e.message,
              stack: e.stack,
            };
          }
          return null;
        }),
      )
    ).filter(Boolean);

    if (errors.length) {
      return {
        success: false,
        error: {
          name: 'SOME_ENROLLMENTS_COULD_NOT_PROCESS',
          message: 'Some errors have been reported during order generation',
          logs: errors,
        },
        result: {},
      };
    }
    return {
      success: true,
      result: input,
    };
  },
};

WorkerDirector.registerAdapter(GenerateOrderWorker);

export const configureGenerateOrderAutoscheduling = () => {
  if (enrollmentsSettings.autoSchedulingSchedule) {
    WorkerDirector.configureAutoscheduling(GenerateOrderWorker, {
      schedule: enrollmentsSettings.autoSchedulingSchedule,
      input: enrollmentsSettings.autoSchedulingInput,
    });
  }
};
