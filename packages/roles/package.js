Package.describe({
  name: 'unchained:roles',
  version: '1.0.0-rc.21',
  summary: 'Unchained Engine: Roles',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  'lodash.clone': '4.5.0',
});

Package.onUse((api) => {
  api.versionsFrom('2.6.1');

  api.use('ecmascript');
  api.use('typescript');

  api.mainModule('src/roles-index.ts');
});

Package.onTest((api) => {
  api.use('ecmascript');
  api.use('unchained:roles');
});
