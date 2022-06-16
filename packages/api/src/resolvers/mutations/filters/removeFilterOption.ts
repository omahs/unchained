import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api';
import { FilterNotFoundError, InvalidIdError } from '../../../errors';

export default async function removeFilterOption(
  root: Root,
  { filterId, filterOptionValue }: { filterId: string; filterOptionValue: string },
  context: Context,
) {
  const { modules, userId } = context;
  log(`mutation removeFilterOption ${filterId}`, { userId });

  if (!filterId || !filterOptionValue) throw new InvalidIdError({ filterId, filterOptionValue });

  if (!(await modules.filters.filterExists({ filterId }))) throw new FilterNotFoundError({ filterId });

  const filter = await modules.filters.removeFilterOption({
    filterId,
    filterOptionValue,
  });
  await modules.filters.invalidateCache({ _id: filterId }, context);

  return filter;
}
