import { UnchainedCore } from '@unchainedshop/types/core.js';
import convertTagsToLowerCase from '../utils/convertTagsToLowerCase.js';
import upsertAssortmentChildren from './upsertAssortmentChildren.js';
import upsertAssortmentContent from './upsertAssortmentContent.js';
import upsertAssortmentFilters from './upsertAssortmentFilters.js';
import upsertAssortmentProducts from './upsertAssortmentProducts.js';
import upsertMedia from './upsertMedia.js';

export default async function createAssortment(
  payload: any,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: UnchainedCore,
) {
  const { modules } = unchainedAPI;
  const { media, specification, products, children, filters, _id } = payload;
  if (!specification) throw new Error(`Specification is required when creating new assortment ${_id}`);

  if (!specification.content)
    throw new Error(`Assortment content is required when creating new assortment${_id}`);

  specification.tags = convertTagsToLowerCase(specification?.tags);

  logger.debug('create assortment object', specification);
  try {
    await modules.assortments.create({ ...specification, _id });
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;
    logger.debug('entity already exists, falling back to update', specification);
    await modules.assortments.update(_id, {
      ...specification,
    });
  }

  if (!(await modules.assortments.assortmentExists({ assortmentId: _id }))) {
    throw new Error(`Can't create assortment ${_id}, fields missing?`);
  }

  logger.debug('create localized content for assortment', specification.content);
  await upsertAssortmentContent(
    {
      content: specification.content,
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment products', products);
  await upsertAssortmentProducts(
    {
      products: products || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment children', children);
  await upsertAssortmentChildren(
    {
      children: children || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment filters', filters);
  await upsertAssortmentFilters(
    {
      filters: filters || [],
      assortmentId: _id,
    },
    unchainedAPI,
  );

  logger.debug('create assortment media', media);
  await upsertMedia({ media: media || [], assortmentId: _id }, unchainedAPI);

  return {
    entity: 'ASSORTMENT',
    operation: 'create',
    _id,
    success: true,
  };
}
