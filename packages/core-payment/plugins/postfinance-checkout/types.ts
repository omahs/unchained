export enum IntegrationModes {
  PaymentPage = 'PaymentPage',
  Lightbox = 'Lightbox',
  iFrame = 'iFrame',
}

export type SignResponse = {
  transactionId: number;
  location: string | null;
};

export type WebhookData = {
  eventId: number;
  entityId: number;
  listenerEntityId: number;
  listenerEntityTechnicalName: string;
  spaceId: number;
  webhookListenerId: number;
  timestamp: string; // "YYYY-MM-DDTHH:MM:ss+0000", e.g. "2022-02-18T12:40:42+0000"
};
