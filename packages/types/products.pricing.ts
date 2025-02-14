import { Order } from './orders.js';
import { OrderDiscount } from './orders.discounts.js';
import {
  BasePricingAdapterContext,
  IPricingAdapter,
  IPricingDirector,
  IPricingSheet,
  PricingCalculation,
} from './pricing.js';
import { Product, ProductConfiguration } from './products.js';
import { User } from './user.js';

export enum ProductPricingRowCategory {
  Item = 'ITEM',
  Discount = 'DISCOUNT',
  Tax = 'TAX',
}

export interface ProductPricingCalculation extends PricingCalculation {
  discountId?: string;
  isTaxable: boolean;
  isNetPrice: boolean;
  rate?: number;
}

export interface ProductPricingAdapterContext extends BasePricingAdapterContext {
  country: string;
  currency: string;
  product: Product;
  quantity: number;
  configuration: Array<ProductConfiguration>;
}

export type ProductPricingContext = {
  country?: string;
  currency?: string;
  discounts?: Array<OrderDiscount>;
  order?: Order;
  product?: Product;
  quantity?: number;
  configuration: Array<ProductConfiguration>;
  user?: User;
};

export interface IProductPricingSheet extends IPricingSheet<ProductPricingCalculation> {
  addItem: (params: Omit<ProductPricingCalculation, 'category' | 'discountId'>) => void;
  itemSum: () => number;
  getItemRows: () => ProductPricingCalculation[];
  unitPrice: (params?: { useNetPrice: boolean }) => ProductPricingCalculation;
}

export type IProductPricingAdapter = IPricingAdapter<
  ProductPricingAdapterContext,
  ProductPricingCalculation,
  IProductPricingSheet
>;

export type IProductPricingDirector = IPricingDirector<
  ProductPricingContext,
  ProductPricingCalculation,
  ProductPricingAdapterContext,
  IProductPricingSheet,
  IProductPricingAdapter
>;

export type ProductPriceRate = {
  baseCurrency: string;
  quoteCurrency: string;
  rate: number;
  expiresAt: Date;
  timestamp: Date;
};
