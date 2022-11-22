import './load_env';
import express from 'express';
import cookieParser from 'cookie-parser';
import http from 'http';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { startPlatform, connectPlatformToExpress4 } from '@unchainedshop/platform';
import { defaultModules, connectDefaultPluginsToExpress4 } from '@unchainedshop/plugins';
import serveStatic from 'serve-static';

import seed from './seed';

const start = async () => {
  const app = express();
  const httpServer = http.createServer(app);

  app.use(cookieParser());

  const engine = await startPlatform({
    introspection: true,
    modules: defaultModules,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    options: {
      accounts: {
        password: {
          twoFactor: {
            appName: 'Example',
          },
        },
      },
      payment: {
        filterSupportedProviders: async ({ providers }) => {
          return providers.sort((left, right) => {
            if (left.adapterKey < right.adapterKey) {
              return -1;
            }
            if (left.adapterKey > right.adapterKey) {
              return 1;
            }
            return 0;
          });
        },
      },
    },
  });

  await seed(engine.unchainedAPI);

  connectPlatformToExpress4(app, engine);
  connectDefaultPluginsToExpress4(app, engine);

  app.use(serveStatic('static', { index: ['index.html'] }));

  await httpServer.listen({ port: process.env.PORT || 3000 });
  console.log(`🚀 Server ready at http://localhost:${process.env.PORT || 3000}`);
};

start();
