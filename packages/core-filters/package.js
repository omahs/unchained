Package.describe({
  name: 'unchained:core-filters',
  version: '1.0.0-rc.17',
  summary: 'Unchained Engine Core: Filters',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'simpl-schema': '1.12.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.17');
  api.use('unchained:events@1.0.0-rc.17');
  api.use('unchained:logger@1.0.0-rc.17');

  api.mainModule('src/filters-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:core-filters');
  api.use('unchained:mongodb');
  api.use('unchained:core-products');

  api.mainModule('tests/filters-index.test.ts');
});
