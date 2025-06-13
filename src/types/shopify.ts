import type { OrderItem } from './webhook';
import type { ShippingItem } from './shipping';

export type ShopifyProductVariantId = number | null;

export type ShopifyTableRate = number | null;

export type ShopifyRateTable = Map<ShopifyProductVariantId, ShopifyTableRate>;

export interface ShopifyRequestOpts {
  // debug?: boolean,
  gqlQuery: string
}

export interface ShopifyGraphQlResponse {
  data: ShopifyGraphQlResponseData,
  extensions: {
    cost: ShopifyGraphQlCost
  }
}

interface ShopifyGraphQlCost {
  requestedQueryCost: number,
  actualQueryCost: number,
  throttleStatus: ShopifyGraphQlThrottleStatus
}

interface ShopifyGraphQlThrottleStatus {
  maximumAvailable: number,
  currentlyAvailable: number,
  restoreRate: number
}
/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
type ShopifyGraphQlResponseData = ShopifyGraphQlData | ShopifyGraphQlMultiData;
/* eslint-enable @typescript-eslint/no-redundant-type-constituents */

type ShopifyGraphQlData = any;

export type ShopifyGraphQlMultiData = object;

interface ShopifyGraphQlMetafieldNode {
  id: string,
  key: string,
  value: string | number
}

interface ShopifyGraphQlProduct {
  id: string,
  title: string,
  tags: Array<string>,
  metafields?: {
    edges: Array<ShopifyGraphQlMetafieldNode>
  }
  totalUnits?: null | {
    value: string | number
  }
}

export interface ShopifyGraphQlProductVariant {
  id: string,
  sku: string,
  shippingItems?: null | {
    value: string
  },
  numBoxes?: null | {
    value: string | number
  }
  product: ShopifyGraphQlProduct
}

export interface ShopifyGraphQlProductVariantRate {
  id: string,
  rate: null | {
    value?: string
  }
}

export type ShopifyShippingItem = Omit<ShippingItem, 'packagingType'>;

export interface DressedOrderItem extends OrderItem {
  shopifyProduct: IShopifyProduct
}

export interface IShopifyProduct {
  // identifiers
  readonly productId: number;
  readonly variantId: number;
  readonly sku: string;

  // metadata
  readonly totalUnits?: number;
  readonly numBoxes?: number;
  readonly shippingItems?: Array<ShopifyShippingItem>;
  readonly tags: Array<string>;

  // Lot type
  readonly isBoxLot: boolean;
  readonly isPallet: boolean;
  readonly isTruckload: boolean;

  shipsByFreight(): boolean;

  isTagged( s: string ): boolean;

}
