# Unchained Engine vNEXT

This is a major feature release bringing WebAuthn and Virtual Products including NFT/Token Minting to Unchained Engine. It's also the first version of Unchained Engine that can be extended to run on other Node.js frameworks than Express.

Unchained Engine 2.0 requires Node 16+ now and uses native fetch, this also breaks Meteor compatibility for the moment. The legacy example will be pinned to v1 for the moment.

## GRAPHQL API BREAKING CHANGES
- Tags are now always LowerCase and use an own scalar
- Order.documents has been removed because it was not used since 3 years
- Completely breaks Meteor support (sorry to whom it may concern) for now because Node.js 16+ required, checkout the Kitchensink example for an ESM, non-meteor node app that uses Unchained Engine.
- The fields createdBy, updatedBy, deletedBy and authorId got removed completely from the database and the whole API surface, reasoning behind is that the value most of the time did not represent who actually did what and kept us back using the inner UnchainedCore as type. It just did not deliver on what it promised, it just added bloat. The only place where authorId is still used is in product reviews where users can add reviews and are actual authors of text.

## Major
- Unchained now uses Apollo Server 4.
- We have dropped `expressApp` and instead now export a new function `connectPlatformToExpress4`. That Express implementation can be looked up here and is still the default: https://github.com/unchainedshop/unchained/tree/master/packages/api/src/express. The new structure and internals allows somebody to wire the engine with a serverless/lambda environment or any other Node.js based framework.
- `@unchainedshop/plugins` now has a default export and an Express middleware setup function. Using those functions is dramatically simplifying batteries-included setups.  Checkout the kitchensink example's boot.ts which is now less than 60 lines of code. 
- Support out of the box server-side cookies for login and logout tokens when env `UNCHAINED_COOKIE_DOMAIN` is set. The cookie's name which by default is `unchained_token` can be overwritten by using env `UNCHAINED_COOKIE_NAME`. Unchained will still look for cookies even if the domain is not set but in that case the client has to take care of storing and sending the token.
- Extended users and accounts for WebAuthn standard.
- Added API mutations for the WebAuthn module: `Mutation.createWebAuthnCredentialCreationOptions`, `Mutation.createWebAuthnCredentialRequestOptions`,`Mutation.loginWithWebAuthn`,`Mutation.addWebAuthnCredentials`,`User.webAuthnCredentials`.
- A new product type `TokenizedProduct` has been added added that supports NFT's and other virtual products that have no physical representation. They are converted to tokens through a virtual warehouse once checked-out. 
- A new warehousing provider type `VIRTUAL` has been added that allows to define warehouses for virtual products. In the plugin implementation one can define what happens when a user buys a tokenized product thus what kind of tokens get emitted. Further, tokens support a concept we call "exportability" which allows to bridge an Off-chain token to an On-chain token.
- API has been extended to support the new tokenization concept: `User.tokens`, `Mutation.exportToken`, `Query.token`, `Mutation.updateProductTokenization`
- A new ERC Metadata Server is built into Unchained allowing to generate Ethereum compatible ERC-1155 and ERC-721 metadata JSON files for tokenized products.

## Minor
- Currencies now have a field `decimals` to define how many decimals are there. This is needed for general currency conversion between cryptocurrencies and Fiat and also helps to display the amount of arbitrary currencies better on frontends.
- The currency conversion plugin now depends on decimals and works across any currency pairs when there is conversion rates stored.
- Conversion rates are now fetched based on a regular job and not live when needed, this improves performance and stability
- There can now be more than 1 external job type
- The Cryptopay Plugin has been refactored from the ground up and various issues have been fixed

## Patch
- Further limited exposure of data and stacktrace in exceptions
- Fix file upload tests

### Introduction to WebAuthn

You can even register with WebAuthn, login with e registered device or add WebAuthn to an existing user. So get to know the concept, checkout https://webauthn.io

Registration Flow:
```
Added Mutation.createWebAuthnCredentialCreationOptions(username: String!, extensionOptions: JSON): JSON!
Mutation.createUser: added new input field webAuthnPublicKeyCredentials
```

Login Flow:
```
Added Mutation.createWebAuthnCredentialRequestOptions(username: String, extensionOptions: JSON): JSON!
Added Mutation.loginWithWebAuthn(webAuthnPublicKeyCredentials: JSON!): LoginMethodResponse
```

Device Management:
```
Added Mutation.addWebAuthnCredentials(credentials: JSON!): User!
Added Mutation.removeWebAuthnCredentials(credentialsId: ID!): User!
Added User.webAuthnCredentials: [WebAuthnCredentials!]!
```

# Unchained Engine v1.2

Unchained has been converted from Meteor atmosphere packages to ESM npm packages and is now compatible
with most recent Node.js versions and a broad range of builders and webservers like express.js, connect,
next, fastify. Switch even improved bootup performance of meteor apps by 2-3x in dev mode.

To show how that works, we have added a new example "kitchensink" which is a Express.js based Node.js 16
app in ESM mode.

## Breaking Changes

- To upgrade from meteor to NPM with your existing meteor app you will have to:

1. rename all imports prefixed with `meteor/unchained:` to `@unchainedshop/`, then import all the plugins
   from the new `@unchainedshop/plugins` package
2. add the packages to your app's package.json as dependencies
3. remove all unchainedshop atmosphere packages
4. forward the `WebApp.connectHandlers` to the `expressApp` field when starting the server

- `disableEmailInterception` is not available as option anymore, but you can still disable interception
  in development setting the environment variable `UNCHAINED_DISABLE_EMAIL_INTERCEPTION`
- All atmosphere packages have been transformed to npm packages, all plugins are now in a separate
  package `@unchainedshop/plugins`. Check out the kitchensink's boot.ts to see how to load them.
- The payment webhook endpoints changed from
  `/graphql/stripe, /graphql/apple-iap, /graphql/cryptopay, /graphql/postfinance-checkout, /graphql/cryptopay-pricing`
  to
  `/payment/stripe, /payment/apple-iap, /payment/cryptopay, /payment/postfinance-checkout, /pricing/cryptopay`
- Boilerplate has been removed because it was very outdated. A new create-unchained-app version which
  supports the kitchensink will follow suit.
- Controlpanel has been removed because Admin UI is not on-par and can be used by anyone through the new Sandbox App https://sandbox-v2.unchained.shop

## Minor
- [api] Add sort params to Query.orders, Query.quotations, User.orders, User.enrollments, User.quotations
- [docs] Add typedocs and fix controlpanel references
- [core] Improved types

## Patches
- [core] Fix TOTP high severity bug
- [core] Fix SSO with Unchained Cloud
- [core] Fix discount pricing calculation issues
- [core] Fix crash of findProductIds with assortmentId of non-existing assortment


# Unchained Engine v1.1

## Breaking Changes for Plugin Developers

- [core] Instead of `updateDelivery` and `updatePayment` we now have `updateContext` methods on
  order.delivery and order.payment modules respectively, consistent with the rest of the system.
- [core] Pricing Plugins now receive the ongoing director calculation as a sheet in the parameters
  instead of a function that returns a calculation array on the adapter itself, calls like
  `pricingAdapter.calculationSheet()` have to be migrated to `params.calculationSheet`. Else the
  resetCalculation has been moved to the sheet itself and it can take a calculationSheet to revert.
- [core] Discount `actions` in adapter and director now return a Promise to extend the possibility for
  discount plugins to do async work
- [api] `customFields` has been removed from the input field `UserProfileInput` and custom data has been
  moved internally on the user entity from `user.profile.customFields` to `user.meta`

## Minor

- [api] `query.events` is now extended with additional filter parameters `created` get events created
  after the provided event and the previous `selectTypes` field is changed to `types` and accepts array
  of event types. in addition it is now possible to `sort` the results any field on event type
- [api] A new input field `sort` has been added to many generel queries that return lists of something,
  for ex. Query.products
- [api] A new input field `queryString` has been added to many generel queries that return lists of
  something, with this change it's possible to search for an order number through Query.orders for ex.
- [api] new `mutation.updateUserProfile` is extended to accept new argument `meta` to store extra
  information of a user.
- [api] New default queries were added for all kind of "count" cases so you don't have to query a whole
  list just to get the amount of items, this can be quite helpful for pagination: `workQueueCount`,
  `assortmentsCounts`, `countriesCount`, `currenciesCount`, `deliveryProvidersCount`, `filtersCount`,
  `languagesCount`, `logsCount`, `ordersCount`, `paymentProvidersCount`, `productReviewsCount`,
  `productsCount`, `quotationsCount`, `subscriptionsCount`,
  `usersCount`,`warehousingProvidersCount`,`eventsCount`

## Patches

- [core] Improved Typescript Support
- [core] A bug has been fixed that accidentally made order positions immutable for further changes
- [core] A warehousing plugin now get's to know the actual warehousingProvider's ID
- [core] A bug that rendered the Bulk Importer unusable for product media changes has been fixed
- [api] Fix issue with schema not extendable due use of @deprecated on ARGUMENT_DEFINITION

# Unchained Engine v1.0 ("Maiglöggli")

This is our first major release, it covers all features needed to build highly flexible e-commerce
solutions for B2B and B2C cases. Unchained 1.0 is an almost complete rewrite from javascript to
typescript and is many ways breaking existing code based on the older versions. It's also a major step
toward a Meteor-free future of Unchained which will follow suit after this.

Our Roadmap ahead:

- Unchained 1.x (LTS, released until end of autumn, supported until end of 2023): Small continous
  non-breaking improvements to the current version, please see
  https://github.com/unchainedshop/unchained/issues?q=is%3Aopen+is%3Aissue+milestone%3Av1.1 to follow
- Unchained 2.0 (End of 2022): Complete Meteor-free and pure ESM-only version of Unchained Engine that
  runs on edge frameworks.

## Breaking changes

- [core] We have removed the Matomo tracker because it was not a plugin but rather an example of an event
  tracking implementation, it will be re-added later to a "recipes" docs page
- [platform, api, core] Refactor Unchained Engine's core with the goal to add typescript support, get rid
  of classes and reduce the usage of meteor package depedencies to a minimum. This leads to a completely
  new SW architecture. The event director and the databse are initialised in the platform and injected
  into the core modules and services. The modules provide a well-defined module API to manage the data
  and the custom services make use of the modules to fetch and manipulate.
- [core] `UNCHAINED_INVALIDATE_PROVIDERS` has been removed in order for an inverted
  `UNCHAINED_DISABLE_PROVIDER_INVALIDATION`
- [core] NEW core module `core-files` that uses [minio cloud object storage](https://min.io/) compatible
  with [amazon s3 cloud storage api](https://aws.amazon.com/s3/). This update provides a scalable files
  storage solution for all the projects that use it. All the previous file management APIs now use this
  module under the hood in addition there are few new endpoint added that support signed put url based
  upload namely `prepareUserAvatarUpload`, `prepareProductMediaUpload`, `prepareAssortmentMediaUpload`
  and `confirmMediaUpload` that can be used to generate signed PUT url for file upload. to learn more on
  how to use this module refer to [docs](https://docs.unchained.shop/). **All existing media's will not
  work anymore and need to be migrated by the developer.**
- [api] `Date` values that previously were returned as timestamps are now converted to UTC compliant with
  the date-time format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for
  representation of dates and times using the Gregorian calendar to mitigate issues related to timezone.
  while mutations that passed timestamp value will not cause an issue, the frontend code that expects
  UNIX timestamp value for the `DateTime` value needs to be updated. this included but not only -
  `created`, `updated`, `deleted` values on all entities that previously exposed this fields -
  `order.ordered`, `order.confirmed` - `product.published` - `quotation.expires`, `quotation.fulfilled`,
  `quotation.rejected` - `subscription.updated`
- [core] Upgrade to new GraphQL multi-part standard with graphql-upload pinning to v12, please use the
  latest graphql-upload-client
- [core] Environment variables `LANG`, `COUNTRY` & `CURRENCY` have to be prefixed with `UNCHAINED_` to
  prevent a conflict that may occur with other systems environment variables.
- [core] upsertLocalizedText for products and assortments does not automatically change the slug anymore,
  explicitly set it by providing a slug property
- [core] Remove cron worker `@unchainedshop/core-worker/workers/cron`, use the interval worker instead
- [core] `cronText` has been removed from `configureAutoscheduling` in favor of `schedule`, `schedule`
  has to be a later.js compliant schedule definition. If you want to reuse the custom cronText define
  schedule like `later.parse.text('every 5 mins');` Likewise `autoSchedulingCronText` has been removed
  from subscription settings and replaced with `autoSchedulingSchedule`
- [core] `core-subscriptions` package is now obsolete and a new `core-enrollments` package with the same
  functionality has been added. This is to counterfeit problems with GraphQL Subscriptions from the spec.
- [api] The meta field has been removed, this will affect the following types that previously had a
  `meta` field
  ```
  Assortment.meta
  AssortmentProduct.meta
  AssortmentFilter.meta
  AssortmentLink.meta
  Media.meta
  Product.meta
  ProductReview.meta
  ProductReviewVote.meta
  Quotation.meta
  Subscription.meta
  SubscriptionDelivery.meta
  SubscriptionPayment.meta
  Order.meta
  OrderDelivery.meta
  OrderPayment.meta
  ```
- [schema] SPECIAL ATTENTION REQUIRED: `Money` type has been completely removed and was replaced with
  `Price`, this simplifies reading out prices but involves changing potentially a lot of FRONTEND CODE!.
  This change will affect the following types and any other type that has fields of this types

  ```
  ProductPrice.price
  ProductDiscount.total
  DeliveryFee.price
  Order.total
  OrderDelivery.fee
  OrderDiscountable.total
  OrderDiscount.total
  OrderItem.unitPrice
  OrderItem.total
  OrderPayment.fee
  ```

## Major

- [core] Bulk Importer now supports skipping the built-in cache invalidation run at the end by using
  `skipCacheInvalidation`
- [core] Bulk Importer now supports defining custom entities to sync
- [api] Product, Assortment & Filter texts are now loaded through a Dataloader which improves Performance
- [api] A new `RANGE` filter type has been added. A range filter parses filter query values differently
  in searchProducts than MULTI_SELECT and allows to do open-end filtering on decimal values by using `:`.
  As an example, `0:500` will match all option values between 0 and 500.
- [core] Assortment to Product Id cache now resides in a special collection to optimize performance and
  can be further customized to cache these caches in a custom cache module. See new settings in
  assortments: `setCachedProductIds` & `getCachedProductIds`
- [examples] Updated Meteor to latest version 2.4 from 2.2 for the minimal project (see
  https://docs.meteor.com/changelog.html#v2420210915)
- [api] Added support for Two Factor Auth with TOTP:
  ```
  Mutation.buildSecretTOTPAuthURL
  Mutation.disableTOTP
  Mutation.enableTOTP
  User.isTwoFactorEnabled
  ```
- [core] We have added a new Datatrans v2 plugin which is based on the new Datatrans JSON based API and
  allows advanced integration processes like marketplace fee splits and secure fields. Datatrans v2 will
  always use deferred settlement mode when possible, this makes it almost impossible to have the "order
  checkout failed but still charged" issue that was possible before depending on how the payment process
  was implemented client-side, leading to manual work and potential client frustration.
- [core] orderNumber, quotationNumber and enrollmentNumber generation can now be customized, see config
- [controlpanel] Now it's possible to add external links to an extended version of Unchained Admin UI or
  any other site you want to access through the `controlpanel` by providing JSON using the env
  `EXTERNAL_LINKS` variable inside `example/minimal`. The JSON to be provided has to be an array of
  external link definitions in the form of objects with href and title properties
  (`[{ href: string, title: string}]`). If an external link file object is found its content will appear
  in the top menu of the `controlpanel`
- [api] `query.productReviews` is extended to support searching/filtering with title or review and
  sorting all valid fields of product review.
- [api] New mutation `logoutAllSession` added that can be used to remove all tokens of current user
- [platform] Assortment bulk import updated to handle assortment media.
- [api,core] Add support for remotePort and userAgent in context and heartbeat #118
- [api,core,controlpanel] Users with admin roles can now search for specific orders by
  userId,orderId,orderNumber & status through the controlpanel #319
- [core] NEW core module `events` allows to listen to various elementary events and trigger custom code
  based on those. See the documentation here https://docs.unchained.shop/config/events/. We also provide
  two default event backend integrations, one for the local Node.js event emitter and one for Redis. In
  some cases you will only want to react to an event on a worker instance or even completely fire and
  forget and let another software pick up the events, for these cases we strongly suggest to use the
  Redis plugin. An additional MongoDB based event log is available through queries and can be inspected
  through the controlpanel. We will drop support for the MongoDB logging in the future so please make
  sure that you don't tail the Unchained Logs collection, consider migrating to `events` instead.
- [core] `simulatePriceRange` and `catalogPriceRange` helpers added that will return price range of
  products variations assigned for a particular configurable(proxy) product based on the parameters
  provided to them.
- [core] Now experimental it's possible to ensure users to always have a cart assigned to them by setting
  the module config option `ensureUserHasCart` on the orders module to true.
- [core] The query `workQueue` now allows to further narrow the result set based on a creation date range
- [api] We have added a special mutation called `pageView` that you can use to trigger server-side
  pageView tracking events. That way you can connect Unchained with Trackers like Google Analytics or
  Matomo in a private way without cookies.
- [api] New mutation.signPaymentProviderForCheckout to sign generic order payment directly
  (OrderPayment.sign still works but is marked deprecated and will be removed in future major releases)
- [api] three new fields added `ConfigurableProduct.simulatedPriceRange` ,
  `ConfigurableProduct.catalogPriceRange`, `SimulateProduct.leveledCatalogPrices`
  `PlanProduct.leveledCatalogPrices`
- [platform] Additionally related with the above feature it's possible to assign carts for all existing
  users in the system at boot time by passing `assignCartForUsers` boolean value to `startPlafom` or
  using the environment variable `UNCHAINED_ASSIGN_CART_FOR_USERS`
- [platform] You can now disable the invalidation of orders at boot time by passing `invalidateProviders`
  boolean value to `startPlafom` or using the environment variable
  `UNCHAINED_DISABLE_PROVIDER_INVALIDATION`. You can also control the max age so that very old carts are
  not invalidated forever with `providerInvalidationMaxAgeDays`.
- [core] It's is now possible to assign media files for assortments.
- [controlpanel] Assortment media upload, remove & reorder functionalities are available.
- [api] Added the following query and mutations that can be used to manage assortment medias

```
Query.translatedAssortmentMediaTexts
Mutation.addAssortmentMedia
Mutation.removeAssortmentMedia
Mutation.reorderAssortmentMedia
Mutation.updateAssortmentMediaText
AssortmentMediaTexts
AssortmentMedia
UpdateAssortmentMediaTextInput
ReorderAssortmentMediaInput
```

- [core] New module `products.prices.rates` for currency rates and a generic `ProductPriceRateConversion`
  plugin that consumes these rates.
- [core] New Cryptopay pricing and payment plugin to support the self-hosted, decentralized Crypto
  Payment Gateway for payments in BTC, ETH, and arbitrary ERC20 tokens.
- [core] New
  [PostFinance Checkout](https://www.postfinance.ch/de/unternehmen/produkte/e-commerce/postfinance-checkout-flex.html)
  payment plugin with support for deferred settlements and refunds.
- [api] New mutation `rejectOrder` and corresponding e-mail template `ORDER_REJECTION` to manually reject
  an order with status `PENDING`.
- [core] New
  [Worldline Saferpay](https://www.six-payment-services.com/de/site/e-commerce/learn-more/merchant.html)
  payment plugin.

## Minor

- [core] accountsjs's accountsPassword and accountsServer options can now be configured through the
  normal module configuration of unchained by providing `server` and `password` objects with options.
- [core] The logging of payment providers has been streamlined and is now more verbose by default to help
  track down payment issues
- [core] The password has been changed notify e-mail template is now available in English
- [docs] Improved documentation for orders, accounts, events, subscriptions and email-templating
- [examples] The minimal example now uses Meteor 2.2
- [examples] We created an experimental Matomo Tracker Plugin that is part of the minimal example
- [controlpanel] Fixed various issues, especially with loadMore behavior, user search and UX glitches
- [*] Various additional bugfixes and enhancements between the undocumented releases of 0.61.1 and
  0.61.19 mostly targeting bulk-import and accountsjs stabilization.
- [core] Update ostrio:files to 2.0.1 to mitigate various download issues
- [controlpanel] Find issues with assortment and order lists
- [controlpanel] Ambiguity of where to set environment variable is fixed. Now you can set environment
  related with the Unchained Admin UI at the root directory of `controlpanel` and environemt variables
  related with the engine under root directory of `minimal`.
- [controlpanel] Fix logout with server-side cookies
- [core] Fix issue with price id's beeing null (broke stuff that we didn't want to brake)
- [core] Fix an issue with scheduling jobs based on past or future dates
- [core] Improved Matomo tracker
- [docs] New Get Started Tutorial
- [examples] Seed delivery and payment providers based on environment variables
- [core] Extended events module to make it possible to transform context for specific needs
- [core] Reduce core-events logging verbosity
- [core] Upstream hotfixes from 61.x
- [core] Support for currencies that are based on a contract with the new `contractAddress` field for
  currencies. Used by the Cryptopay plugins to determine the supported ERC20 tokens.
- [core] New twilio plugin to send SMS.

# v0.61.1

This is a bugfix release based on learnings from upgrading client projects

## Breaking changes

- [api] Fix `logout` regression with not falling back to the current token when used without explicit
  token
- [core] `Users.createUser` now sends messages by default, you have to explicitly bail out by either
  providing an option `skipMessaging` to true or set the new `autoMessagingAfterUserCreation` module
  param of users to `false`. Take a look at your seed scripts.
- [platform] Certain fields like `emails` and `services` are now blocked from passing to
  `Users.createUser`. If you have used `emails` in `createUser` seeding before, use email. If you want to
  skip e-mail verification forcefully, use `initialPassword: true`. See the changes in the minimal
  example seed file to get a glimpse.

## Minor

- [examples] Fix minimal example not seeding
- [api] Fix children not receiving includeInactive
- [core] Fix core not receiving module configuration of users
- [core] Fix Assortments.sync always auto publishing all assortments
- [platform] Fix broken cart migration

# v0.61.0

This is a bugfix release based on learnings from upgrading client projects

## Breaking changes

- [api] Removes filterContext and evalContext
- [core] Enrollment E-Mails are sent automatically when `enrollUser` is used with an empty password

## Minor

- [api] Re-introduce `context` field to startPlatform, allowing access to the unchained context function
  so it's possible to adjust the Apollo Server context freely
- [core] Fix regression with forced sortKey parameters when modifying links, filters or products
- [core] Fix regression with enrollment of users triggering verification e-mail #307
- [core] Sends custom AccountsJs Hooks `LoginTokenCreated` and `VerifyEmailSuccess` to hook into E-Mail
  verification (re-enables features based on that prior Unchained < 0.61.0)

# v0.60.0

We are currently rebuilding parts of Unchained under the hood with a new code structure that helps
developers to easily add new resolvers and access the core API's through typescript types.

## Breaking Changes

- [platform] Account Action E-Mail templates now receive different actions than before, for ex.
  `verifyEmail` is now `verify-email`
- [api] `Mutation.setBaseLanguage` removed, base language now set through env `LANG`
- [api] `Mutation.setBaseCountry` removed, base language now set through env `COUNTRY`
- [api] `isBase` removed for countries and languages
- [api] Remove OTP based access to an order
- [core] `Filters.removeFilter` now returns id instead of object
- [core] Removed Assortment helpers `addFilter`, `removeFilter`, `searchProducts`
- [core] Removed Assortment Filter helper `assortmentFilter.filter`
- [core] `findProviderById` & `findReviewById` removed
- [core] You cannot `import '@unchainedshop/core-worker/plugins/heartbeat'` anymore without typescript
  package
- [api] NotFoundErrors have been removed from various queries which return an optional single entity,
  like Query.product(...): Product #299, affects `Query.country`, `Query.currency`,
  `Query.deliveryProvider`, `Query.filter`, `Query.language`, `Query.order`, `Query.paymentProvider`,
  `Query.product`, `Query.productCatalogPrices`, `Query.productReview`, `Query.quotation`,
  `Query.searchProducts (assortmentId)`, `Query.subscription`, `Query.user`, `Query.warehousingProvider`,
  `Query.work`

## Major

- [api] Add Assortment.childrenCount to get a number of child assortments
- [api] New Query.activeWorkTypes to query for all active work types without introspection
- [api] Support for Data Loader
- [api,bookmarks] The Bookmarks core module has been completely refactored, all business logic is now
  accessible through the Apollo GraphQL context
- [utils] Multiple functions have been moved to utils from core.
- [core] The "core" package now is an umbrella for all core modules and does not provide any other
  functions except for the function that loads all modules in order and ties together the typescript
  types
- [roles] Roles package got refactored only keeping a fraction of the previous APIs. We are currently
  rebuilding parts of Unchained under the hood with a new code structure that helps developers to easily
  add new resolvers and access the core API's through typescript types
- [api,core] Business logic and db calls are now wrapped in functions and moved from api to the core
  packages
- [pricing] New open-source pricing plugins:
  - - EUR catalog price auto conversion with ECB rates
  - - Crypto catalog price auto conversion with Coinbase rates
  - - Mercantile Rounding
- [payment] Our official Datatrans plugin now supports all different security modes for signing a
  transaction through env `DATATRANS_SECURITY` and `DATATRANS_SIGN2_KEY`. In the meantime Datatrans has
  released a new modern JSON based 2.0 API. Our Plugin still only supports the legacy API described here
  <https://docs.datatrans.ch/v1.0.1/docs/getting-started-home>

## Minor

- [docs] Added product pricing plugin documentation
- [controlpanel] Updated theming that better reflects our current CI/CD
- [controlpanel] New filters for the work queue to find jobs you're interested in
- [api] Existance checks are now beeing done with count instead of findOne to improve performance
- [api, pricing] Price simulating functions can now take a forced currency
- [tests] Index creation is now reused of example project instead of mocked in db setup

## Patches

- [accountsjs] Regression, default token expiration now after 30 days instead of 20 minutes
- [bulk] Regression, removal did not work

# v0.55.4

## Minor

- [api] Type Assertions (#273)
- Various other bugfixes: #232, #258, #277, #268, #261, #272

# v0.55.3

## Breaking Changes

- [users] enrollUser now supports hashed passwords and uses the existing password field for it

## Patches

- [controlpanel] Fix enrollUser and setPassword

# v0.55.1

## Minor

- [platform] If you used `user.setPassword` before, that function is now async and does not return the
  user object anymore
- [platform] If you used `Users.createUser` before, that function is now async
- [api] setPassword mutation now also supports plain passwords if needed.

## Patches

- [controlpanel] Fix bug in Currency edit form
- [controlpanel] Fix bug with Assortment list not showing the assortments

# v0.55.0

Attention: If you have used Meteor Accounts specific extensions to extend login functionalities for your
Unchained-based project, you will have to rewrite all code that depends on Meteor's accounts packages and
extend the functionality through accounts-js config, strategies and hooks
(<https://www.accountsjs.com/docs/introduction>).

Look for `Accounts.registerLoginHandler`, `Accounts.onLogin` or Meteor Accounts Password based features
like `Accounts.setUsername` or `Accounts.setPassword` to find out if you are affected.

## Breaking Changes

- [api] Auth-related Errors in signup, signin, lost password etc. have other Error Codes now. See
  https://www.accountsjs.com/docs/api/server/globals#enumerations for more information.
- [users] `addEmail` and `updateEmail` no longer send out email verification; you need to trigger the
  verification using `sendVerificationEmail` mutation.
- [users] `enrollUser` doesn't send out the enrollment email by default anymore. You need to trigger it
  using `sendEnrollmentEmail` mutation.
- [api] The functions `getConnection` and `callMethod` have been removed
- [api] `Mutation.resendVerificationEmail` has been renamed to `Mutation.sendVerificationEmail`
- [api] More specific exceptions when using wrong Id's
- [platform] New unchained instances now generate an admin user with an E-Mail of `admin@unchained.local`
  to solve various issues with frontends and services that don't accept addresses like `user@toplevel`.
  Also it's now very important to seed your database AFTER startPlatform.

You have to remove meteor's native accounts packages from the project to use the new unchained version:

```
meteor remove accounts-base accounts-password accounts-oauth
```

## Minor

- [users] `sendEnrollmentEmail` mutation is now available to trigger enrollment emails.
- [api] Enhanced Query.users which now allows to query for users with a fulltext search that takes E-mail
  addresses into account
- [api] Better integration tests that cover more business logic than before

## Patches

- [great-purge-of-meteor] Remove accounts-base and accounts-password from platform package
- [great-purge-of-meteor] Implement new accountsjs package
- [great-purge-of-meteor] Convert all authentication related mutations within
  `api/resolvers/mutations/accounts/loginWithPassword.js` to use accounts-js.
- [great-purge-of-meteor] Convert any Users collection helpers to use accounts-js.
- [api] Fixed an issue which prevented Query.subscription from working at all
- [assortments] Fixed an issue that resulted in totally wrong breadcrumbs in some special edge case
  (assortmentPaths)

---

# v0.54.1

## Patches

- [platform] Fix importing bulk assortments should remove old links
- [pricing] Fix critical issue with discounts resolving to a total cart value of 0

# v0.54.0

## Minor

- [logger] Support for JSON Logging through UNCHAINED_LOG_FORMAT=json
- [api] Larger body limit for the new Bulk Import API

---

# v0.53.2

## Minor

- [core] Compound indexes for text entities

## Patches

- [api] Fix rare case where MESSAGE work type lead to an exception

---

# v0.53.2

Hotfix for broken product text editing through controlpanel

## Minor

- [cp] Update deps
- [docs] Add API Reference

## Patches

- [api] Fix updateProductText not updating text

---

# v0.53.1

Minor tweaks and fixes

## Breaking Changes

The new experimental Bulk Import API allows to import a big list of entities (filters, assortments &
products) at the same time.

## Minor

- [cp] You can now search for users #242
- [payment] New Plugin: Bity (<https://bity.com>)
- [payment] New Plugin: Stripe Legacy Charges
- [api] You can now store arbitrary data when using markPaid
- [api] Add a new field Product.defaultOrderQuantity
- [api] Also support "token" in cookies instead of only meteor_login_token

## Patches

- [great-purge-of-meteor] Remove dburles:factory
- [pricing] Fix currencyCode in pricing when using multiple currencies for the same country

---

# v0.53.0

This new Release is published along our new Documentation Page: <https://docs.unchained.shop>

Contributions by: @Mikearaya @harryadel @schmidsi @pozylon

## Breaking Changes

New Exceptions: A new exception handling #188 now consistently throws much more intelligent errors with
machine-readable error codes than before. This is potentially breaking if you were evaluating the errors
thrown in GraphQL Mutations and Queries before.

Datalayer changes: The following functions now require an authorId to work properly:

- Assortments.createAssortment
- assortment.addProduct
- assortment.addLink
- assortment.addFilter
- Products.createProduct
- product.addMedia (was userId before!)
- product.addMediaLink
- DeliveryProviders.createProvider
- PaymentProviders.createProvider
- WarehousingProviders.createProvider
- Filters.createFilter
- filter.upsertLocalizedText
- variation.upsertLocalizedText
- assortment.upsertLocalizedText
- productMedia.upsertLocalizedText
- product.upsertLocalizedText
- productVariation.upsertLocalizedText

New factory methods to create new Entities (please don't use Entity.insert anymore if you're writing sync
code!), they also require authorId now:

- Countries.createCountry
- Currencies.createCurrency
- Languages.createLanguage
- ProductVariations.createVariation
- ProductMedia.createMedia

Changes to Filter Plugins: The async method search on a FilterAdapter is now searchProducts (!).
Additionally it's possible to override full-text search of Assortments through searchAssortments.

## Minor

- [platform] Migration messages are now logged through logger
- [api] Query.assortments now additionally takes a list of tags and slugs
- [api] Added Query.searchAssortments
- [api] Rename Query.search to Query.searchProducts (Query.search still works but is marked deprecated)
- [api] Exception Handling #188
- [api] Extend Query.users with queryString, allowing to do fulltext searches on users as admin #228
- [core] Refactoring on the underlying Datalayer #190
- [core] It's now possible to control the tax categories for switzerland (mwst, see product-swiss-tax and
  delivery-swiss-tax plugins)
- [examples] Controlpanel Enhancements #162, #227
- [docs] Add Documentation Beta #205
- [docs] Add documenting comments to the GraphQL schema
- [ci] Added CodeQL Security Scanning #218
- [ci] More tests

## Patches

- [api] Fix edge case with Query.search when slugs is set to null
- [api] Fix privileges when using Mutation.updateProductReview, Mutation.answerQuotation,
  Mutation.removeBookmark, Mutation.addPaymentCredentials which were supposed to work as non-admin users
- [api] Fix float problem edge case with super long numbers in Money type
- [core] Fix Sort Order when Faceting #211
- [core] Fix Controlpanel Next.js Warnings #201 #209
- [core] Fix a Problem where Work Items are not retried after a Restart #200
- [core] Fix updateCart updating data that should not #198
- [core] Fix slugs regeneration when title is updated #194
- [core] Great Purge of Meteor: Removed aldeed:index #216
- [core] Fix setting the FILE_STORAGE_PATH through env variable for files
- [core] Fix order discounting when multiple discounts are active at the same time
- [examples] Minimal: Upgrade to Meteor 1.11.1 #206
- [examples] Controlpanel: Upgrade to Apollo Client 3 #206

---

# v0.51.0

Contributions by: @harryadelb, @Mikearaya & @pozylon

## Breaking Changes

We will rename all unchained core specific env variables and prefix them with UNCHAINED\_ in the future,
for now:

- [api] Siblings return only active products by default now
- [payment] The existing Stripe v1 plugin has been removed because it was unsafe to use and depended on
  an old API
- [messaging] The architecture of the messaging core plugin has been completely revamped, also the
  default notification e-mail templates are now loaded as part of the platform package reducing the
  boilerplate code needed when bootstrapping a fresh Unchained project. For example the send-mail
  delivery provider cannot be used anymore due to refactoring of the messaging system. There is a new one
  ("send-message") that needs to be used for this case.
- [api] assignments behaves now exactly the same as products, returning only assignments with active
  products if not specified explicitly with includeInactive = true

## Minor

- [api] Product.siblings now support a parameter "includeInactive" to return inactive products (same like
  for Assortment.products & search)
- [filters] Search now supports a new parameter "ignoreChildAssortments". When activated it will only
  consider directly linked products for search, ignoring sub-assortment products.
- [messaging] New Messaging (#163)
- [filter] The filter plugins are now also called when the queryString is empty, allowing cases like
  user-specific hiding or showing of products system-wide
- [cp] It's now possible to search for products (#178 )
- [tests] Added a whole lot of integration tests (#177 , #176 , #175, #174)
- [api] Improve error reporting when id's (filters, products) don't exist when provided to a mutation
- [payment] Apple In-App-Purchase has landed, supporting stored credentials (#173)
- [payment] Stripe v2 has landed, supporting stored credentials (#179)
- [payment, delivery] Allow to further customize supported providers #161
- Improve performance by using lru-caches at bottleneck points throughout the system
- [worker] It's now possible to define an autoscheduling rule for jobs and the system automatically takes
  care of setting up the jobs

## Patches

- [examples] Fix a regression bug (simple-schema / seeds) when trying to start the minimal example the
  first time
- [ci] Skip caching in CI and dev
- [cp] Various small ui fixes
- [platform] Fixes carts on bootup when a delivery / payment provider is not valid anymore.
- [great-purge-of-meteor] Remove aldeed:index

---

# v0.48.0

## Breaking Changes

We will rename all Unchained core specific env variables and prefix them with UNCHAINED\_ in the future,
for now:

- The Environment variable DISABLE_WORKER has been renamed to UNCHAINED_DISABLE_WORKER
- The Environment variable WORKER_ID has been renamed to UNCHAINED_WORKER_ID
- The Environment variable WORKER_CRON_TEXT has been removed, provide `cronText` as option to
  startPlatform to configure, use your own env var if still needed.
- The Environment variable FIXTURES has been removed, we will remove the fixtures and faker helpers in
  the future.
- [platform] These 3 worker plugins are automatically loaded and started: EventListenerWorker,
  CronWorker, FailedRescheduler. Please remove the worker boot code from your project like this:
  <https://github.com/unchainedshop/unchained/commit/89278ce018bcc8ef5861e60f91cf5fde9d2caec9#diff-0f4e94ac3eacf892b0b4f09738a49635>
- [api] `getCart` now returns a promise
- [users] the `orders` helper now returns a promise
- [payment] Signature of sign changed slightly, takes transactionContext in first property
- [api] User.lastDeliveryAddress has been removed (was never implemented right)
- [payment] Signature of charge changed slightly, takes the order as order in first property

## Minor

- [subscriptions] Introduce Subscriptions Core Module: Please see PR #158
- [payment,user,subscriptions] Stored Credentials: The Payment and User modules have been enhanced to
  support storing payment credentials like creditcards, tokens or aliases used to do fast checkouts. PR
  #158
- [api] All product types now support siblings
- [payment] Datatrans plugin supports aliasing for subscriptions
- [worker] The worker now supports recurring jobs and exposes `configureAutoscheduling` that allows to
  run a specific plugin continously, first used by subscriptions generating orders at a specific rate
- [platform] startPlatform now supports module specific configuration
- [worker] Heartbeat worker supports waiting for a timeout before completion (helpful for integration
  tests)
- [examples] The Dockerfile in minimal now supports proper layer caching and speeds up builds in CI if
  supported by the CI system and the dependencies did not change.
- [assortments] The zipTree function of assortments can now be configured with
  `modules.assortments.zipTree`
- [delivery] It's now possible to customize the sort order of supported delivery providers
  `modules.delivery.sortProviders`
- [payment] It's now possible to customize the sort order of supported payment providers
  `modules.payment.sortProviders`
- [filters] Filters now fallback to no invalidation on startup if not configured
- [logs] Added an index on the created field for logs and also make the log collection expire with a
  MongoDB native feature (<https://docs.mongodb.com/manual/tutorial/expire-data/>). This should improve
  db log performance and disk usage

## Patches

- [api] Fixes removeDiscount regression crashing apollo
- [worker] Now experimental interval worker which does not depend on SyncedCron
- [examples] Various Fixes in Controlpanel
- [examples] Various console output and lint issues
- [tests] Fixed various tests
