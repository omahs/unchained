import { UnchainedCore } from '@unchainedshop/types/core.js';
import upsertAssortmentContent from './upsertAssortmentContent.js';
import upsertAssortmentProducts from './upsertAssortmentProducts.js';
import upsertAssortmentChildren from './upsertAssortmentChildren.js';
import upsertAssortmentFilters from './upsertAssortmentFilters.js';
import upsertMedia from './upsertMedia.js';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';

export default async function updateAssortment(payload: any, { logger }, unchainedAPI: UnchainedCore) {
  const { modules } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;

  if (!(await modules.assortments.assortmentExists({ assortmentId: _id }))) {
    throw new Error(`Can't update non-existing assortment ${_id}`);
  }

  if (specification) {
    logger.debug('update assortment object', specification);

    specification.tags = convertTagsToLowerCase(specification?.tags);

    await unchainedAPI.modules.assortments.update(_id, { ...specification });
    if (specification.content) {
      logger.debug('replace localized content for assortment', specification.content);
      await upsertAssortmentContent(
        {
          content: specification.content,
          assortmentId: _id,
        },
        unchainedAPI,
      );
    }
  }

  if (products) {
    logger.debug('update product products', products);
    await upsertAssortmentProducts(
      {
        products: products || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }

  if (children) {
    logger.debug('update assortment children', children);
    await upsertAssortmentChildren(
      {
        children: children || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }

  if (filters) {
    logger.debug('update assortment filters', filters);
    await upsertAssortmentFilters(
      {
        filters: filters || [],
        assortmentId: _id,
      },
      unchainedAPI,
    );
  }
  if (media) {
    logger.debug('update assortment media', media);
    await upsertMedia({ media: media || [], assortmentId: _id }, unchainedAPI);
  }

  return {
    entity: 'ASSORTMENT',
    operation: 'update',
    _id,
    success: true,
  };
}
