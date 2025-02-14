import { MessageTypes } from '@unchainedshop/types/platform.js';
import { MessagingDirector } from '@unchainedshop/core-messaging';
import { resolveOrderRejectionTemplate } from '../templates/resolveOrderRejectionTemplate.js';
import { resolveAccountActionTemplate } from '../templates/resolveAccountActionTemplate.js';
import { resolveForwardDeliveryTemplate } from '../templates/resolveForwardDeliveryTemplate.js';
import { resolveOrderConfirmationTemplate } from '../templates/resolveOrderConfirmationTemplate.js';
import { resolveQuotationStatusTemplate } from '../templates/resolveQuotationStatusTemplate.js';
import { resolveEnrollmentStatusTemplate } from '../templates/resolveEnrollmentStatusTemplate.js';

export const setupTemplates = () => {
  MessagingDirector.registerTemplate(MessageTypes.ACCOUNT_ACTION, resolveAccountActionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.DELIVERY, resolveForwardDeliveryTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_CONFIRMATION, resolveOrderConfirmationTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ORDER_REJECTION, resolveOrderRejectionTemplate);
  MessagingDirector.registerTemplate(MessageTypes.QUOTATION_STATUS, resolveQuotationStatusTemplate);
  MessagingDirector.registerTemplate(MessageTypes.ENROLLMENT_STATUS, resolveEnrollmentStatusTemplate);
};
