import { Context } from '@unchainedshop/types/api';
import { AssortmentLink } from '@unchainedshop/types/assortments';

const upsert = async (assortmentLink: AssortmentLink, { modules, userId }: Context) => {
  if (
    !(await modules.assortments.assortmentExists({
      assortmentId: assortmentLink.childAssortmentId,
    }))
  ) {
    throw new Error(`Can't link non-existing assortment ${assortmentLink.childAssortmentId}`);
  }
  try {
    const newAssortmentLink = await modules.assortments.links.create(
      assortmentLink,
      { skipInvalidation: true },
      userId,
    );
    return newAssortmentLink;
  } catch (e) {
    return modules.assortments.links.update(
      assortmentLink._id,
      assortmentLink,
      { skipInvalidation: true },
      userId,
    );
  }
};

export default async (
  { children, authorId, assortmentId: parentAssortmentId },
  unchainedAPI: Context,
) => {
  const { modules, userId } = unchainedAPI;
  const assortmentLinkIds = await Promise.all(
    children.map(async ({ assortmentId: childAssortmentId, ...childrenRest }) => {
      const assortmentLink = await upsert(
        {
          ...childrenRest,
          authorId,
          parentAssortmentId,
          childAssortmentId,
        } as AssortmentLink,
        unchainedAPI,
      );
      return assortmentLink._id;
    }),
  );
  await modules.assortments.links.deleteMany(
    {
      _id: { $nin: assortmentLinkIds },
      parentAssortmentId,
    },
    { skipInvalidation: true },
    userId,
  );
};
