/********************************************************
 * Types determined by the structure of data requests/responses
 * in the Shopify Carrier Service webhook
 * 
 ************/
export interface RateRequestBody {
  readonly rate: RateRequest
}

export interface RateRequest {
  readonly origin: Contact,
  readonly destination: Contact,
  readonly items: Array<OrderItem>,
  readonly currency: string,
  readonly locale: string
}

export interface Contact {
  readonly country: string,
  readonly postal_code: string,
  readonly province: string, // note `state` since Shopify is a Canadian company
  readonly city: string,
  readonly name?: string | null,
  readonly address1: string,
  readonly address2?: string | null,
  readonly address3?: string | null,
  readonly phone?: string | null,
  readonly fax?: string | null,
  readonly email?: string | null,
  readonly address_type?: string | null,
  readonly company_name?: string | null
}

export interface OrderItem {
  readonly name?: string | null,
  readonly sku?: string | null,
  readonly quantity: number,
  readonly grams: number,
  readonly price: number,
  readonly vendor?: string | null,
  readonly requires_shipping: boolean,
  readonly taxable: boolean,
  readonly fulfillment_service?: string | null,
  readonly properties?: string | null,
  readonly product_id: number,
  readonly variant_id: number,
}


export class Rate {
  public readonly service_name: string;
  public readonly description: string;
  public readonly service_code: string;
  public readonly currency: string;
  public readonly total_price: string;
  public readonly phone_required?: boolean;
  public readonly min_delivery_date?: string;
  public readonly max_delivery_date?: string;
}

/********************************************************
 * Other internal types
 * 
 ************/

export interface DressedOrderItem extends OrderItem {
  shopifyProduct: Shopify.Product
}

export interface ComputeRateOptions {
  destination: Contact,
  orderItems: Array<OrderItem>
}

export type DimensionUnits =
  'feet' | /* TODO: not valid  in Shipstation */
  'inches' |
  'centimeters';

export type WeightUnits =
  'pounds' |
  'ounces' |
  'grams' |
  'kilograms';

export type PackagingType = 
  'package' |
  'pallet' |
  'ltl' |
  'truckload'
;

export interface ShippingItem {
  packagingType: PackagingType,
  shipsByFreight?: boolean,
  weight: number,
  weightUnits: WeightUnits,
  height: number,
  heightUnits: DimensionUnits,
  length: number,
  lengthUnits: DimensionUnits,
  width: number,
  widthUnits: DimensionUnits,
  doNotRate?: boolean,
  shopifyProduct?: Shopify.Product
}

export class RateProvider {
  public getBoxRates( shippingItems: Array<ShippingItem>, destination: Contact ): Promise< Array<RateProviderRate> >;
  public getPalletRates( palletItems: Array<ShippingItem>, destination: Contact ): Promise< Array<RateProviderRate> >;
}


export interface RateProviderRate {
  provider: 'PROMO' | 'ZONE' | 'TABLE' | 'UPS' | 'FREIGHT_QUOTE',
  cost: number,
  packagingType: PackagingType,
  numberOfRatedItems: number,
  options: RateOptions,
}

export interface RateOptions {
  isFreight: boolean
}

export interface RateResponse {
  rates: Array<Rate>
}


export as namespace CarrierService;