Package.describe({
  name: 'unchained:mongodb',
  version: '1.0.0-rc.6',
  summary: 'Unchained Engine: MongoDB provider for unchained platform',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('mongo');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:utils@1.0.0-rc.6');

  api.mainModule('src/mongodb-index.js');
});

Package.onTest((api) => {
  api.use('meteortesting:mocha');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:mongodb@1.0.0-rc.6');

  api.mainModule('test/mongodb-index.tests.js');
});
