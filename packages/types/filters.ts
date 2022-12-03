import { Db } from 'mongodb';
import { Context, SortOption } from './api';
import { Assortment } from './assortments';
import {
  FindOptions,
  Document,
  IBaseAdapter,
  IBaseDirector,
  Query,
  TimestampFields,
  _ID,
} from './common';
import { UnchainedCore } from './core';
import { Product } from './products';

export enum FilterType {
  SWITCH = 'SWITCH',
  SINGLE_CHOICE = 'SINGLE_CHOICE',
  MULTI_CHOICE = 'MULTI_CHOICE',
  RANGE = 'RANGE',
}

export type Filter = {
  _id?: _ID;
  authorId: string;
  isActive?: boolean;
  key: string;
  meta?: any;
  options: Array<string>;
  type: FilterType;
} & TimestampFields;

export type FilterOption = Filter & {
  filterOption: string;
};

export type FilterText = {
  authorId: string;
  filterId: string;
  filterOptionValue?: string;
  locale?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type FilterProductIdCacheRecord = {
  filterId: _ID;
  filterOptionValue?: string;
  productIds: _ID[];
};

export type SearchFilterQuery = Array<{ key: string; value?: string }>;

export type FilterQuery = {
  filterIds?: Array<string>;
  queryString?: string;
  includeInactive?: boolean;
};

export type SearchQuery = Query & {
  assortmentIds?: Array<string>;
  filterIds?: Array<string>;
  filterQuery?: SearchFilterQuery;
  includeInactive?: boolean;
  orderBy?: string;
  productIds?: Array<string>;
  queryString?: string;
};

export type SearchProducts = {
  productsCount: () => Promise<number>;
  filteredProductsCount: () => Promise<number>;
  products: (params: { limit: number; offset: number }) => Promise<Array<Product>>;
};

export type SearchAssortments = {
  assortmentsCount: () => Promise<number>;
  assortments: (params: { limit: number; offset: number }) => Promise<Array<Assortment>>;
};

export type FiltersModule = {
  // Queries
  count: (query: FilterQuery) => Promise<number>;

  findFilter: (params: { filterId?: string; key?: string }) => Promise<Filter>;

  findFilters: (
    params: FilterQuery & {
      limit?: number;
      offset?: number;
      sort?: Array<SortOption>;
    },
    options?: FindOptions<Document>,
  ) => Promise<Array<Filter>>;

  filterExists: (params: { filterId: string }) => Promise<boolean>;

  invalidateCache: (query: Query, unchainedAPI: UnchainedCore) => Promise<void>;

  // Mutations
  create: (
    doc: Filter & { title: string; locale: string },
    requestContext: Context,
    options?: { skipInvalidation?: boolean },
    userId?: string,
  ) => Promise<Filter>;

  createFilterOption: (
    filterId: string,
    option: { value: string; title: string },
    requestContext: Context,
  ) => Promise<Filter>;

  update: (
    filterId: string,
    doc: Filter,
    requestContext: Context,
    options?: { skipInvalidation?: boolean },
    userId?: string,
  ) => Promise<string>;

  delete: (filterId: string) => Promise<number>;

  removeFilterOption: (
    params: {
      filterId: string;
      filterOptionValue?: string;
    },
    requestContext: Context,
  ) => Promise<Filter>;

  /*
   * Search
   */
  search: {
    searchProducts: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      requestContext: Context,
    ) => Promise<SearchProducts>;

    searchAssortments: (
      searchQuery: SearchQuery,
      params: { forceLiveCollection?: boolean },
      requestContext: Context,
    ) => Promise<SearchAssortments>;
  };

  /*
   * Filter texts
   */

  texts: {
    // Queries
    findTexts: (query: Query, options?: FindOptions) => Promise<Array<FilterText>>;

    findLocalizedText: (params: {
      filterId: string;
      filterOptionValue?: string;
      locale?: string;
    }) => Promise<FilterText>;

    // Mutations
    updateTexts: (
      query: { filterId: string; filterOptionValue?: string },
      texts: Array<Omit<FilterText, 'filterId' | 'filterOptionValue' | 'authorId'>>,
    ) => Promise<Array<FilterText>>;

    upsertLocalizedText: (
      params: { filterId: string; filterOptionValue?: string },
      locale: string,
      text: Omit<FilterText, 'filterId' | 'filterOptionValue' | 'locale' | 'authorId'>,
    ) => Promise<FilterText>;

    deleteMany: (params: { filterId?: string; excludedFilterIds?: string[] }) => Promise<number>;
  };
};

/*
 * Director
 */

export type FilterContext = {
  filter?: Filter;
  searchQuery: SearchQuery;
};

export interface FilterAdapterActions {
  aggregateProductIds: (params: { productIds: Array<string> }) => Array<string>;

  searchAssortments: (
    params: {
      assortmentIds: Array<string>;
    },
    options?: {
      filterSelector: Query;
      assortmentSelector: Query;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  searchProducts: (
    params: {
      productIds: Array<string>;
    },
    options?: {
      filterSelector: Query;
      productSelector: Query;
      sortStage: FindOptions['sort'];
    },
  ) => Promise<Array<string>>;

  transformFilterSelector: (query: Query, options?: any) => Promise<Query>;
  transformProductSelector: (query: Query, options?: { key?: string; value?: any }) => Promise<Query>;
  transformSortStage: (
    sort: FindOptions['sort'],
    options?: { key: string; value?: any },
  ) => Promise<FindOptions['sort']>;
}

export type IFilterAdapter = IBaseAdapter & {
  orderIndex: number;

  actions: (params: FilterContext & Context) => FilterAdapterActions;
};

export type IFilterDirector = IBaseDirector<IFilterAdapter> & {
  actions: (filterContext: FilterContext, requestContext: Context) => Promise<FilterAdapterActions>;
};

/* Settings */

export interface FiltersSettingsOptions {
  skipInvalidationOnStartup?: boolean;
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
}

export interface FiltersSettings {
  skipInvalidationOnStartup?: boolean;
  setCachedProductIds?: (
    filterId: string,
    productIds: Array<string>,
    productIdsMap: Record<string, Array<string>>,
  ) => Promise<number>;
  getCachedProductIds?: (filterId: string) => Promise<[Array<string>, Record<string, Array<string>>]>;
  configureSettings: (options?: FiltersSettingsOptions, db?: Db) => void;
}
