import { Collection } from '@unchainedshop/types/common';
import { Filter } from '@unchainedshop/types/filters';
import { Context } from 'vm';
import { intersectSet } from '../utils/intersectSet';
import { FilterProductIds, SearchConfiguration } from './search';

export const productFacetedSearch = (
  Filters: Collection<Filter>,
  filterProductIds: FilterProductIds,
  searchConfiguration: SearchConfiguration,
  requestContext: Context,
) => {
  const { query, filterSelector, forceLiveCollection } = searchConfiguration;

  return async (productIds: Array<string>) => {
    if (!query || query.length === 0) return productIds;

    const filters = filterSelector ? await Filters.find(filterSelector).toArray() : [];

    const intersectedProductIds = await filters.reduce(
      async (productIdSetPromise: Promise<Set<string>>, filter) => {
        const productIdSet = await productIdSetPromise;

        if (!query.filterQuery[filter.key]) return productIdSet;

        const filterOptionProductIds = await filterProductIds(
          filter,
          {
            values: query.filterQuery[filter.key],
            forceLiveCollection,
          },
          requestContext,
        );

        return intersectSet(productIdSet, new Set(filterOptionProductIds));
      },
      Promise.resolve(new Set(productIds)),
    );

    return [...intersectedProductIds];
  };
};
