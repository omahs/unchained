import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api.js';
import { InvalidIdError } from '../../../errors.js';

export default async function work(
  root: Root,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`query work ${workId}`, { userId });

  if (!workId) throw new InvalidIdError({ workId });

  return modules.worker.findWork({ workId });
}
