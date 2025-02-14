import { UnchainedCore } from '@unchainedshop/types/core.js';
import upsertFilterContent from './upsertFilterContent.js';
import upsertFilterOptionContent from './upsertFilterOptionContent.js';

export default async function createFilter(
  payload: any,
  { logger, createShouldUpsertIfIDExists },
  unchainedAPI: UnchainedCore,
) {
  const { modules } = unchainedAPI;
  const { specification, _id } = payload;

  if (!specification) throw new Error(`Specification is required when creating new filter ${_id}`);

  const { content, options, ...filterData } = specification;

  if (!content) throw new Error(`Localizable content is required when creating new filter${_id}`);

  logger.debug('create filter object', specification);
  try {
    await unchainedAPI.modules.filters.create(
      {
        ...filterData,
        _id,
        options: options?.map((option) => option.value) || [],
      },
      unchainedAPI,
      { skipInvalidation: true },
    );
  } catch (e) {
    if (!createShouldUpsertIfIDExists) throw e;

    logger.debug('entity already exists, falling back to update', specification);
    await modules.filters.update(
      _id,
      {
        ...filterData,
        options: options?.map((option) => option.value) || [],
      },
      unchainedAPI,
      { skipInvalidation: true },
    );
  }

  if (!(await modules.filters.filterExists({ filterId: _id }))) {
    throw new Error(`Can't upsert filter ${_id}`);
  }

  logger.debug('create localized content for filter', content);
  await upsertFilterContent({ content, filterId: _id }, unchainedAPI);

  logger.debug('create localized content for filter options', content);
  await upsertFilterOptionContent({ options, filterId: _id }, unchainedAPI);

  return {
    entity: 'FILTER',
    operation: 'create',
    _id,
    success: true,
  };
}
