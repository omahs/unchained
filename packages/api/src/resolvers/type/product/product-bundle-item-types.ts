import { ProductBundleItemHelperTypes } from '@unchainedshop/types/products';

export const ProductBundleItem: ProductBundleItemHelperTypes = {
  product: async (productItem, _, { modules }) => {
    return modules.products.findProduct({
      productId: productItem.productId,
    });
  },
};
