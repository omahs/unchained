import { ProductMedia, ProductMediaText } from '@unchainedshop/types/products.media.js';
import { Db } from '@unchainedshop/types/common.js';
import { buildDbIndexes } from '@unchainedshop/utils';

export const ProductMediaCollection = async (db: Db) => {
  const ProductMedias = db.collection<ProductMedia>('product_media');
  const ProductMediaTexts = db.collection<ProductMediaText>('product_media_texts');

  // ProductMedia Indexes
  await buildDbIndexes(ProductMedias, [
    { index: { mediaId: 1 } },
    { index: { productId: 1 } },
    { index: { sortKey: 1 } },
    { index: { tags: 1 } },
  ]);

  // ProductMediaTexts indexes
  await buildDbIndexes(ProductMediaTexts, [{ index: { productMediaId: 1 } }, { index: { locale: 1 } }]);

  return {
    ProductMedias,
    ProductMediaTexts,
  };
};
