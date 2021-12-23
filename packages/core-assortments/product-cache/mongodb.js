import { AssortmentProductIdCache } from '../db/collections';

const eqSet = (as, bs) => {
  return [...as].join(',') === [...bs].join(',');
};

export async function getCachedProductIds(assortmentId) {
  const assortmentProductIdCache = AssortmentProductIdCache.findOne({
    _id: assortmentId,
  });
  return assortmentProductIdCache?.productIds;
}

export async function setCachedProductIds(assortmentId, productIds) {
  const assortmentProductIdCache = AssortmentProductIdCache.findOne({
    _id: assortmentId,
  });
  if (
    assortmentProductIdCache &&
    eqSet(new Set(productIds), new Set(assortmentProductIdCache.productIds))
  ) {
    return 0;
  }
  const { numberAffected } = AssortmentProductIdCache.upsert(
    { _id: assortmentId },
    {
      $set: {
        productIds,
      },
    }
  );
  return numberAffected;
}
