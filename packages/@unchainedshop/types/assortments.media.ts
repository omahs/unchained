import { FindOptions, TimestampFields, _ID } from './common';

export type AssortmentMedia = {
  _id?: _ID;
  mediaId: string;
  assortmentId: string;
  sortKey: number;
  tags: Array<string>;
  meta?: any;
  authorId: string;
} & TimestampFields;

export type AssortmentMediaText = {
  _id?: _ID;
  assortmentMediaId: string;
  locale?: string;
  authorId: string;
  title?: string;
  subtitle?: string;
} & TimestampFields;

export type AssortmentMediaModule = {
  // Queries
  findAssortmentMedia: (params: { assortmentMediaId: string }) => Promise<AssortmentMedia>;

  findAssortmentMedias: (
    params: {
      assortmentId?: string;
      limit?: number;
      offset?: number;
      tags?: Array<string>;
    },
    options?: FindOptions,
  ) => Promise<Array<AssortmentMedia>>;

  // Mutations
  create: (doc: { assortmentId: string; mediaId: string }, userId: string) => Promise<AssortmentMedia>;

  delete: (assortmentMediaId: string, userId?: string) => Promise<number>;
  deleteMediaFiles: (params: {
    assortmentId?: string;
    excludedAssortmentIds?: Array<_ID>;
    excludedAssortmentMediaIds?: Array<_ID>;
  }) => Promise<number>;

  update: (assortmentMediaId: string, doc: AssortmentMedia) => Promise<AssortmentMedia>;

  updateManualOrder: (
    params: {
      sortKeys: Array<{
        assortmentMediaId: string;
        sortKey: number;
      }>;
    },
    userId?: string,
  ) => Promise<Array<AssortmentMedia>>;

  texts: {
    // Queries
    findMediaTexts: (query: { assortmentMediaId: string }) => Promise<Array<AssortmentMediaText>>;

    findLocalizedMediaText: (query: {
      assortmentMediaId: string;
      locale: string;
    }) => Promise<AssortmentMediaText>;

    // Mutations
    updateMediaTexts: (
      assortmentMediaId: string,
      texts: Array<Omit<AssortmentMediaText, 'assortmentMediaId' | 'authorId'>>,
      userId: string,
    ) => Promise<Array<AssortmentMediaText>>;

    upsertLocalizedText: (
      assortmentId: string,
      locale: string,
      text: Omit<AssortmentMediaText, 'assortmentMediaId' | 'locale' | 'authorId'>,
      userId?: string,
    ) => Promise<AssortmentMediaText>;
  };
};
