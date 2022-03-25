Package.describe({
  name: 'unchained:utils',
  version: '1.0.0-rc.13',
  summary: 'Unchained Engine: Helper Functions',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lru-cache': '6.0.0',
  hashids: '2.2.8',
  locale: '0.1.0',
  'simpl-schema': '1.12.0',
  bson: '4.5.4',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.use('unchained:logger@1.0.0-rc.13');

  api.mainModule('src/utils-index.js', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript@4.4.0');

  api.use('unchained:utils@1.0.0-rc.13');

  api.mainModule('tests/utils-index.test.js');
});
