

const gid2ShopifyRestId = (gid: string): number => {
  const match = gid.match(/gid:\/\/shopify\/[a-zA-Z]+\/([0-9]+)/);
  if(match) {
    return parseInt(match[1]);
  }
  else {
    throw new Error(`Valid Shopify REST id cannot be created from GraphQl Id ${gid}.`);
  }
};


// Represents all the relevant info from the Shopify product variant and it's parent product
export class Product implements Shopify.Product {
  // identifiers
  public readonly productId: number;
  public readonly variantId: number;
  public readonly sku: string;

  // metadata
  public readonly totalUnits?: number;
  public readonly numBoxes?: number;
  public readonly shippingItems?: Array<Shopify.ShippingItem>;
  public readonly tags: Array<string>;

  // Lot type
  public readonly isBoxLot: boolean;
  public readonly isPallet: boolean;
  public readonly isTruckload: boolean;
  
  public constructor(gqlProductVariant: Shopify.GraphQlProductVariant) {
    this.variantId = gid2ShopifyRestId(gqlProductVariant.id);
    this.productId = gid2ShopifyRestId(gqlProductVariant.product.id);
    this.sku = gqlProductVariant.sku;


    try { //TODO: what about variants like everyday bargains? 
      this.totalUnits = parseInt(gqlProductVariant.product.totalUnits!.value as string);
    }
    catch(e) {
      console.log(`No totalUnits for product variant ${this.variantId}.`);
    }

    try {
      this.numBoxes = parseInt(gqlProductVariant.numBoxes!.value as string);
    }
    catch(e) {
      console.log(`No numBoxes for product variant ${this.variantId}.`);
    }

    try {
      this.shippingItems = JSON.parse(gqlProductVariant.shippingItems!.value);
    }
    catch(e) {
      console.log(`No valid shippingItems JSON for product variant ${this.variantId}.`);
    }


    this.tags = gqlProductVariant.product.tags.map( t => t.toLowerCase());
    if(gqlProductVariant.product.totalUnits) {
      this.totalUnits = parseInt(gqlProductVariant.product.totalUnits.value as string);
    }

    // Use a lenient version of canonical tags below since some of these may be created by hand.
    this.isBoxLot = this.tags.some( t => t.match(/box lots?/i) );
    this.isTruckload = this.tags.some( t => t.match(/truckloads?/i) );
    this.isPallet = this.tags.some( t => t.match(/pallets?/i) );
  }
  
  public shipsByFreight(): boolean {
    if( this.isTruckload ) {
      return true;
    }
    else if ( this.isPallet ) {
      return this.tags.some( (t: string): boolean => !!t.match(/pallets?:(oversized|bulky)/i) );
    }
    else {
      return false;
    }
  }

  public isTagged( s: string ): boolean {
    return this.tags.some( t => t.match( new RegExp( `${s}?`, 'i') ) );
  }

}

