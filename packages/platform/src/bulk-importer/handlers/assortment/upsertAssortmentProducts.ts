import { Context } from '@unchainedshop/types/api';
import { AssortmentProduct } from '@unchainedshop/types/assortments';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase';

const upsert = async (assortmentProduct: AssortmentProduct, unchainedAPI: Context) => {
  const { modules } = unchainedAPI;
  if (
    !(await modules.products.productExists({
      productId: assortmentProduct.productId,
    }))
  ) {
    throw new Error(`Can't link non-existing product ${assortmentProduct.productId}`);
  }
  try {
    const newAssortmentProduct = await modules.assortments.products.create(assortmentProduct, {
      skipInvalidation: true,
    });
    return newAssortmentProduct;
  } catch (e) {
    return modules.assortments.products.update(assortmentProduct._id, assortmentProduct, {
      skipInvalidation: true,
    });
  }
};

export default async ({ products, assortmentId }, unchainedAPI: Context) => {
  const { modules } = unchainedAPI;
  const assortmentProductIds = await Promise.all(
    products.map(async (product: AssortmentProduct) => {
      const tags = convertTagsToLowerCase(product?.tags);
      const assortmentProduct = await upsert(
        {
          ...product,
          tags,
          assortmentId,
        },
        unchainedAPI,
      );
      return assortmentProduct._id;
    }),
  );

  await modules.assortments.products.deleteMany(
    {
      _id: { $nin: assortmentProductIds },
      assortmentId,
    },
    { skipInvalidation: true },
  );
};
