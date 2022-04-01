import { Context } from '@unchainedshop/types/api';
import { Work as WorkType } from '@unchainedshop/types/worker';

type HelperType<P, T> = (work: WorkType, params: P, context: Context) => T;

export interface WorkHelperTypes {
  status: HelperType<never, string>;
  type: HelperType<never, string>;
  original: HelperType<never, Promise<WorkType>>;
}

export const Work: WorkHelperTypes = {
  status: (obj, _, { modules }) => {
    return modules.worker.status(obj);
  },

  type: (obj, _, { modules }) => {
    return modules.worker.type(obj);
  },

  original: async (obj, _, { modules }) => {
    if (!obj.originalWorkId) return null;
    return modules.worker.findWork({ workId: obj.originalWorkId });
  },
};
