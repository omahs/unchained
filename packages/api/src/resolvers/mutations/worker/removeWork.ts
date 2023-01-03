import { Context, Root } from '@unchainedshop/types/api.js';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, WorkNotFoundOrWrongStatus } from '../../../errors.js';

export default async function removeWork(
  root: Root,
  { workId }: { workId: string },
  { modules, userId }: Context,
) {
  log(`mutation removeWork ${workId}`, {
    userId,
  });

  if (!workId) throw new InvalidIdError({ workId });

  const work = await modules.worker.deleteWork(workId);

  if (!work) throw new WorkNotFoundOrWrongStatus({ workId });

  return work;
}
