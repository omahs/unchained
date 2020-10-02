import { log } from 'meteor/unchained:core-logger';
import { AssortmentFilters } from 'meteor/unchained:core-assortments';

export default function reorderAssortmentFilters(
  root,
  { sortKeys = [] },
  { userId }
) {
  log('mutation reorderAssortmentFilters', { userId });
  return AssortmentFilters.updateManualOrder({ sortKeys });
}
