import {
  WarehousingDirector,
  WarehousingAdapter,
  WarehousingProviderType,
} from '@unchainedshop/core-warehousing';
import { IWarehousingAdapter } from '@unchainedshop/types/warehousing.js';

const Store: IWarehousingAdapter = {
  ...WarehousingAdapter,

  key: 'shop.unchained.warehousing.store',
  label: 'Store',
  version: '1.0.0',
  orderIndex: 0,

  initialConfiguration: [{ key: 'name', value: 'Flagship Store' }],

  typeSupported: (type) => {
    return type === WarehousingProviderType.PHYSICAL;
  },

  actions: (configuration, context) => {
    return {
      ...WarehousingAdapter.actions(configuration, context),

      isActive() {
        return true;
      },

      configurationError() {
        return null;
      },

      stock: async () => {
        return 99999;
      },

      productionTime: async () => {
        return 0;
      },

      commissioningTime: async () => {
        return 0;
      },
    };
  },
};

WarehousingDirector.registerAdapter(Store);
