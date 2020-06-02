import {
  setupDatabase,
  createLoggedInGraphqlFetch,
  createAnonymousGraphqlFetch,
} from "./helpers";
import { ADMIN_TOKEN } from "./seeds/users";
import { SimpleAssortment } from "./seeds/assortments";

let connection;
let graphqlFetch;

describe("AssortmentLink", () => {
  beforeAll(async () => {
    [, connection] = await setupDatabase();
    graphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  afterAll(async () => {
    await connection.close();
  });

  describe("mutation.addAssortmentLink for admin users should", () => {
    it("Create assortment link successfuly when passed a valid assortment IDs", async () => {
      const {
        data: { addAssortmentLink },
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [String!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
              sortKey
              tags
              meta
              parent {
                _id
              }
              child {
                _id
              }
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[0]._id,
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ["assortment-link-test"],
        },
      });

      expect(addAssortmentLink._id).not.toBe(null);
    });

    it("return error when passed invalid parent assortment ID", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [String!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: "invalid-id",
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ["assortment-link-test"],
        },
      });
      expect(errors.length).toEqual(1);
    });

    it("return error when passed invalid child assortment ID", async () => {
      const { errors } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [String!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[3]._id,
          childAssortmentId: "invalid-id",
          tags: ["assortment-link-test"],
        },
      });
      expect(errors.length).toEqual(1);
    });
  });

  describe("mutation.addAssortmentLink for anonymous user should", () => {
    it("return error", async () => {
      const graphqlAnonymousFetch = await createAnonymousGraphqlFetch();

      const { errors } = await graphqlAnonymousFetch({
        query: /* GraphQL */ `
          mutation AddAssortmentLink(
            $parentAssortmentId: ID!
            $childAssortmentId: ID!
            $tags: [String!]
          ) {
            addAssortmentLink(
              parentAssortmentId: $parentAssortmentId
              childAssortmentId: $childAssortmentId
              tags: $tags
            ) {
              _id
            }
          }
        `,
        variables: {
          parentAssortmentId: SimpleAssortment[0]._id,
          childAssortmentId: SimpleAssortment[3]._id,
          tags: ["assortment-link-test"],
        },
      });

      expect(errors.length).toEqual(1);
    });
  });
});
