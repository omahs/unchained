import { FileDirector } from '@unchainedshop/file-upload';

export const getFileAdapter = () => {
  const adapters = FileDirector.getAdapters();
  if (adapters.length === 0) throw Error('No file adapter found.');

  // For now we return the first file upload adapter without further filter options
  return adapters[0];
};
