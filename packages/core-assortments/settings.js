import zipTreeByDeepness from './tree-zipper/zipTreeByDeepness';
import {
  setCachedProductIds,
  getCachedProductIds,
} from './product-cache/mongodb';

const settings = {
  zipTree: null,
  setCachedProductIds: null,
  getCachedProductIds: null,
  load({ zipTree = zipTreeByDeepness } = {}) {
    this.zipTree = zipTree;
    this.setCachedProductIds = setCachedProductIds;
    this.getCachedProductIds = getCachedProductIds;
  },
};

export default settings;
