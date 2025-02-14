import { createLogger } from '@unchainedshop/logger';
import { UnchainedContextResolver } from '@unchainedshop/types/api.js';
import { systemLocale } from '@unchainedshop/utils';
import { IncomingMessage } from 'http';
import localePkg from 'locale';
import path from 'path';

const { Locale } = localePkg;

const logger = createLogger('unchained:erc-metadata');

const errorHandler = (res) => (e) => {
  logger.error(e.message);
  res.writeHead(503);
  res.end(JSON.stringify({ name: e.name, code: e.code, message: e.message }));
};

const methodWrongHandler = (res) => () => {
  logger.error('Method not supported, return 404');
  res.writeHead(404);
  res.end();
};

export default function ercMetadataMiddleware(contextResolver: UnchainedContextResolver) {
  return async (req: IncomingMessage, res) => {
    try {
      if (req.method !== 'GET') {
        methodWrongHandler(res)();
        return;
      }

      const context = await contextResolver({ req, res });
      const url = new URL(req.url, process.env.ROOT_URL);
      const parsedPath = path.parse(url.pathname);

      if (parsedPath.ext !== '.json') throw new Error('Invalid ERC Metadata URI');

      const [, productId, localeOrTokenFilename, tokenFileName] = url.pathname.split('/');

      const locale = tokenFileName ? localeOrTokenFilename : systemLocale.language;
      const chainTokenId = parsedPath.name;

      const product = await context.modules.products.findProduct({
        productId,
      });

      const [token] = await context.modules.warehousing.findTokens({
        chainTokenId,
        contractAddress: product?.tokenization?.contractAddress,
      });

      const ercMetadata = await context.modules.warehousing.tokenMetadata(
        chainTokenId,
        {
          token,
          product,
          locale: new Locale(locale),
          referenceDate: new Date(),
        },
        context,
      );

      const body = JSON.stringify(ercMetadata);
      res.writeHead(200, {
        'Content-Length': Buffer.byteLength(body),
        'Content-Type': 'text/plain',
      });
      res.end(body);
    } catch (e) {
      errorHandler(res)(e);
    }
  };
}
