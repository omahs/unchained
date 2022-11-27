import {
  ProductVariation,
  ProductVariationsModule,
  ProductVariationText,
} from '@unchainedshop/types/products.variations';
import { Filter, Query } from '@unchainedshop/types/common';
import { ModuleInput, ModuleMutations } from '@unchainedshop/types/core';
import localePkg from 'locale';
import { emit, registerEvents } from '@unchainedshop/events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
} from '@unchainedshop/utils';
import { ProductVariationsCollection } from '../db/ProductVariationsCollection';
import { ProductVariationsSchema, ProductVariationType } from '../db/ProductVariationsSchema';

const { Locale } = localePkg;

const PRODUCT_VARIATION_EVENTS = [
  'PRODUCT_CREATE_VARIATION',
  'PRODUCT_REMOVE_VARIATION',
  'PRODUCT_UPDATE_VARIATION_TEXTS',
  'PRODUCT_VARIATION_OPTION_CREATE',
  'PRODUCT_REMOVE_VARIATION_OPTION',
];

export const configureProductVariationsModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<ProductVariationsModule> => {
  registerEvents(PRODUCT_VARIATION_EVENTS);

  const { ProductVariations, ProductVariationTexts } = await ProductVariationsCollection(db);

  const mutations = generateDbMutations<ProductVariation>(ProductVariations, ProductVariationsSchema, {
    permanentlyDeleteByDefault: true,
    hasCreateOnly: false,
  }) as ModuleMutations<ProductVariation>;

  const upsertLocalizedText = async (
    {
      productVariationId,
      productVariationOptionValue = null,
      locale,
      ...text
    }: Omit<ProductVariationText, 'authorId'>,
    userId: string,
  ) => {
    const selector = {
      productVariationId,
      productVariationOptionValue: productVariationOptionValue || {
        $eq: null,
      },
      locale,
    };

    await ProductVariationTexts.updateOne(
      selector,
      {
        $set: {
          updated: new Date(),
          updatedBy: userId,
          authorId: userId,
          ...text,
        },
        $setOnInsert: {
          _id: generateDbObjectId(),
          productVariationId,
          productVariationOptionValue: productVariationOptionValue || null,
          created: new Date(),
          createdBy: userId,
          locale,
        },
      },
      {
        upsert: true,
      },
    );

    return ProductVariationTexts.findOne(selector, {});
  };

  return {
    // Queries
    findProductVariationByKey: async ({ productId, key }) => {
      const selector: Query = {
        productId,
        key,
      };
      return ProductVariations.findOne(selector, {});
    },

    findProductVariation: async ({ productVariationId }) => {
      return ProductVariations.findOne(generateDbFilterById(productVariationId), {});
    },

    findProductVariations: async ({ productId, tags, offset, limit }) => {
      const selector: Query = { productId };
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const variations = ProductVariations.find(selector, {
        skip: offset,
        limit,
      });

      return variations.toArray();
    },

    // Transformations

    option: (productVariation, productVariationOption) => {
      return {
        _id: productVariation._id,
        productVariationOption,
      };
    },

    // Mutations
    create: async (
      { type, locale, title, authorId, ...doc }: ProductVariation & { title: string; locale: string },
      userId,
    ) => {
      const productVariationId = await mutations.create(
        {
          type: ProductVariationType[type],
          authorId,
          ...doc,
        },
        userId,
      );

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
      );

      await upsertLocalizedText(
        {
          locale,
          productVariationId,
          title,
        },
        userId,
      );

      await emit('PRODUCT_CREATE_VARIATION', {
        productVariation,
      });

      return productVariation;
    },

    delete: async (productVariationId) => {
      const selector = generateDbFilterById(productVariationId);

      await ProductVariationTexts.deleteMany({ productVariationId });

      const deletedResult = await ProductVariations.deleteOne(selector);

      await emit('PRODUCT_REMOVE_VARIATION', {
        productVariationId,
      });

      return deletedResult.deletedCount;
    },

    deleteVariations: async ({ productId, excludedProductIds }) => {
      const selector: Filter<ProductVariation> = {};
      if (productId) {
        selector.productId = productId;
      } else if (excludedProductIds) {
        selector.productId = { $nin: excludedProductIds };
      }

      const ids = await ProductVariations.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();
      await ProductVariationTexts.deleteMany({ productVariationId: { $in: ids } });

      const deletedResult = await ProductVariations.deleteMany(selector);
      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (productVariationId, doc) => {
      const selector = generateDbFilterById(productVariationId);
      const modifier = { $set: doc };
      await ProductVariations.updateOne(selector, modifier);
      return ProductVariations.findOne(selector, {});
    },

    addVariationOption: async (productVariationId, { inputData, localeContext }, userId) => {
      const { value, title } = inputData;

      await ProductVariations.updateOne(generateDbFilterById(productVariationId), {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
        $addToSet: {
          options: value,
        },
      });

      await upsertLocalizedText(
        {
          locale: localeContext.language,
          productVariationId,
          productVariationOptionValue: value,
          title,
        },
        userId,
      );

      const productVariation = await ProductVariations.findOne(
        generateDbFilterById(productVariationId),
        {},
      );

      await emit('PRODUCT_VARIATION_OPTION_CREATE', { productVariation, value });

      return productVariation;
    },

    removeVariationOption: async (productVariationId, productVariationOptionValue, userId) => {
      await ProductVariations.updateOne(generateDbFilterById(productVariationId), {
        $set: {
          updated: new Date(),
          updatedBy: userId,
        },
        $pull: {
          options: productVariationOptionValue,
        },
      });

      await emit('PRODUCT_REMOVE_VARIATION_OPTION', {
        productVariationId,
        productVariationOptionValue,
      });
    },

    /*
     * Product Variation Texts
     */

    texts: {
      // Queries
      findVariationTexts: async ({ productVariationId, productVariationOptionValue }) => {
        return ProductVariationTexts.find({
          productVariationId,
          productVariationOptionValue,
        }).toArray();
      },

      findLocalizedVariationText: async ({
        productVariationId,
        productVariationOptionValue,
        locale,
      }) => {
        const parsedLocale = new Locale(locale);

        const selector: Query = { productVariationId };
        selector.productVariationOptionValue = productVariationOptionValue ?? { $eq: null };
        const text = await findLocalizedText<ProductVariationText>(
          ProductVariationTexts,
          selector,
          parsedLocale,
        );

        return text;
      },

      // Mutations
      updateVariationTexts: async (productVariationId, texts, productVariationOptionValue, userId) => {
        const productVariationTexts = await Promise.all(
          texts.map(({ locale, ...text }) =>
            upsertLocalizedText(
              {
                ...text,
                locale,
                productVariationId,
                productVariationOptionValue,
              },
              userId,
            ),
          ),
        );

        await emit('PRODUCT_UPDATE_VARIATION_TEXTS', {
          productVariationId,
          productVariationOptionValue,
          productVariationTexts,
        });

        return productVariationTexts;
      },

      upsertLocalizedText: async (
        { productVariationId, productVariationOptionValue },
        locale,
        text,
        userId,
      ) =>
        upsertLocalizedText(
          {
            ...text,
            productVariationId,
            productVariationOptionValue,
            locale,
          },
          userId,
        ),
    },
  };
};
