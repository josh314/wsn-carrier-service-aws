
interface RequestOpts {
  // debug?: boolean,
  gqlQuery: string
}

interface GraphQlResponse {
  data: GraphQlResponseData,
  extensions: {
    cost: GraphQlCost
  }
}

interface GraphQlCost {
  requestedQueryCost: number,
  actualQueryCost: number,
  throttleStatus: GraphQlThrottleStatus
}

interface GraphQlThrottleStatus {
  maximumAvailable: number,
  currentlyAvailable: number,
  restoreRate: number
}
type GraphQlResponseData = GraphQlData | GraphQlMultiData;

type GraphQlData = any;

type GraphQlMultiData = object;

interface MetafieldNode {
  id: string,
  key: string,
  value: string | number
}

interface GraphQlProduct {
  id: string,
  title: string,
  tags: Array<string>,
  metafields?: {
    edges: Array<MetafieldNode>
  }
  totalUnits?: null | {
    value: string | number
  }
}

interface GraphQlProductVariant {
  id: string,
  sku: string,
  shippingItems?: null | {
    value: string
  },
  numBoxes?: null | {
    value: string | number
  }
  product: GraphQlProduct
}

interface GraphQlProductVariantRate {
  id: string,
  rate: null | {
    value?: string
  }
}

export type ShippingItem = Omit<CarrierService.ShippingItem, 'packagingType'>;


export class Product {
  // identifiers
  public readonly productId: number;
  public readonly variantId: number;
  public readonly sku: string;

  // metadata
  public readonly totalUnits?: number;
  public readonly numBoxes?: number;
  public readonly shippingItems?: Array<ShippingItem>;
  public readonly tags: Array<string>;

  // Lot type
  public readonly isBoxLot: boolean;
  public readonly isPallet: boolean;
  public readonly isTruckload: boolean;
  
  public constructor(gqlProductVariant: GraphQlProductVariant);
  
  public shipsByFreight(): boolean;

  public isTagged( s: string ): boolean;

}

export as namespace Shopify;