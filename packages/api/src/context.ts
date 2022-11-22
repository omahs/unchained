import { UnchainedContextResolver } from '@unchainedshop/types/api';
import { UnchainedCore } from '@unchainedshop/types/core';
import instantiateLoaders from './loaders';
import { getLocaleContext } from './locale-context';
import { getUserContext } from './user-context';

let context;

export const getCurrentContextResolver = (): UnchainedContextResolver => context;

export const setCurrentContextResolver = (newContext: UnchainedContextResolver) => {
  context = newContext;
};

export const createContextResolver =
  (unchainedAPI: UnchainedCore, roles: any, version: string): UnchainedContextResolver =>
  async ({ req, res, ...apolloContext }) => {
    const loaders = await instantiateLoaders(req, res, unchainedAPI);
    const userContext = await getUserContext(req, res, unchainedAPI);
    const localeContext = await getLocaleContext(req, res, unchainedAPI);

    return {
      req,
      res,
      ...apolloContext,
      ...unchainedAPI,
      ...userContext,
      ...localeContext,
      loaders,
      roles,
      version,
    };
  };
