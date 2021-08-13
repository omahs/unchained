Package.describe({
  name: 'unchained:core-delivery',
  version: '1.0.0-beta12',
  summary: 'Unchained Engine Core: Delivery',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('mongo');
  api.use('promise');
  api.use('dburles:collection-helpers@1.1.0');
  api.use('aldeed:collection2@3.2.1');
  api.use('unchained:utils@1.0.0-beta12');
  api.use('unchained:core-logger@1.0.0-beta12');
  api.use('unchained:core-pricing@1.0.0-beta12');
  api.use('unchained:core-countries@1.0.0-beta13');
  api.use('unchained:core-worker@1.0.0-beta12');
  api.use('unchained:core-events@1.0.0-beta12');

  api.mainModule('delivery.js', 'server');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:core-delivery');
  api.mainModule('delivery-tests.js');
});
