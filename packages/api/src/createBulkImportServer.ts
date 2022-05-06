import { createLogger } from 'meteor/unchained:logger';
import { Context, UnchainedAPI } from '@unchainedshop/types/api';
import { WebApp } from 'meteor/webapp';
import { IncomingMessage } from 'http';
import { checkAction } from './acl';
import { actions } from './roles';

const logger = createLogger('unchained:api');

const { BULK_IMPORT_API_PATH = '/bulk-import' } = process.env;

const bulkImportMiddleware = async (req, res) => {
  try {
    const resolvedContext = req.unchainedContext as Context;
    await checkAction(resolvedContext, (actions as any).bulkImport);

    const date = new Date().toISOString();
    const stream = resolvedContext.bulkImporter.BulkImportPayloads.openUploadStreamWithId(
      date,
      `${date}.json`,
      {
        contentType: 'application/json',
      },
    );
    if (req.method === 'POST') {
      req
        .pipe(stream)
        .on('error', (e) => {
          logger.error(e.message);
          res.writeHead(503);
          res.end(JSON.stringify(e));
        })
        .on('finish', async (file) => {
          try {
            const work = await resolvedContext.modules.worker.addWork(
              {
                type: 'BULK_IMPORT',
                input: {
                  payloadId: file._id,
                  payloadSize: file.length,
                  createShouldUpsertIfIDExists: !!req.query?.createShouldUpsertIfIDExists,
                  skipCacheInvalidation: !!req.query?.skipCacheInvalidation,
                  remoteAddress: resolvedContext.remoteAddress,
                },
                retries: 0,
                priority: 10,
              },
              resolvedContext.userId,
            );

            res.writeHead(200);
            res.end(JSON.stringify(work));
          } catch (e) {
            logger.error(e.message);
            res.writeHead(503);
            res.end(JSON.stringify(e));
          }
        });
    } else {
      res.writeHead(404);
      res.end();
    }
  } catch (e) {
    logger.error(e.message);
    res.writeHead(503);
    res.end(JSON.stringify(e));
  }
};

export default (options) => {
  const { context } = options || {};
  WebApp.connectHandlers.use(
    BULK_IMPORT_API_PATH,
    async (req: IncomingMessage & { unchainedContext?: UnchainedAPI }, res) => {
      const resolvedContext = await context({ req, res });
      req.unchainedContext = resolvedContext as Context;
      bulkImportMiddleware(req, res);
    },
  );
};
