import type { Contact, OrderItem } from './webhook';
import type { ShippingItem, PackagingType } from './shipping';

export interface IRate {
  readonly service_name: string;
  readonly description: string;
  readonly service_code: string;
  readonly currency: string;
  readonly total_price: string;
  readonly phone_required?: boolean;
  readonly min_delivery_date?: string;
  readonly max_delivery_date?: string;
}

export interface RateOptions {
  isFreight: boolean
}

export interface RateProviderRate {
  provider: 'PROMO' | 'ZONE' | 'TABLE' | 'UPS' | 'FREIGHT_QUOTE',
  cost: number,
  packagingType: PackagingType,
  numberOfRatedItems: number,
  options: RateOptions,
}

export interface ComputeRateOptions {
  destination: Contact,
  orderItems: Array<OrderItem>
}

export interface IRateProvider {
  getBoxRates( shippingItems: Array<ShippingItem>, destination: Contact ): Promise< Array<RateProviderRate> >;
  getPalletRates( palletItems: Array<ShippingItem>, destination: Contact ): Promise< Array<RateProviderRate> >;
}

export interface RateResponse {
  rates: Array<IRate>
}