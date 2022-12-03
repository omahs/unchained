import { Context, Root } from '@unchainedshop/types/api';
import { log } from '@unchainedshop/logger';
import { InvalidIdError, UserNotFoundError } from '../../../errors';

export default async function updateUserProfile(
  root: Root,
  params: { tags: Array<string>; userId: string },
  { modules, userId }: Context,
) {
  const normalizedUserId = params.userId;

  log(`mutation setUserTags ${normalizedUserId}`, { userId });

  if (!normalizedUserId) throw new InvalidIdError({ normalizedUserId });
  if (!(await modules.users.userExists({ userId: normalizedUserId })))
    throw new UserNotFoundError({ userId: normalizedUserId });

  return modules.users.updateTags(normalizedUserId, params.tags);
}
