Package.describe({
  name: 'unchained:core-currencies',
  version: '1.0.0-rc.20',
  summary: 'Unchained Engine Core: Currencies',
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

  api.use('unchained:utils@1.0.0-rc.20');
  api.use('unchained:events@1.0.0-rc.20');

  api.mainModule('src/currencies-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-rc.20');
  api.use('unchained:core-currencies');

  api.mainModule('tests/currencies-index.test.ts');
});
