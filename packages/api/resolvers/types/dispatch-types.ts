import { DeliveryProvider } from '@unchainedshop/types/delivery';
import { Product } from '@unchainedshop/types/products';
import { WarehousingProvider } from '@unchainedshop/types/warehousing';
import crypto from 'crypto';

export const Dispatch = {
  _id: (params: {
    product: Product;
    deliveryProvider: DeliveryProvider;
    warehousingProvider: WarehousingProvider;
    referenceDate: Date;
    quantity: number;
    country: string;
    userId?: string;
  }) =>
    crypto
      .createHash('sha256')
      .update(
        [
          params.product._id,
          params.deliveryProvider._id,
          params.warehousingProvider._id,
          params.referenceDate,
          params.quantity,
          params.country,
          params.userId || 'ANONYMOUS',
        ].join('')
      )
      .digest('hex'),
};
