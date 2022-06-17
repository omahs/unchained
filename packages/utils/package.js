Package.describe({
  name: 'unchained:utils',
  version: '1.1.1',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '7.7.0',
  'abort-controller': '3.0.0',
  hashids: '2.2.10',
  locale: '0.1.0',
  'simpl-schema': '1.12.0',
  bson: '4.6.2',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.mainModule('src/utils-index.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.use('unchained:utils@1.1.0');

  api.mainModule('tests/utils-index.test.js');
});
