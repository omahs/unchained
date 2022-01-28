import 'meteor/dburles:collection-helpers';
import { Locale } from 'locale';
import { findLocalizedText } from 'meteor/unchained:utils';
import { log } from 'meteor/unchained:core-logger';
import { Products, ProductStatus } from 'meteor/unchained:core-products';
import {
  Assortments,
  AssortmentFilters,
} from 'meteor/unchained:core-assortments';
import { FilterTypes } from './schema';
import { Filters, FilterTexts } from './collections';
import { FilterDirector } from '../director';
import { searchProducts } from '../search';
import intersectSet from '../intersect-set';
import createFilterValueParser from '../filter-value-parsers';

const util = require('util');
const zlib = require('zlib');

const MAX_UNCOMPRESSED_FILTER_PRODUCTS = 1000;

Assortments.helpers({
  async searchProducts({
    query,
    ignoreChildAssortments,
    forceLiveCollection,
    ...options
  }) {
    const productIds = await this.productIds({
      forceLiveCollection,
      ignoreChildAssortments,
    });
    const filterIds = this.filterAssignments().map(({ filterId }) => filterId);
    return searchProducts({
      query: {
        filterIds,
        productIds,
        ...query,
      },
      forceLiveCollection,
      ...options,
    });
  },
});

AssortmentFilters.helpers({
  filter() {
    return Filters.findOne({ _id: this.filterId });
  },
});

Filters.createFilter = (
  { locale, title, type, isActive = false, authorId, ...filterData },
  { skipInvalidation = false } = {}
) => {
  const filterId = Filters.insert({
    isActive,
    created: new Date(),
    type: FilterTypes[type],
    authorId,
    ...filterData,
  });
  const filterObject = Filters.findOne({ _id: filterId });
  if (locale) {
    filterObject.upsertLocalizedText(locale, {
      filterOptionValue: null,
      title,
      authorId,
    });
  }
  if (!skipInvalidation) {
    filterObject.invalidateProductIdCache();
  }
  return filterObject;
};

Filters.updateFilter = (
  { filterId, ...filter },
  { skipInvalidation = false } = {}
) => {
  const modifier = {
    $set: {
      ...filter,
      updated: new Date(),
    },
  };
  Filters.update({ _id: filterId }, modifier);
  const filterObject = Filters.findOne({ _id: filterId });
  if (!skipInvalidation) {
    filterObject.invalidateProductIdCache();
  }
  return filterObject;
};

Filters.removeFilter = ({ filterId }) => {
  return Filters.remove({ _id: filterId });
};

Filters.getLocalizedTexts = (filterId, filterOptionValue, locale) =>
  findLocalizedText(
    FilterTexts,
    {
      filterId,
      filterOptionValue: filterOptionValue || { $eq: null },
    },
    locale
  );

Filters.sync = (syncFn) => {
  const referenceDate = Filters.markFiltersDirty();
  syncFn(referenceDate);
  Filters.cleanFiltersByReferenceDate(referenceDate);
  Filters.updateCleanFilterActivation();
  Filters.wipeFilters();
};

Filters.markFiltersDirty = () => {
  const dirtyModifier = { $set: { dirty: true } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    {},
    dirtyModifier,
    collectionUpdateOptions
  );
  const timestamp = new Date();
  log(`Filter Sync: Marked Filters dirty at timestamp ${timestamp}`, {
    // eslint-disable-line
    updatedFiltersCount,
    updatedFilterTextsCount,
    level: 'verbose',
  });
  return new Date();
};

Filters.filterExists = ({ filterId }) => {
  return !!Filters.find({ _id: filterId }).count();
};

Filters.findFilter = ({ filterId }) => {
  return Filters.findOne({ _id: filterId });
};

Filters.findFilters = ({ limit, offset, includeInactive }) => {
  const selector = {};
  if (!includeInactive) selector.isActive = true;
  return Filters.find(selector, { skip: offset, limit }).fetch();
};

Filters.cleanFiltersByReferenceDate = (referenceDate) => {
  const selector = {
    dirty: true,
    $or: [
      {
        updated: { $gte: referenceDate },
      },
      {
        created: { $gte: referenceDate },
      },
    ],
  };
  const modifier = { $set: { dirty: false } };
  const collectionUpdateOptions = { bypassCollection2: true, multi: true };
  const updatedFiltersCount = Filters.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  const updatedFilterTextsCount = FilterTexts.update(
    selector,
    modifier,
    collectionUpdateOptions
  );
  log(
    `Filter Sync: Result of filter cleaning with referenceDate=${referenceDate}`,
    {
      updatedFiltersCount,
      updatedFilterTextsCount,
      level: 'verbose',
    }
  );
};

FilterTexts.findFilterTexts = ({ filterId, filterOptionValue }) => {
  return FilterTexts.find({
    filterId,
    filterOptionValue,
  }).fetch();
};

Filters.updateCleanFilterActivation = () => {
  const disabledDirtyFiltersCount = Filters.update(
    {
      isActive: true,
      dirty: true,
    },
    {
      $set: { isActive: false },
    },
    { bypassCollection2: true, multi: true }
  );
  const enabledCleanFiltersCount = Filters.update(
    {
      isActive: false,
      dirty: { $ne: true },
    },
    {
      $set: { isActive: true },
    },
    { bypassCollection2: true, multi: true }
  );

  log(`Filter Sync: Result of filter activation`, {
    disabledDirtyFiltersCount,
    enabledCleanFiltersCount,
    level: 'verbose',
  });
};

Filters.wipeFilters = (onlyDirty = true) => {
  const selector = onlyDirty ? { dirty: true } : {};
  const removedFilterCount = Filters.remove(selector);
  const removedFilterTextCount = FilterTexts.remove(selector);
  log(`Filter Sync: Result of filter purging with onlyDirty=${onlyDirty}`, {
    removedFilterCount,
    removedFilterTextCount,
    level: 'verbose',
  });
};

Filters.invalidateFilterCaches = () => {
  log('Filters: Start invalidating filter caches', { level: 'verbose' });
  Filters.find()
    .fetch()
    .forEach((filter) => filter.invalidateProductIdCache());
};

Filters.removeFilterOption = ({ filterId, filterOptionValue }) => {
  return Filters.update(
    { _id: filterId },
    {
      $set: {
        updated: new Date(),
      },
      $pull: {
        options: filterOptionValue,
      },
    }
  );
};

Filters.helpers({
  upsertLocalizedText(locale, { filterOptionValue, ...fields }) {
    const selector = {
      filterId: this._id,
      filterOptionValue: filterOptionValue || { $eq: null },
      locale,
    };
    FilterTexts.upsert(selector, {
      $set: {
        updated: new Date(),
        ...fields,
      },
      $setOnInsert: {
        filterId: this._id,
        filterOptionValue: filterOptionValue || null,
        locale,
        created: new Date(),
      },
    });
    return FilterTexts.findOne(selector);
  },
  addOption({ option, localeContext, userId }) {
    const { value, title } = option;
    Filters.update(this._id, {
      $set: {
        updated: new Date(),
      },
      $addToSet: {
        options: value,
      },
    });

    this.upsertLocalizedText(localeContext.language, {
      authorId: userId,
      filterOptionValue: value,
      title,
    });
  },
  updateTexts({ texts, filterOptionValue, userId }) {
    return texts.map(({ locale, ...localizations }) =>
      this.upsertLocalizedText(locale, {
        ...localizations,
        authorId: userId,
        filterOptionValue,
      })
    );
  },
  getLocalizedTexts(locale, optionValue) {
    const parsedLocale = new Locale(locale);
    return Filters.getLocalizedTexts(this._id, optionValue, parsedLocale);
  },
  optionObject(filterOption) {
    return {
      filterOption,
      getLocalizedTexts: this.getLocalizedTexts,
      ...this,
    };
  },

  collectProductIds({ value, ...options } = {}) {
    const director = new FilterDirector({ filter: this, ...options });
    const selector = Promise.await(
      director.buildProductSelector(
        {
          status: ProductStatus.ACTIVE,
        },
        {
          key: this.key,
          value,
        }
      )
    );
    if (!selector) return [];
    const products = Products.find(selector, { fields: { _id: true } }).fetch();
    return products.map(({ _id }) => _id);
  },
  buildProductIdMap() {
    const cache = {
      allProductIds: this.collectProductIds(),
    };
    if (this.type === FilterTypes.SWITCH) {
      cache.productIds = {
        true: this.collectProductIds({ value: true }),
        false: this.collectProductIds({ value: false }),
      };
    } else {
      cache.productIds = (this.options || []).reduce(
        (accumulator, option) => ({
          ...accumulator,
          [option]: this.collectProductIds({ value: option }),
        }),
        {}
      );
    }

    return cache;
  },
  invalidateProductIdCache() {
    log(`Filters: Rebuilding ${this.key}`, { level: 'verbose' }); // eslint-disable.line
    const { productIds, allProductIds } = this.buildProductIdMap();
    const cache = {
      allProductIds,
      productIds: Object.entries(productIds),
    };

    const gzip = util.promisify(zlib.gzip);
    const compressedCache =
      allProductIds.length > MAX_UNCOMPRESSED_FILTER_PRODUCTS
        ? Promise.await(gzip(JSON.stringify(cache)))
        : null;

    Filters.update(
      { _id: this._id },
      {
        $set: {
          _cache: compressedCache
            ? {
                compressed: compressedCache,
              }
            : cache,
        },
      }
    );
  },
  cache() {
    // eslint-disable-next-line
    if (!this._cache) return null;
    // eslint-disable-next-line
    if (!this._isCacheTransformed) {
      // eslint-disable-next-line
      if (this._cache.compressed) {
        const gunzip = util.promisify(zlib.gunzip);
        this._cache = JSON.parse(Promise.await(gunzip(this._cache.compressed))); // eslint-disable-line
      }
      // eslint-disable-next-line
      this._cache = {
        // eslint-disable-next-line
        allProductIds: this._cache.allProductIds,
        // eslint-disable-next-line
        productIds: this._cache.productIds.reduce(
          (accumulator, [key, value]) => ({
            ...accumulator,
            [key]: value,
          }),
          {}
        ),
      };
      this._isCacheTransformed = true; // eslint-disable-line
    }
    return this._cache; // eslint-disable-line
  },
  productIds({ values, forceLiveCollection }) {
    const { productIds, allProductIds } = forceLiveCollection
      ? this.buildProductIdMap()
      : this.cache() || this.buildProductIdMap();

    const parse = createFilterValueParser(this.type);
    return parse(values, Object.keys(productIds)).reduce(
      (accumulator, value) => {
        const additionalValues =
          value === undefined ? allProductIds : productIds[value];
        return [...accumulator, ...(additionalValues || [])];
      },
      []
    );
  },
  optionsForFilterType(type) {
    if (type === FilterTypes.SWITCH) return ['true', 'false'];
    return this.options || [];
  },
  loadedOptions({ values, forceLiveCollection, productIdSet, director }) {
    const allOptions = this.optionsForFilterType(this.type);
    const mappedOptions = allOptions
      .map((value) => {
        const filterOptionProductIds = this.productIds({
          values: [value],
          forceLiveCollection,
        });
        const filteredProductIds = intersectSet(
          productIdSet,
          new Set(filterOptionProductIds)
        );
        if (!filteredProductIds.length) return null;
        return {
          definition: () => this.optionObject(value),
          filteredProducts:
            director.aggregateProductIds(filteredProductIds).length,
          isSelected: () => {
            if (!values) return false;
            const parse = createFilterValueParser(this.type);
            const normalizedValues = parse(values, [value]);
            return normalizedValues.indexOf(value) !== -1;
          },
        };
      })
      .filter(Boolean);
    return mappedOptions;
  },
  load({
    filterQuery,
    forceLiveCollection,
    allProductIdsSet,
    otherFilters,
    director,
    ...options
  }) {
    const values = filterQuery[this.key];

    // The examinedProductIds is a set of product id's that:
    // - Fit this filter generally
    // - Are part of the preselected product id array
    const filterProductIds = this.productIds({
      values: [undefined],
      forceLiveCollection,
    });
    const examinedProductIds = intersectSet(
      allProductIdsSet,
      new Set(filterProductIds)
    );

    // The filteredProductIds is a set of product id's that:
    // - Are filtered by all other filters
    // - Are filtered by the currently selected value of this filter
    // or if there is no currently selected value:
    // - Is the same like examinedProductIds
    const filteredByOtherFiltersSet = otherFilters
      .filter((otherFilter) => otherFilter.key !== this.key)
      .reduce((productIdSet, filter) => {
        if (!filterQuery[filter.key]) return productIdSet;
        const otherFilterProductIds = filter.productIds({
          values: filterQuery[filter.key],
          forceLiveCollection,
        });
        return intersectSet(productIdSet, new Set(otherFilterProductIds));
      }, new Set(examinedProductIds));

    const filterProductIdsForValues = values
      ? this.productIds({
          values,
          forceLiveCollection,
        })
      : filterProductIds;
    const filteredProductIds = intersectSet(
      filteredByOtherFiltersSet,
      new Set(filterProductIdsForValues)
    );

    return {
      definition: this,
      examinedProducts: director.aggregateProductIds(examinedProductIds).length,
      filteredProducts: director.aggregateProductIds(filteredProductIds).length,
      isSelected: Object.prototype.hasOwnProperty.call(filterQuery, this.key),
      options: () => {
        // The current base for options should be an array of product id's that:
        // - Are part of the preselected product id array
        // - Fit this filter generally
        // - Are filtered by all other filters
        // - Are not filtered by the currently selected value of this filter
        return this.loadedOptions({
          director,
          values,
          forceLiveCollection,
          productIdSet: filteredByOtherFiltersSet,
        });
      },
    };
  },
});
