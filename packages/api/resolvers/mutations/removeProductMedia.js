import { log } from 'meteor/unchained:core-logger';
import { ProductMedia } from 'meteor/unchained:core-products';
import { ProductMediaNotFoundError, InvalidIdError } from '../../errors';

export default function (root, { productMediaId }, { userId }) {
  log(`mutation removeProductMedia ${productMediaId}`, { userId });
  if (!productMediaId) throw new InvalidIdError({ productMediaId });
  const productMedia = ProductMedia.findOne({ _id: productMediaId });
  if (!productMedia) throw new ProductMediaNotFoundError({ productMediaId });
  ProductMedia.remove({ _id: productMediaId });
  return productMedia;
}
