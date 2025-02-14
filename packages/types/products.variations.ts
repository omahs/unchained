import { Context } from './api.js';
import { TimestampFields, _ID } from './common.js';
import { Product, ProductAssignment, ProductConfiguration } from './products.js';

export enum ProductVariationType {
  COLOR = 'COLOR',
  TEXT = 'TEXT',
}

export type ProductVariation = {
  _id?: _ID;
  key?: string;
  options: Array<string>;
  productId: string;
  type?: string;
} & TimestampFields;

export type ProductVariationText = {
  _id?: _ID;
  locale: string;
  productVariationId: string;
  productVariationOptionValue?: string;
  subtitle?: string;
  title?: string;
} & TimestampFields;

export type ProductVariationOption = {
  _id: string;
  texts: ProductVariationText;
  value: string;
};

export type ProductVariationsModule = {
  // Queries
  findProductVariationByKey: (query: { productId: string; key: string }) => Promise<ProductVariation>;
  findProductVariation: (query: { productVariationId: string }) => Promise<ProductVariation>;

  findProductVariations: (query: {
    productId: string;
    limit?: number;
    offset?: number;
    tags?: Array<string>;
  }) => Promise<Array<ProductVariation>>;

  // Transformations
  option: (
    productVariation: ProductVariation,
    productVariationOptionValue: string,
  ) => {
    _id: string;
    productVariationOption: string;
  };

  // Mutations
  create: (doc: ProductVariation & { locale?: string; title?: string }) => Promise<ProductVariation>;

  delete: (productVariationId: string) => Promise<number>;
  deleteVariations: (params: { productId?: string; excludedProductIds?: Array<_ID> }) => Promise<number>;

  update: (productMediaId: string, doc: ProductVariation) => Promise<ProductVariation>;

  addVariationOption: (
    productVariationId: string,
    data: { value: string; title: string; locale: string },
  ) => Promise<ProductVariation>;

  removeVariationOption: (
    productVariationId: string,
    productVariationOptionValue: string,
  ) => Promise<void>;

  texts: {
    // Queries
    findVariationTexts: (query: {
      productVariationId: string;
      productVariationOptionValue?: string;
    }) => Promise<Array<ProductVariationText>>;

    findLocalizedVariationText: (query: {
      locale: string;
      productVariationId: string;
      productVariationOptionValue?: string;
    }) => Promise<ProductVariationText>;

    // Mutations
    updateVariationTexts: (
      productVariationId: string,
      texts: Array<Omit<ProductVariationText, 'productVariationId' | 'productVariationOptionValue'>>,
      productVariationOptionValue?: string,
    ) => Promise<Array<ProductVariationText>>;

    upsertLocalizedText: (
      params: {
        productVariationId: string;
        productVariationOptionValue?: string;
      },
      locale: string,
      text: Omit<ProductVariationText, 'locale' | 'productVariationId' | 'productVariationOptionValue'>,
    ) => Promise<ProductVariationText>;
  };
};

export type HelperType<P, T> = (productVariation: ProductVariation, params: P, context: Context) => T;

export interface ProductVariationHelperTypes {
  options: HelperType<
    never,
    Array<{
      _id: string;
      productVariationOption: string;
    }>
  >;
  texts: HelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
}

export type OptionHelperType<P, T> = (
  option: { _id: string; productVariationOption: string },
  params: P,
  context: Context,
) => T;

export interface ProductVariationOptionHelperTypes {
  _id: OptionHelperType<never, string>;
  texts: OptionHelperType<{ forceLocale?: string }, Promise<ProductVariationText>>;
  value: OptionHelperType<never, string>;
}

export type AssignmentHelperType<T> = (
  data: { product: Product; assignment: ProductAssignment },
  _: never,
  context: Context,
) => T;

export interface ProductVariationAssignmentHelperTypes {
  _id: AssignmentHelperType<string>;
  vectors: AssignmentHelperType<Array<{ product: Product } & ProductConfiguration>>;
  product: AssignmentHelperType<Promise<Product>>;
}

export type AssignmentVectorHelperType<T> = (
  data: { product: Product } & ProductConfiguration,
  _: never,
  context: Context,
) => T;

export interface ProductVariationAssignmentVectorHelperTypes {
  _id: AssignmentVectorHelperType<string>;
  option: AssignmentVectorHelperType<Promise<{ _id: string; productVariationOption: string }>>;
  variation: AssignmentVectorHelperType<Promise<ProductVariation>>;
}
