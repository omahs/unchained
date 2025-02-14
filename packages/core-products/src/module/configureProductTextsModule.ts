import { Collection, Filter } from '@unchainedshop/types/common.js';
import { Product, ProductsModule, ProductText } from '@unchainedshop/types/products.js';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  findUnusedSlug,
  generateDbFilterById,
  generateDbObjectId,
} from '@unchainedshop/utils';
import { productsSettings } from '../products-settings.js';

const { Locale } = localePkg;

const PRODUCT_TEXT_EVENTS = ['PRODUCT_UPDATE_TEXTS'];

export const configureProductTextsModule = ({
  Products,
  ProductTexts,
}: {
  Products: Collection<Product>;
  ProductTexts: Collection<ProductText>;
}): ProductsModule['texts'] => {
  registerEvents(PRODUCT_TEXT_EVENTS);

  const makeSlug = async ({ slug, title, productId }) => {
    const checkSlugIsUnique = async (newPotentialSlug: string) => {
      return (
        (await ProductTexts.countDocuments(
          {
            productId: { $ne: productId },
            slug: newPotentialSlug,
          },
          { limit: 1 },
        )) === 0
      );
    };

    const findSlug = findUnusedSlug(checkSlugIsUnique, { slugify: productsSettings.slugify });
    return findSlug({
      existingSlug: slug,
      title: title || productId,
    });
  };

  const upsertLocalizedText: ProductsModule['texts']['upsertLocalizedText'] = async (
    productId,
    locale,
    text,
  ) => {
    const { slug: textSlug, title = null, ...textFields } = text;
    const slug = await makeSlug({
      slug: textSlug,
      title,
      productId,
    });

    const modifier: any = {
      $set: {
        updated: new Date(),
        title: text.title,
        ...textFields,
      },
      $setOnInsert: {
        _id: generateDbObjectId(),
        created: new Date(),
        productId,
        locale,
      },
    };

    if (text.slug) {
      modifier.$set.slug = slug;
    } else {
      modifier.$setOnInsert.slug = slug;
    }

    const selector = { productId, locale };

    const updateResult = await ProductTexts.updateOne(selector, modifier, {
      upsert: true,
    });

    if (updateResult.upsertedCount > 0 || updateResult.modifiedCount > 0) {
      await Products.updateOne(generateDbFilterById(productId), {
        $set: {
          updated: new Date(),
        },
        $addToSet: {
          slugs: slug,
        },
      });

      await Products.updateMany(
        {
          _id: { $ne: productId },
          slugs: slug,
        },
        {
          $set: {
            updated: new Date(),
          },
          $pull: {
            slugs: slug,
          },
        },
      );
    }

    return ProductTexts.findOne(selector, {});
  };

  return {
    // Queries
    findTexts: async (selector, options) => {
      const texts = ProductTexts.find(selector, options);

      return texts.toArray();
    },

    findLocalizedText: async ({ productId, locale }) => {
      const parsedLocale = new Locale(locale);

      const text = await findLocalizedText<ProductText>(ProductTexts, { productId }, parsedLocale);

      return text;
    },

    searchTexts: async ({ searchText }) => {
      const productIds = ProductTexts.find(
        { $text: { $search: searchText } },
        {
          projection: {
            productId: 1,
          },
        },
      ).map(({ productId }) => productId);

      return productIds.toArray();
    },

    // Mutations
    updateTexts: async (productId, texts) => {
      const productTexts = texts
        ? await Promise.all(
            texts.map(({ locale, ...text }) => upsertLocalizedText(productId, locale, text)),
          )
        : [];

      await emit('PRODUCT_UPDATE_TEXTS', {
        productId,
        productTexts,
      });

      return productTexts;
    },

    upsertLocalizedText,
    makeSlug,

    deleteMany: async ({ productId, excludedProductIds }) => {
      const selector: Filter<ProductText> = {};
      if (productId) {
        selector.productId = productId;
      } else if (excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }
      const deletedResult = await ProductTexts.deleteMany(selector);
      return deletedResult.deletedCount;
    },
  };
};
