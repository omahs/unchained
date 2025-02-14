import { UnchainedLoaders } from '@unchainedshop/types/api.js';
import DataLoader from 'dataloader';
import { IncomingMessage, OutgoingMessage } from 'http';
import { systemLocale } from '@unchainedshop/utils';
import localePkg from 'locale';
import { Assortment, AssortmentText } from '@unchainedshop/types/assortments.js';
import { Filter, FilterText } from '@unchainedshop/types/filters.js';
import { Product, ProductText } from '@unchainedshop/types/products.js';
import { UnchainedCore } from '@unchainedshop/types/core.js';
import { ProductStatus } from '@unchainedshop/core-products';

const { Locale } = localePkg;

export default async (
  req: IncomingMessage,
  res: OutgoingMessage,
  unchainedAPI: UnchainedCore,
): Promise<UnchainedLoaders['loaders']> => {
  return {
    assortmentLoader: new DataLoader<{ assortmentId: string }, Assortment>(async (queries) => {
      const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

      const assortments = await unchainedAPI.modules.assortments.findAssortments({
        assortmentIds,
        includeInactive: true,
        includeLeaves: true,
      });

      return queries.map(({ assortmentId }) => {
        return assortments.find((assortment) => {
          if (assortment._id !== assortmentId) return false;
          return true;
        });
      });
    }),

    assortmentTextLoader: new DataLoader<{ assortmentId: string; locale: string }, AssortmentText>(
      async (queries) => {
        const assortmentIds = [...new Set(queries.map((q) => q.assortmentId).filter(Boolean))];

        const texts = await unchainedAPI.modules.assortments.texts.findTexts(
          { assortmentId: { $in: assortmentIds } },
          {
            sort: {
              assortmentId: 1,
            },
          },
        );

        const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

        return queries.map(({ assortmentId, locale }) => {
          const localeObj = new Locale(locale);
          const assortmentTexts = texts.filter((text) => text.assortmentId === assortmentId);
          if (!assortmentTexts.length) return null;
          const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

          const assortmentText = localeStrings.reduce<AssortmentText>((acc, localeString) => {
            if (acc) return acc;
            return assortmentTexts.find((p) => p.locale === localeString);
          }, null);
          return assortmentText || assortmentTexts[0];
        });
      },
    ),

    filterLoader: new DataLoader<{ filterId: string }, Filter>(async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const filters = await unchainedAPI.modules.filters.findFilters({
        filterIds,
        includeInactive: true,
      });

      return queries.map(({ filterId }) => {
        return filters.find((product) => {
          if (product._id !== filterId) return false;
          return true;
        });
      });
    }),

    filterTextLoader: new DataLoader<
      { filterId: string; filterOptionValue?: string; locale: string },
      FilterText
    >(async (queries) => {
      const filterIds = [...new Set(queries.map((q) => q.filterId).filter(Boolean))];

      const texts = await unchainedAPI.modules.filters.texts.findTexts(
        { filterId: { $in: filterIds } },
        {
          sort: {
            filterId: 1,
          },
        },
      );

      const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

      return queries.map(({ filterId, filterOptionValue, locale }) => {
        const localeObj = new Locale(locale);
        const filterTexts = texts.filter(
          (text) => text.filterId === filterId && text.filterOptionValue === filterOptionValue,
        );
        if (!filterTexts.length) return null;
        const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

        const filterText = localeStrings.reduce<FilterText>((acc, localeString) => {
          if (acc) return acc;
          return filterTexts.find((p) => p.locale === localeString);
        }, null);
        return filterText || filterTexts[0];
      });
    }),

    productLoader: new DataLoader<{ productId: string }, Product>(async (queries) => {
      const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

      const products = await unchainedAPI.modules.products.findProducts({
        productIds,
        productSelector: {
          status: { $in: [null, ProductStatus.ACTIVE, ProductStatus.DELETED] },
        },
      });

      return queries.map(({ productId }) => {
        return products.find((product) => {
          if (product._id !== productId) return false;
          return true;
        });
      });
    }),

    productTextLoader: new DataLoader<{ productId: string; locale: string }, ProductText>(
      async (queries) => {
        const productIds = [...new Set(queries.map((q) => q.productId).filter(Boolean))];

        const texts = await unchainedAPI.modules.products.texts.findTexts(
          { productId: { $in: productIds } },
          {
            sort: {
              productId: 1,
            },
          },
        );

        const systemLocaleStrings = [systemLocale.normalized, systemLocale.language];

        return queries.map(({ productId, locale }) => {
          const localeObj = new Locale(locale);
          const productTexts = texts.filter((text) => text.productId === productId);
          if (!productTexts.length) return null;
          const localeStrings = [localeObj.normalized, localeObj.language, ...systemLocaleStrings];

          const productText = localeStrings.reduce<ProductText>((acc, localeString) => {
            if (acc) return acc;
            return productTexts.find((p) => p.locale === localeString);
          }, null);
          return productText || productTexts[0];
        });
      },
    ),
  };
};
