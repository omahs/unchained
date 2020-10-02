import { log } from 'meteor/unchained:core-logger';
import { Products } from 'meteor/unchained:core-products';
import { ProductNotFoundError, InvalidIdError } from '../../errors';

export default function updateProductPlan(
  root,
  { plan, productId },
  { userId }
) {
  log(`mutation updateProductPlan ${productId}`, { userId });
  if (!productId) throw new InvalidIdError({ productId });
  const productObject = Products.updateProduct({ productId, plan });
  if (!productObject) throw new ProductNotFoundError({ productId });
  return productObject;
}
