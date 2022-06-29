import { log } from '@unchainedshop/logger';
import { Context, Root } from '@unchainedshop/types/api';

export default async function user(
  root: Root,
  params: { userId?: string },
  { modules, userId }: Context,
) {
  log(`query user ${params.userId}`, { Id: userId });
  return modules.users.findUserById(params.userId || userId);
}
