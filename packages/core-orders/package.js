Package.describe({
  name: 'unchained:core-orders',
  version: '1.1.3',
  summary: 'Unchained Engine Core: Orders',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.3',
  '@unchainedshop/utils': '1.1.3',
  // '@unchainedshop/events': '1.1.4', // PEER
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/orders-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-orders');

  api.mainModule('tests/orders-index.test.ts');
});
