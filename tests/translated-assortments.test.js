import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from './helpers';
import { ADMIN_TOKEN } from './seeds/users';
import { SimpleAssortment } from './seeds/assortments';

let graphqlFetch;

describe('TranslatedAssortmentsText', () => {
  beforeAll(async () => {
    await setupDatabase();
    graphqlFetch = createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe('Query.translatedAssortmentsText for admin user should', () => {
    it('return list of assortment text when existing id is passed', async () => {
      const {
        data: { translatedAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
              title
              description
              locale
              subtitle
              slug
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      expect(translatedAssortmentTexts.length).toEqual(2);
      expect(translatedAssortmentTexts).toMatchObject([
        {
          _id: 'german',
          title: 'simple assortment de',
          description: 'text-de',
          locale: 'de',
          subtitle: 'subsimple assortment de',
          slug: 'slug-de'
        },
        {
          _id: 'french',
          title: 'title-fr',
          description: 'text-fr-1',
          locale: 'fr',
          subtitle: 'subtitle-fr',
          slug: 'slug-fr'
        }
      ]);
    });

    it('return empty array when non-existing id is passed', async () => {
      const {
        data: { translatedAssortmentTexts },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: 'non-existing-id',
        },
      });

      expect(translatedAssortmentTexts.length).toEqual(0);
    });
  });

  describe('Query.translatedAssortmentTexts for anonymous user should', () => {
    it('return error', async () => {
      const graphqlAnonymousFetch = createAnonymousGraphqlFetch();
      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          query TranslatedAssortmentTexts($assortmentId: ID!) {
            translatedAssortmentTexts(assortmentId: $assortmentId) {
              _id
            }
          }
        `,
        variables: {
          assortmentId: SimpleAssortment[0]._id,
        },
      });
      expect(errors[0].extensions?.code).toEqual('NoPermissionError');
    });
  });
});
