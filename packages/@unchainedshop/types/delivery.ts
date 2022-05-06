import { Context } from './api';
import {
  FindOptions,
  IBaseAdapter,
  IBaseDirector,
  ModuleMutationsWithReturnDoc,
  Query,
  TimestampFields,
  _ID,
} from './common';
import {
  DeliveryPricingCalculation,
  DeliveryPricingContext,
  IDeliveryPricingSheet,
} from './delivery.pricing';
import { Order } from './orders';
import { OrderDelivery } from './orders.deliveries';
import { OrderPosition } from './orders.positions';
import { Product } from './products';
import { User } from './user';
import { WarehousingProvider } from './warehousing';
import { Work } from './worker';

export enum DeliveryProviderType {
  SHIPPING = 'SHIPPING',
  PICKUP = 'PICKUP',
}

export type DeliveryConfiguration = Array<{
  key: string;
  value: string;
}>;

export type DeliveryProvider = {
  _id?: _ID;
  type: DeliveryProviderType;
  adapterKey: string;
  authorId: string;
  configuration: DeliveryConfiguration;
} & TimestampFields;

type DeliveryProviderQuery = {
  type?: DeliveryProviderType;
  deleted?: Date;
};

export enum DeliveryError {
  ADAPTER_NOT_FOUND = 'ADAPTER_NOT_FOUND',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
  INCOMPLETE_CONFIGURATION = 'INCOMPLETE_CONFIGURATION',
  WRONG_CREDENTIALS = 'WRONG_CREDENTIALS',
}

export interface DeliveryContext {
  country?: string;
  deliveryProvider?: DeliveryProvider;
  order?: Order;
  orderDelivery?: OrderDelivery;
  orderPosition?: OrderPosition;
  product?: Product;
  quantity?: number;
  referenceDate?: Date;
  transactionContext?: any;
  user?: User;
  warehousingProvider?: WarehousingProvider;
  warehousingThroughputTime?: number;
}

export type DeliveryAdapterContext = DeliveryContext & Context;

export interface DeliveryLocation {
  _id: string;
  name: string;
  address: {
    addressLine: string;
    addressLine2?: string;
    postalCode: string;
    countryCode: string;
    city: string;
  };
  geoPoint: {
    latitude: number;
    longitude: number;
  };
}

interface DeliveryAdapterActions {
  configurationError: (transactionContext?: any) => DeliveryError;
  estimatedDeliveryThroughput: (warehousingThroughputTime: number) => Promise<number>;
  isActive: () => boolean;
  isAutoReleaseAllowed: () => boolean;
  pickUpLocationById: (locationId: string) => Promise<DeliveryLocation>;
  pickUpLocations: () => Promise<Array<DeliveryLocation>>;
  send: () => Promise<boolean | Work>;
}
export type IDeliveryAdapter = IBaseAdapter & {
  initialConfiguration: DeliveryConfiguration;

  typeSupported: (type: DeliveryProviderType) => boolean;

  actions: (config: DeliveryConfiguration, context: DeliveryAdapterContext) => DeliveryAdapterActions;
};

export type IDeliveryDirector = IBaseDirector<IDeliveryAdapter> & {
  actions: (
    deliveryProvider: DeliveryProvider,
    deliveryContext: DeliveryContext,
    requestContext: Context,
  ) => Promise<DeliveryAdapterActions>;
};

/*
 * Module
 */

export interface DeliveryInterface {
  _id: string;
  label: string;
  version: string;
}

export type DeliveryModule = ModuleMutationsWithReturnDoc<DeliveryProvider> & {
  // Queries
  count: (query: DeliveryProviderQuery) => Promise<number>;
  findProvider: (
    query:
      | {
          deliveryProviderId: string;
        }
      | Query,
    options?: FindOptions,
  ) => Promise<DeliveryProvider>;
  findProviders: (
    query: DeliveryProviderQuery,
    options?: FindOptions,
  ) => Promise<Array<DeliveryProvider>>;

  providerExists: (query: { deliveryProviderId: string }) => Promise<boolean>;

  pricingSheet: (params: {
    calculation: Array<DeliveryPricingCalculation>;
    currency: string;
  }) => IDeliveryPricingSheet;

  // Delivery adapter
  findInterface: (params: DeliveryProvider) => IDeliveryAdapter;
  findInterfaces: (params: { type: DeliveryProviderType }) => Array<DeliveryInterface>;
  findSupported: (params: { order: Order }, requestContext: Context) => Promise<Array<DeliveryProvider>>;
  determineDefault: (
    deliveryProviders: Array<DeliveryProvider>,
    params: { order: Order },
    requestContext: Context,
  ) => Promise<DeliveryProvider>;

  isActive: (deliveryProvider: DeliveryProvider, requestContext: Context) => Promise<boolean>;
  configurationError: (
    deliveryProvider: DeliveryProvider,
    requestContext: Context,
  ) => Promise<DeliveryError>;

  isAutoReleaseAllowed: (
    deliveryProvider: DeliveryProvider,
    requestContext: Context,
  ) => Promise<boolean>;
  calculate: (
    pricingContext: DeliveryPricingContext,
    requestContext: Context,
  ) => Promise<Array<DeliveryPricingCalculation>>;
  send: (
    deliveryProviderId: string,
    deliveryContext: DeliveryContext,
    requestContext: Context,
  ) => Promise<any>;
};

/*
 * Settings
 */

export type FilterProviders = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  context: Context,
) => Promise<Array<DeliveryProvider>>;

export type DetermineDefaultProvider = (
  params: {
    providers: Array<DeliveryProvider>;
    order: Order;
  },
  context: Context,
) => Promise<DeliveryProvider>;
export interface DeliverySettingsOptions {
  sortProviders?: (a: DeliveryProvider, b: DeliveryProvider) => number;
  filterSupportedProviders?: FilterProviders;
  determineDefaultProvider?: DetermineDefaultProvider;
}

export interface DeliverySettings {
  filterSupportedProviders: FilterProviders;
  determineDefaultProvider: DetermineDefaultProvider;
  configureSettings: (options?: DeliverySettingsOptions) => void;
}
