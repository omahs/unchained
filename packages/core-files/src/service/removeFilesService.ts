import { Query } from '@unchainedshop/types/common.js';
import { RemoveFilesService } from '@unchainedshop/types/files.js';
import { getFileAdapter } from '../utils/getFileAdapter.js';

export const removeFilesService: RemoveFilesService = async ({ fileIds }, unchainedAPI) => {
  const {
    modules: { files },
  } = unchainedAPI;

  if (fileIds && typeof fileIds !== 'string' && !Array.isArray(fileIds))
    throw Error('Media id/s to be removed not provided as a string or array');

  const selector: Query = {
    _id: { $in: fileIds },
  };

  const fileUploadAdapter = getFileAdapter();

  const fileObjects = await files.findFiles(selector);

  try {
    await fileUploadAdapter.removeFiles(fileObjects, unchainedAPI);
  } catch (e) {
    console.warn(e); // eslint-disable-line
  }

  const fileIdsToDelete = fileObjects.map((f) => f._id).filter(Boolean);

  await files.deleteMany(fileIdsToDelete);

  return fileIdsToDelete.length;
};
