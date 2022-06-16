import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';

export default async function translatedProductTexts(
  root: Root,
  { productId }: { productId: string },
  { modules, userId }: Context,
) {
  log(`query translatedProductTexts ${productId}`, { userId });

  return modules.products.texts.findTexts({ productId });
}
