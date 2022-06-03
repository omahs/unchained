import {
  AssortmentMedia,
  AssortmentMediaModule,
  AssortmentMediaText,
} from '@unchainedshop/types/assortments.media';
import { ModuleInput, ModuleMutations, Query } from '@unchainedshop/types/common';
import { Locale } from 'locale';
import { emit, registerEvents } from 'meteor/unchained:events';
import {
  findLocalizedText,
  generateDbFilterById,
  generateDbMutations,
  generateDbObjectId,
} from 'meteor/unchained:utils';
import { FileDirector } from 'meteor/unchained:file-upload';
import { AssortmentMediaCollection } from '../db/AssortmentMediasCollection';
import { AssortmentMediasSchema } from '../db/AssortmentMediasSchema';

const ASSORTMENT_MEDIA_EVENTS = [
  'ASSORTMENT_ADD_MEDIA',
  'ASSORTMENT_REMOVE_MEDIA',
  'ASSORTMENT_REORDER_MEDIA',
  'ASSORTMENT_UPDATE_MEDIA_TEXT',
];

FileDirector.registerFileUploadCallback('assortment-media', async (file, { modules, userId }) => {
  await modules.assortments.media.create(
    {
      assortmentId: file.meta.assortmentId,
      mediaId: file._id,
    },
    file.updatedBy || file.createdBy || userId,
  );
});

export const configureAssortmentMediaModule = async ({
  db,
}: ModuleInput<Record<string, never>>): Promise<AssortmentMediaModule> => {
  registerEvents(ASSORTMENT_MEDIA_EVENTS);

  const { AssortmentMedias, AssortmentMediaTexts } = await AssortmentMediaCollection(db);

  const mutations = generateDbMutations<AssortmentMedia>(
    AssortmentMedias,
    AssortmentMediasSchema,
  ) as ModuleMutations<AssortmentMedia>;

  const upsertLocalizedText: AssortmentMediaModule['texts']['upsertLocalizedText'] = async (
    assortmentMediaId,
    locale,
    text,
    userId,
  ) => {
    const selector = {
      assortmentMediaId,
      locale,
    };

    const updsertResult = await AssortmentMediaTexts.updateOne(
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
          created: new Date(),
          createdBy: userId,
          assortmentMediaId,
          locale,
        },
      },
      {
        upsert: true,
      },
    );

    return AssortmentMediaTexts.findOne(
      updsertResult.upsertedId ? generateDbFilterById(updsertResult.upsertedId) : selector,
      {},
    );
  };

  return {
    // Queries
    findAssortmentMedia: async ({ assortmentMediaId }) => {
      return AssortmentMedias.findOne(generateDbFilterById(assortmentMediaId), {});
    },

    findAssortmentMedias: async ({ assortmentId, tags, offset, limit }, options) => {
      const selector: Query = assortmentId ? { assortmentId } : {};
      if (tags && tags.length > 0) {
        selector.tags = { $all: tags };
      }

      const mediaList = AssortmentMedias.find(selector, {
        skip: offset,
        limit,
        sort: { sortKey: 1 },
        ...options,
      });

      return mediaList.toArray();
    },

    // Mutations
    create: async (doc: AssortmentMedia, userId) => {
      let { sortKey } = doc;

      if (!sortKey) {
        // Get next sort key
        const lastAssortmentMedia = (await AssortmentMedias.findOne(
          {
            assortmentId: doc.assortmentId,
          },
          {
            sort: { sortKey: -1 },
          },
        )) || { sortKey: 0 };
        sortKey = lastAssortmentMedia.sortKey + 1;
      }

      const assortmentMediaId = await mutations.create(
        {
          tags: [],
          authorId: userId,
          ...doc,
          sortKey,
        },
        userId,
      );

      const assortmentMedia = await AssortmentMedias.findOne(
        generateDbFilterById(assortmentMediaId),
        {},
      );

      emit('ASSORTMENT_ADD_MEDIA', {
        assortmentMedia,
      });

      return assortmentMedia;
    },

    delete: async (assortmentMediaId) => {
      const selector = generateDbFilterById(assortmentMediaId);

      const deletedResult = await AssortmentMedias.deleteOne(selector);

      emit('ASSORTMENT_REMOVE_MEDIA', {
        assortmentMediaId,
      });

      return deletedResult.deletedCount;
    },

    deleteMediaFiles: async ({ assortmentId, excludedAssortmentIds, excludedAssortmentMediaIds }) => {
      const selector: Query = assortmentId ? { assortmentId } : {};

      if (!assortmentId && excludedAssortmentIds) {
        selector.assortmentId = { $nin: excludedAssortmentIds };
      }

      if (excludedAssortmentMediaIds) {
        selector._id = { $nin: excludedAssortmentMediaIds };
      }

      const ids = await AssortmentMedias.find(selector, { projection: { _id: true } })
        .map((m) => m._id)
        .toArray();

      const deletedResult = await AssortmentMedias.deleteMany(selector);

      ids.forEach((assortmentMediaId) => {
        emit('ASSORTMENT_REMOVE_MEDIA', {
          assortmentMediaId,
        });
      });

      return deletedResult.deletedCount;
    },

    // This action is specifically used for the bulk migration scripts in the platform package
    update: async (assortmentMediaId, doc) => {
      const selector = generateDbFilterById(assortmentMediaId);
      const modifier = { $set: doc };
      await AssortmentMedias.updateOne(selector, modifier);
      return AssortmentMedias.findOne(selector, {});
    },

    updateManualOrder: async ({ sortKeys }, userId) => {
      const changedAssortmentMediaIds = await Promise.all(
        sortKeys.map(async ({ assortmentMediaId, sortKey }) => {
          await AssortmentMedias.updateOne(generateDbFilterById(assortmentMediaId), {
            $set: {
              sortKey: sortKey + 1,
              updated: new Date(),
              updatedBy: userId,
            },
          });

          return assortmentMediaId;
        }),
      );

      const assortmentMedias = await AssortmentMedias.find({
        _id: { $in: changedAssortmentMediaIds },
      }).toArray();

      emit('ASSORTMENT_REORDER_MEDIA', { assortmentMedias });

      return assortmentMedias;
    },

    /*
     * Assortment Media Texts
     */

    texts: {
      // Queries
      findMediaTexts: async ({ assortmentMediaId }) => {
        return AssortmentMediaTexts.find({ assortmentMediaId }).toArray();
      },

      findLocalizedMediaText: async ({ assortmentMediaId, locale }) => {
        const parsedLocale = new Locale(locale);

        const text = await findLocalizedText<AssortmentMediaText>(
          AssortmentMediaTexts,
          { assortmentMediaId },
          parsedLocale,
        );

        return text;
      },

      // Mutations
      updateMediaTexts: async (assortmentMediaId, texts, userId) => {
        const mediaTexts = await Promise.all(
          texts.map(({ locale, ...text }) =>
            upsertLocalizedText(assortmentMediaId, locale, text, userId),
          ),
        );

        emit('ASSORTMENT_UPDATE_MEDIA_TEXT', {
          assortmentMediaId,
          mediaTexts,
        });

        return mediaTexts;
      },

      upsertLocalizedText,
    },
  };
};
