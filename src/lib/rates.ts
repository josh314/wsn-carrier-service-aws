import type {
  IRate,
  RateProviderRate,
  ComputeRateOptions,
  ShippingItem,
  OrderItem,
  DressedOrderItem,
  IShopifyProduct
} from '@types';

import * as shopify from './shopify/client';
// import { FreeRateProvider } from 'free-rates'; // Not currently in use
import { ZoneRateProvider } from './zone-rates';
import { TableRateProvider } from './table-rates';

function createEstimatedPalletBreakdownServiceShippingItems(): ShippingItem[] {

  const $_ = [];
  for( let i=0; i<8; i++ ) {

    const _shippingItem: ShippingItem = {
      packagingType: 'pallet',
      shipsByFreight: false,
      weight: 25,
      weightUnits: 'pounds',
      height: 21,
      heightUnits: 'inches',
      length: 21,
      lengthUnits: 'inches',
      width: 21,
      widthUnits: 'inches'
    };

    $_.push( _shippingItem );
  }
  return $_;

}

/*********************************************
 * Types
 *
 * *******************/

class Rate implements IRate {
  public readonly service_name: string;
  public readonly description: string;
  public readonly service_code: string;
  public readonly currency: string;
  public readonly total_price: string;
  public readonly phone_required?: boolean;
  public readonly min_delivery_date?: string;
  public readonly max_delivery_date?: string;

  constructor( rateProviderRates: RateProviderRate[], shippingItems: ShippingItem[] ) {
    this.service_code = 'wholesaleninjas_shipping'; //TODO!
    this.currency = 'USD';

    const anyFreight = rateProviderRates.some( _rpr => _rpr.options.isFreight );

    if( anyFreight ) {
      this.service_name = 'Freight Shipping';
      this.description = `Your order contains at least one item that requires freight shipping. You will be contacted by the carrier to arrange a delivery window. Other items shipped separately via standard ground.`;
    }
    else {
      // If not freight, compute and provide some more data on number and weight of boxes

      const unweighedShippingItems = shippingItems.filter( _ => !_.weight );
      const weighedShippingItems = shippingItems.filter( _ => _.weight );

      // check if any "pallet"-sized shipping items. If this code is run, such items are going to be broken down as the freight option has already been passed
      const palletShippingItems = weighedShippingItems.filter( _ => _.weight >= 2000 );
      const boxShippingItems = weighedShippingItems.filter( _ => _.weight < 2000 );

      // compute an estimate of boxes from a pallet
      const estimatedPalletBreakdownShippingItems =  ([] as ShippingItem[]).concat( ...palletShippingItems.map( createEstimatedPalletBreakdownServiceShippingItems ) );

      const finalEstimatedShippingItems = ([] as ShippingItem[]).concat(
        boxShippingItems,
        estimatedPalletBreakdownShippingItems,
        unweighedShippingItems.map( _ => Object.assign( _, { weight: 40 } ) ), // add an estimated weight, but don't bother with linear dims
      );
      const _totalBoxWeight = finalEstimatedShippingItems.reduce( ( totalBoxWeight, _item ) => totalBoxWeight + _item.weight , 0 );

      const hasPalletBreakdownService = rateProviderRates.some( isPalletBreakdownServiceRate );
      if ( hasPalletBreakdownService ) {
        this.service_name = 'Standard Ground Shipping with Pallet Breakdown Service';
        this.description = 'Any pallet lots in your order will be broken down and re-packed into boxes of manageable size and shipped via standard ground.';
        // this.description = `Approximately ${ finalEstimatedShippingItems.length  } boxes with a total weight of about ${ totalBoxWeight } pounds. Includes Tracking.`;
      }
      else {
        this.service_name = 'Standard Ground Shipping';
        this.description = `Standard ground shipping provided by one of our reliable national carriers.`;
        // this.description = `Rate for ${ finalEstimatedShippingItems.length > 1 ? `${ finalEstimatedShippingItems.length } boxes` : '1 box' } with a ${ finalEstimatedShippingItems.length > 1 ? 'total ' : '' }weight of approximately ${totalBoxWeight} pounds. Includes tracking.`;
      }

    }

    const cost = rateProviderRates.reduce( ( _total, _rpr ) => _total + _rpr.cost, 0 );
    // Convert to cents, round up to nearest cent, and cast as string
    this.total_price = ( Math.ceil( 100*cost ) ).toString();
  }
}

/********************************************************************
 * Initialization of clients & rate-providers
 *
 * *******************/

const shopifyClient = new shopify.Client({
  store: process.env.SHOPIFY_STORE_NAME!,
  accessToken: process.env.SHOPIFY_ACCESS_TOKEN!,
});

// TODO: not currently in use
// const freeRateProvider = new FreeRateProvider();

/**********************************************
 * Functions/Helpers
 *
 * ********************************************/

const attachProductToItem = ( products: Array<IShopifyProduct> ) => {
  return (item: OrderItem): DressedOrderItem => {
    const newItem: DressedOrderItem = Object.assign(
      { shopifyProduct: products.find( p => item.variant_id === p.variantId ) as IShopifyProduct },
      item
    );
    return newItem;
  };
};

const getOrderItemShippingItems = (rateEachShippingItem: boolean ) => ( orderItem: DressedOrderItem ): Array<ShippingItem> => {

  const product: IShopifyProduct = orderItem.shopifyProduct;
  if(!product) {
    throw new Error(`No product found for orderItem: ${JSON.stringify( orderItem )}`);
  }

  const baseShippingItem: ShippingItem = {
    packagingType: product.isTruckload ? 'truckload' : ( product.isPallet ? 'pallet' : 'package' ),
    shipsByFreight: product.shipsByFreight(),
    weight: 0,
    weightUnits: 'pounds',
    height: 0,
    heightUnits: 'inches',
    length: 0,
    lengthUnits: 'inches',
    width: 0,
    widthUnits: 'inches',
    shopifyProduct: product
  };

  let shippingItems: Array<ShippingItem>;
  if( product.shippingItems && product.shippingItems.length > 0 ) {
    shippingItems = [];

    for(let i=0; i<orderItem.quantity; i++) {

      product.shippingItems.forEach( (productShippingItem, idx) => {

        const newCarrierServiceShippingItem: ShippingItem = Object.assign( {} , baseShippingItem, productShippingItem );

        if( !rateEachShippingItem && idx !== 0 ) {
          newCarrierServiceShippingItem.doNotRate = true;
        }

        shippingItems.push(newCarrierServiceShippingItem);

      });

    }

  }
  else {
    const num = product.numBoxes ? product.numBoxes * orderItem.quantity : orderItem.quantity;

    shippingItems = Array( num ).fill( baseShippingItem );
  }

  return shippingItems;
};

const getAllShippingItems = ( dressedOrderItems: Array<DressedOrderItem>, rateEachShippingItem: boolean = true ): Array<ShippingItem> => {
  const orderItemsShippingItems: Array< Array<ShippingItem> > = dressedOrderItems.map( getOrderItemShippingItems(rateEachShippingItem) );

  return orderItemsShippingItems.reduce( ( allShippingItems: Array<ShippingItem> , singleOrderShippingItems: Array<ShippingItem>): Array<ShippingItem> => {
    return allShippingItems.concat(singleOrderShippingItems);
  }, []);
};

const cmpRateProviderRates = ( a: RateProviderRate, b: RateProviderRate ): number => {
  if( a.cost < b.cost) {
    return - 1;
  }
  else if ( a.cost > b.cost ) {
    return 1;
  }
  else {
    return 0;
  }
};

// all non-freight pallets are pallet breakdown service
function isPalletBreakdownServiceRate( rateProviderRate: RateProviderRate ) {

  return rateProviderRate.packagingType === 'pallet' && !rateProviderRate.options.isFreight;

}

/*********************************************
* Main
*
*********/
export async function computeRates(opts: ComputeRateOptions): Promise< Array<Rate> > {
  const productVariantIds: Array<number> = opts.orderItems.map( x => x.variant_id ).filter(x=>x);
  const products: Array<IShopifyProduct> = await shopifyClient.getProductData(productVariantIds);

  if(process.env.DEBUG) {
    console.log('\n');
    console.log('Product data:');
    console.log( JSON.stringify(products, null, 2) );
  }

  const rateTable = await shopifyClient.getRateTable2( productVariantIds );
  const tableRateProvider = new TableRateProvider( rateTable );

  const palletBreakdownServiceRateValue = await shopifyClient.getPalletBreakdownServiceRateValue();
  const zoneRateProvider = new ZoneRateProvider( palletBreakdownServiceRateValue );


  const dressedOrderItems: Array<DressedOrderItem> = opts.orderItems.map(attachProductToItem(products));

  const dressedOrderItemHasValidTableRate = ( dressedOrderItem : DressedOrderItem ) : boolean => {

    if( dressedOrderItem.shopifyProduct && dressedOrderItem.shopifyProduct.variantId ) {

      const tableRate = tableRateProvider.getTableRate( dressedOrderItem.shopifyProduct.variantId );
      return typeof tableRate === 'number';
    }
    else {
      return false;
    }
  };
  const tableRateDressedOrderItems = dressedOrderItems.filter( dressedOrderItemHasValidTableRate );
  const nonTableRateDressedOrderItems = dressedOrderItems.filter( _ => !dressedOrderItemHasValidTableRate(_) );

  const palletZoneRateDressedOrderItems = nonTableRateDressedOrderItems.filter( _ => _.shopifyProduct.isPallet );
  const boxLotZoneRateDressedOrderItems = nonTableRateDressedOrderItems.filter( _ => !_.shopifyProduct.isPallet );

  const tableRateShippingItems: Array<ShippingItem> = getAllShippingItems( tableRateDressedOrderItems, false );

  const palletTableRateShippingItems = tableRateShippingItems.filter( _ => _.packagingType === 'pallet' );
  const boxLotTableRateShippingItems = tableRateShippingItems.filter( _ => _.packagingType === 'package' );
  const palletZoneRateShippingItems: Array<ShippingItem> = getAllShippingItems( palletZoneRateDressedOrderItems, false );
  const boxLotZoneRateShippingItems: Array<ShippingItem> = getAllShippingItems( boxLotZoneRateDressedOrderItems );

  if(process.env.DEBUG) {
    console.log('\n');
    console.log('Box Lot Table Rate Shipping Items:');
    console.log( JSON.stringify(boxLotTableRateShippingItems, null, 2) );

    console.log('Pallet Table Rate Shipping Items:');
    console.log( JSON.stringify(palletTableRateShippingItems, null, 2) );

    console.log('Box Lot Zone Rate Shipping Items:');
    console.log( JSON.stringify(boxLotZoneRateShippingItems, null, 2) );

    console.log('Pallet Zone Rate Shipping Items:');
    console.log( JSON.stringify(palletZoneRateShippingItems, null, 2) );
  }

  // request all Rates simultaneously
  const [
    boxLotTableRates,
    palletTableRates,
    boxLotZoneRates,
    palletZoneRates
  ]: Array<RateProviderRate[]> = await Promise.all([
    tableRateProvider.getBoxRates( boxLotTableRateShippingItems, opts.destination ),
    tableRateProvider.getPalletRates( palletTableRateShippingItems, opts.destination ),
    zoneRateProvider.getBoxRates( boxLotZoneRateShippingItems, opts.destination ),
    zoneRateProvider.getPalletRates( palletZoneRateShippingItems, opts.destination )
  ]);

  //sort rates
  boxLotTableRates.sort(cmpRateProviderRates);
  palletTableRates.sort(cmpRateProviderRates);
  boxLotZoneRates.sort(cmpRateProviderRates);
  palletZoneRates.sort(cmpRateProviderRates);

  console.log('Box Lot Table Rates:');
  console.log( JSON.stringify(boxLotTableRates, null, 2) );

  console.log('Pallet Table Rates:');
  console.log( JSON.stringify(palletTableRates, null, 2) );

  console.log('Box Lot Zone Rates:');
  console.log( JSON.stringify(boxLotZoneRates, null, 2) );

  console.log('Pallet Zone Rates:');
  console.log( JSON.stringify(palletZoneRates, null, 2) );


  const rateProviderRates = ( [] as RateProviderRate[] ).concat(
    boxLotTableRates,
    palletTableRates,
    boxLotZoneRates,
    palletZoneRates
  );

  const totalShippingItems = ( [] as ShippingItem[] ).concat(
    boxLotTableRateShippingItems,
    palletTableRateShippingItems,
    boxLotZoneRateShippingItems,
    palletZoneRateShippingItems
  );

  return [
    new Rate( rateProviderRates, totalShippingItems )
  ];

}
