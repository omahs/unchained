import type {
  FetchDatatransFn,
  AuthorizeAuthenticatedRequestPayload,
  AuthorizeAuthenticatedResponse,
} from './types';

export default async function authorizeAuthenticated({
  transactionId,
  ...payload
}: AuthorizeAuthenticatedRequestPayload): Promise<AuthorizeAuthenticatedResponse> {
  const reqBody = {
    ...payload,
    autoSettle: false,
  };

  const { fetchDatatrans }: { fetchDatatrans: FetchDatatransFn } = this;
  const result = await fetchDatatrans(`/v1/transactions/${transactionId}/authorize`, reqBody);
  const json = await result.json();
  return json;
}
