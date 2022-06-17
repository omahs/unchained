Package.describe({
  name: 'unchained:core-users',
  version: '1.1.1',
  summary: 'Unchained Engine Core: Users',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  locale: '0.1.0',
  uuid: '7.0.1',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.0',
  '@unchainedshop/roles': '1.1.1',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.1.0');
  api.use('unchained:events@1.1.0');
  api.use('unchained:file-upload@1.1.0');

  api.mainModule('src/users-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.1.0');
  api.use('unchained:core-users@1.1.0');

  api.mainModule('tests/users-index.test.ts');
});
