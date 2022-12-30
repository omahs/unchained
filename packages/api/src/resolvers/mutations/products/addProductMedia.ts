import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { ProductNotFoundError, InvalidIdError } from '../../../errors.js';

export default async function addProductMedia(root: Root, { media, productId }, context: Context) {
  const { modules, services, userId } = context;
  log(`mutation addProductMedia ${productId}`, { userId });

  if (!productId) throw new InvalidIdError({ productId });

  const product = await modules.products.findProduct({ productId });
  if (!product) throw new ProductNotFoundError({ productId });

  const file = await services.files.uploadFileFromStream(
    {
      directoryName: 'product-media',
      rawFile: media,
      meta: { productId },
    },
    context,
  );

  return modules.products.media.create({ productId, mediaId: file._id });
}
