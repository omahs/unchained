import { log } from '@unchainedshop/logger';
import { Root, Context } from '@unchainedshop/types/api.js';
import { EventQuery } from '@unchainedshop/types/events.js';

export default async function eventsCount(root: Root, params: EventQuery, { modules, userId }: Context) {
  log(`query eventsCount  queryString: ${params.queryString}  types: ${params.types}  ${userId}`, {
    userId,
  });

  return modules.events.count(params);
}
