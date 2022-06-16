Package.describe({
  name: 'unchained:core-files',
  version: '1.1.0',
  summary: 'Unchained Engine: Files',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  minio: '7.0.18',
  'mime-types': '2.1.32',
  'simpl-schema': '1.12.0',
  '@unchainedshop/logger': '1.1.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.7.3');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:events@1.1.0');
  api.use('unchained:file-upload@1.1.0');

  api.mainModule('src/files-index.ts', 'server');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.1.0');
  api.use('unchained:core-files@1.1.0');

  api.mainModule('tests/files-index.test.ts');
});
