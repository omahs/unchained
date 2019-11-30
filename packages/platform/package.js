Package.describe({
  name: 'unchained:platform',
  version: '0.36.1',
  summary: 'Unchained Engine',
  git: 'https://github.com/unchainedshop/unchained',
  documentation: 'README.md'
});

Package.onUse(api => {
  api.versionsFrom('1.8');

  api.use('ecmascript');
  api.use('random');
  api.use('check');
  api.use('accounts-base');
  api.use('dburles:factory@1.1.0');
  api.use('unchained:core@0.36.1');
  api.use('unchained:core-currencies@0.36.1');
  api.use('unchained:core-countries@0.36.1');
  api.use('unchained:core-delivery@0.36.1');
  api.use('unchained:core-discounting@0.36.1');
  api.use('unchained:core-documents@0.36.1');
  api.use('unchained:core-languages@0.36.1');
  api.use('unchained:core-logger@0.36.1');
  api.use('unchained:core-messaging@0.36.1');
  api.use('unchained:core-quotations@0.36.1');
  api.use('unchained:core-orders@0.36.1');
  api.use('unchained:core-payment@0.36.1');
  api.use('unchained:core-pricing@0.36.1');
  api.use('unchained:core-products@0.36.1');
  api.use('unchained:core-users@0.36.1');
  api.use('unchained:core-bookmarks@0.36.1');
  api.use('unchained:core-warehousing@0.36.1');
  api.use('unchained:core-filters@0.36.1');
  api.use('unchained:core-assortments@0.36.1');
  api.use('unchained:api@0.36.1');

  api.mainModule('platform.js', 'server');
});

Package.onTest(api => {
  api.use('ecmascript');
  api.use('unchained:platform');
  api.mainModule('platform-tests.js');
});
