Package.describe({
  name: 'unchained:events',
  version: '1.0.0-rc.4',
  summary: 'Unchained Engine: Event Director',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md',
});

Npm.depends({
  redis: '3.0.2',
});

Package.onUse((api) => {
  api.versionsFrom('2.2');
  api.use('ecmascript');
  api.use('typescript');

  api.use('unchained:logger@1.0.0-rc.4');

  api.mainModule('src/events-index.ts', 'server');
});
