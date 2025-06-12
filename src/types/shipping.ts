import type { IShopifyProduct } from './shopify';

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
  shopifyProduct?: IShopifyProduct
}