import { Context, SortOption } from '@unchainedshop/types/api';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import {
  Enrollment,
  EnrollmentQuery,
  EnrollmentsModule,
  EnrollmentsSettingsOptions,
} from '@unchainedshop/types/enrollments';
import type { Locale } from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import { log } from '@unchainedshop/logger';
import { generateDbFilterById, generateDbMutations, buildSortOptions } from '@unchainedshop/utils';
import { EnrollmentsCollection } from '../db/EnrollmentsCollection';
import { EnrollmentsSchema } from '../db/EnrollmentsSchema';
import { EnrollmentStatus } from '../db/EnrollmentStatus';
import { EnrollmentDirector } from '../enrollments-index';
import { enrollmentsSettings } from '../enrollments-settings';

const ENROLLMENT_EVENTS: string[] = [
  'ENROLLMENT_ADD_PERIOD',
  'ENROLLMENT_CREATE',
  'ENROLLMENT_REMOVE',
  'ENROLLMENT_UPDATE',
];

const buildFindSelector = ({ queryString, status, userId }: EnrollmentQuery) => {
  const selector: {
    deleted: Date;
    status?: any;
    $text?: { $search?: string };
    userId?: string;
  } = {
    deleted: null,
  };
  if (status) selector.status = { $in: status };
  if (userId) selector.userId = userId;

  if (queryString) selector.$text = { $search: queryString };

  return selector;
};

export const configureEnrollmentsModule = async ({
  db,
  options: enrollmentOptions = {},
}: ModuleInput<EnrollmentsSettingsOptions>): Promise<EnrollmentsModule> => {
  registerEvents(ENROLLMENT_EVENTS);

  enrollmentsSettings.configureSettings(enrollmentOptions);

  const Enrollments = await EnrollmentsCollection(db);

  const mutations = generateDbMutations<Enrollment>(
    Enrollments,
    EnrollmentsSchema,
  ) as ModuleMutations<Enrollment>;

  const findNewEnrollmentNumber = async (enrollment: Enrollment, index = 0): Promise<string> => {
    const newHashID = enrollmentsSettings.enrollmentNumberHashFn(enrollment, index);
    if ((await Enrollments.countDocuments({ enrollmentNumber: newHashID }, { limit: 1 })) === 0) {
      return newHashID;
    }
    return findNewEnrollmentNumber(enrollment, index + 1);
  };

  const findNextStatus = async (
    enrollment: Enrollment,
    requestContext: Context,
  ): Promise<EnrollmentStatus> => {
    let status = enrollment.status as EnrollmentStatus;
    const director = await EnrollmentDirector.actions({ enrollment }, requestContext);

    if (status === EnrollmentStatus.INITIAL || status === EnrollmentStatus.PAUSED) {
      if (await director.isValidForActivation()) {
        status = EnrollmentStatus.ACTIVE;
      }
    } else if (status === EnrollmentStatus.ACTIVE) {
      if (await director.isOverdue()) {
        status = EnrollmentStatus.PAUSED;
      }
    } else if (requestContext.modules.enrollments.isExpired(enrollment, {})) {
      status = EnrollmentStatus.TERMINATED;
    }

    return status;
  };

  const updateStatus: EnrollmentsModule['updateStatus'] = async (
    enrollmentId,
    { status, info = '' },
    requestContext,
  ) => {
    const selector = generateDbFilterById(enrollmentId);
    const enrollment = await Enrollments.findOne(selector, {});

    if (enrollment.status === status) return enrollment;

    const date = new Date();
    const modifier: {
      $set: Partial<Enrollment>;
      $push: { log: Enrollment['log'][0] };
    } = {
      $set: { status, updated: new Date(), updatedBy: requestContext.userId },
      $push: {
        log: {
          date,
          status,
          info,
        },
      },
    };

    switch (status) {
      case EnrollmentStatus.ACTIVE:
        modifier.$set.enrollmentNumber = await findNewEnrollmentNumber(enrollment);
        break;
      case EnrollmentStatus.TERMINATED:
        modifier.$set.expires = enrollment.periods?.pop()?.end || new Date();
        break;
      default:
        break;
    }

    log(`New Status: ${status}`, { enrollmentId });

    await Enrollments.updateOne(selector, modifier);

    const updatedEnrollment = await Enrollments.findOne(selector, {});

    emit('ENROLLMENT_UPDATE', { enrollment, field: 'status' });

    return updatedEnrollment;
  };

  const reactivateEnrollment = async (enrollment: Enrollment) => {
    return enrollment;
  };

  const processEnrollment = async (
    enrollment: Enrollment,
    params: { enrollmentContext?: any; orderIdForFirstPeriod?: string },
    requestContext: Context,
  ) => {
    let status = await findNextStatus(enrollment, requestContext);

    if (status === EnrollmentStatus.ACTIVE) {
      const nextEnrollment = await reactivateEnrollment(enrollment);
      status = await findNextStatus(nextEnrollment, requestContext);
    }

    return updateStatus(enrollment._id, { status, info: 'enrollment processed' }, requestContext);
  };

  const initializeEnrollment = async (
    enrollment: Enrollment,
    params: { orderIdForFirstPeriod?: string; reason: string },
    requestContext: Context,
  ) => {
    const { modules, userId } = requestContext;

    // const user = await modules.users.findUserById(enrollment.userId);
    // const locale = modules.users.userLocale(user, requestContext);
    // const reason = "new_enrollment";

    const director = await EnrollmentDirector.actions({ enrollment }, requestContext);
    const period = await director.nextPeriod();

    if (period && (params.orderIdForFirstPeriod || period.isTrial)) {
      const intializedEnrollment = await modules.enrollments.addEnrollmentPeriod(
        enrollment._id,
        { ...period, orderId: params.orderIdForFirstPeriod },
        userId,
      );

      return processEnrollment(intializedEnrollment, params, requestContext);
    }

    return processEnrollment(enrollment, params, requestContext);
  };

  const sendStatusToCustomer = async (
    enrollment: Enrollment,
    params: { locale?: Locale; reason?: string },
    requestContext: Context,
  ) => {
    const { modules, userId } = requestContext;

    let { locale } = params;
    if (!locale) {
      const user = await modules.users.findUserById(enrollment.userId);
      locale = modules.users.userLocale(user, requestContext);
    }

    await modules.worker.addWork(
      {
        type: 'MESSAGE',
        retries: 0,
        input: {
          reason: params.reason || 'status_change',
          locale,
          template: 'ENROLLMENT_STATUS',
          enrollmentId: enrollment._id,
        },
      },
      userId,
    );

    return enrollment;
  };

  const updateEnrollmentField =
    (fieldKey: string) => async (enrollmentId: string, fieldValue: any, userId?: string) => {
      log(`Update enrollment field ${fieldKey.toUpperCase()}`, {
        enrollmentId,
        userId,
      });

      await mutations.update(enrollmentId, { $set: { [fieldKey]: fieldValue } }, userId);

      const enrollment = await Enrollments.findOne(generateDbFilterById(enrollmentId), {});

      emit('ENROLLMENT_UPDATE', { enrollment, field: fieldKey });

      return enrollment;
    };

  return {
    // Queries
    count: async (query: EnrollmentQuery) => {
      const enrollmentCount = await Enrollments.countDocuments(buildFindSelector(query));
      return enrollmentCount;
    },

    findEnrollment: async ({ enrollmentId, orderId }, options) => {
      const selector = enrollmentId
        ? generateDbFilterById(enrollmentId)
        : { 'periods.orderId': orderId };

      return Enrollments.findOne(selector, options);
    },

    findEnrollments: async ({
      limit,
      offset,
      sort,
      ...query
    }: EnrollmentQuery & { limit?: number; offset?: number; sort?: Array<SortOption> }) => {
      const enrollments = Enrollments.find(buildFindSelector(query), {
        skip: offset,
        limit,
        sort: buildSortOptions(sort),
      });

      return enrollments.toArray();
    },

    // Transformations
    normalizedStatus: (enrollment) => {
      return enrollment.status === null
        ? EnrollmentStatus.INITIAL
        : (enrollment.status as EnrollmentStatus);
    },

    isExpired: (enrollment, { referenceDate }) => {
      const relevantDate = referenceDate ? new Date(referenceDate) : new Date();
      const expiryDate = new Date(enrollment.expires);
      const isExpired = relevantDate.getTime() > expiryDate.getTime();
      return isExpired;
    },

    // Processing
    terminateEnrollment: async (enrollment, { enrollmentContext }, requestContext) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(
        enrollment._id,
        {
          status: EnrollmentStatus.TERMINATED,
          info: 'terminated manually',
        },
        requestContext,
      );

      updatedEnrollment = await processEnrollment(
        updatedEnrollment,
        { enrollmentContext },
        requestContext,
      );

      return sendStatusToCustomer(updatedEnrollment, {}, requestContext);
    },

    activateEnrollment: async (enrollment, { enrollmentContext }, requestContext) => {
      if (enrollment.status === EnrollmentStatus.TERMINATED) return enrollment;

      let updatedEnrollment = await updateStatus(
        enrollment._id,
        {
          status: EnrollmentStatus.ACTIVE,
          info: 'activated manually',
        },
        requestContext,
      );

      updatedEnrollment = await processEnrollment(
        updatedEnrollment,
        { enrollmentContext },
        requestContext,
      );

      return sendStatusToCustomer(updatedEnrollment, {}, requestContext);
    },

    // Mutations
    addEnrollmentPeriod: async (enrollmentId, period, userId) => {
      const { start, end, orderId, isTrial } = period;
      const selector = generateDbFilterById(enrollmentId);
      await Enrollments.updateOne(selector, {
        $push: {
          periods: {
            start,
            end,
            orderId,
            isTrial,
          },
        },
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
      });
      const enrollment = await Enrollments.findOne(selector, {});

      emit('ENROLLMENT_ADD_PERIOD', { enrollment });

      return enrollment;
    },

    create: async (
      { countryCode, currencyCode, orderIdForFirstPeriod, ...enrollmentData },
      requestContext,
    ) => {
      const { userId, services } = requestContext;

      log('Create Enrollment', { userId });

      const currency =
        currencyCode ||
        (await services.countries.resolveDefaultCurrencyCode(
          {
            isoCode: countryCode,
          },
          requestContext,
        ));

      const enrollmentId = await mutations.create(
        {
          ...enrollmentData,
          status: EnrollmentStatus.INITIAL,
          periods: [],
          currencyCode: currency,
          countryCode,
          configuration: enrollmentData.configuration || [],
          log: [],
        },
        userId,
      );

      const newEnrollment = await Enrollments.findOne(generateDbFilterById(enrollmentId), {});

      const reason = 'new_enrollment';

      const initializedEnrollment = await initializeEnrollment(
        newEnrollment,
        {
          orderIdForFirstPeriod,
          reason,
        },
        requestContext,
      );

      const enrollment = await sendStatusToCustomer(
        initializedEnrollment,
        {
          reason,
        },
        requestContext,
      );

      emit('ENROLLMENT_CREATE', { enrollment });

      return enrollment;
    },

    createFromCheckout: async (order, { items, context }, requestContext) => {
      const { modules } = requestContext;
      const orderId = order._id;

      const payment = await modules.orders.payments.findOrderPayment({
        orderPaymentId: order.paymentId,
      });
      const delivery = await modules.orders.deliveries.findDelivery({
        orderDeliveryId: order.deliveryId,
      });

      const template = {
        billingAddress: order.billingAddress,
        contact: order.contact,
        countryCode: order.countryCode,
        currencyCode: order.currency,
        delivery: {
          deliveryProviderId: delivery.deliveryProviderId,
          context: delivery.context,
        },
        orderIdForFirstPeriod: orderId,
        payment: {
          paymentProviderId: payment.paymentProviderId,
          context: payment.context,
        },
        userId: order.userId,

        // TODO: Check with pascal
        meta: order.context,

        ...context,
      };

      const enrollments = await Promise.all(
        items.map(async (item) => {
          const enrollmentData = await EnrollmentDirector.transformOrderItemToEnrollment(
            item,
            template,
            requestContext,
          );

          return modules.enrollments.create(enrollmentData, requestContext);
        }),
      );

      return enrollments;
    },

    delete: async (enrollmentId, userId) => {
      const deletedCount = await mutations.delete(enrollmentId, userId);
      emit('ORDER_REMOVE', { enrollmentId });
      return deletedCount;
    },

    removeEnrollmentPeriodByOrderId: async (enrollmentId, orderId, userId) => {
      const selector = generateDbFilterById(enrollmentId);
      await Enrollments.updateOne(selector, {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },

        $pull: {
          periods: { orderId: { $in: [orderId, undefined, null] } },
        },
      });

      return Enrollments.findOne(selector, {});
    },

    updateBillingAddress: updateEnrollmentField('billingAddress'),
    updateContact: updateEnrollmentField('contact'),
    updateContext: updateEnrollmentField('context'),
    updateDelivery: updateEnrollmentField('delivery'),
    updatePayment: updateEnrollmentField('payment'),

    updatePlan: async (enrollmentId, plan, requestContext) => {
      const { userId } = requestContext;

      log(`Update enrollment plan fields`, {
        enrollmentId,
        userId,
      });

      await mutations.update(
        enrollmentId,
        {
          productId: plan.productId,
          quantity: plan.quantity,
          configuration: plan.configuration,
        },
        userId,
      );

      const selector = generateDbFilterById(enrollmentId);
      const enrollment = await Enrollments.findOne(selector, {});

      emit('ENROLLMENT_UPDATE', { enrollment, field: 'plan' });

      const reason = 'updated_plan';
      const initializedEnrollment = await initializeEnrollment(enrollment, { reason }, requestContext);

      return sendStatusToCustomer(initializedEnrollment, { reason }, requestContext);
    },

    updateStatus,
  };
};
