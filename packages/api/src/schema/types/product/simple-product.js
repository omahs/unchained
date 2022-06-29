export default [
  /* GraphQL */ `
    """
    Simple Product
    """
    type SimpleProduct implements Product {
      _id: ID!
      sequence: Int!
      status: ProductStatus!
      tags: [String!]
      created: DateTime
      updated: DateTime
      published: DateTime
      media(limit: Int = 10, offset: Int = 0, tags: [String!]): [ProductMedia!]!
      texts(forceLocale: String): ProductTexts
      catalogPrice(quantity: Int = 1, currency: String): Price
      leveledCatalogPrices(currency: String): [PriceLevel!]!
      simulatedPrice(currency: String, useNetPrice: Boolean = false, quantity: Int = 1): Price
      simulatedDiscounts(quantity: Int = 1): [ProductDiscount!]
      simulatedDispatches(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Timestamp
        quantity: Int = 1
      ): [Dispatch!]
      simulatedStocks(
        deliveryProviderType: DeliveryProviderType = SHIPPING
        referenceDate: Timestamp
      ): [Stock!]
      assortmentPaths: [ProductAssortmentPath!]!
      siblings(
        assortmentId: ID
        limit: Int = 10
        offset: Int = 0
        includeInactive: Boolean = false
      ): [Product!]!
      dimensions: Dimensions
      sku: String
      baseUnit: String
      salesUnit: String
      salesQuantityPerUnit: String
      defaultOrderQuantity: Int
      reviews(
        limit: Int = 10
        offset: Int = 0
        sort: [SortOptionInput!]
        queryString: String
      ): [ProductReview!]!
    }
  `,
];
