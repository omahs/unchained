import { Context } from '@unchainedshop/types/api';
import { EnrollmentPlan as EnrollmentPlanType } from '@unchainedshop/types/enrollments';
import { Product } from '@unchainedshop/types/products';

type HelperType<T> = (enrollmentPlan: EnrollmentPlanType, _: never, context: Context) => T;

type EnrollmentPlanHelperTypes = {
  product: HelperType<Promise<Product>>;
};

export const EnrollmentPlan: EnrollmentPlanHelperTypes = {
  product: async (plan, _, { loaders }) => {
    const product = await loaders.productLoader.load({
      productId: plan.productId,
      includeDrafts: true,
    });
    return product;
  },
};
