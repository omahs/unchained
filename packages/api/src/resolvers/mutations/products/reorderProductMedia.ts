import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';

export default async function reorderProductMedia(
  root: Root,
  params: { sortKeys: Array<{ productMediaId: string; sortKey: number }> },
  { modules, userId }: Context,
) {
  const { sortKeys = [] } = params;

  log('mutation reorderProductMedia', { userId });

  return modules.products.media.updateManualOrder({ sortKeys });
}
