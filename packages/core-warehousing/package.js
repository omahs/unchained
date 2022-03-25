Package.describe({
  name: 'unchained:core-warehousing',
  version: '1.0.0-rc.13',
  summary: 'Unchained Engine Core: Warehousing',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
  'node-sheets': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.13');
  api.use('unchained:events@1.0.0-rc.13');
  api.use('unchained:logger@1.0.0-rc.13');

  api.mainModule('src/warehousing-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb');
  api.use('unchained:core-warehousing');

  api.mainModule('tests/warehousing-index.test.ts');
});
