/* eslint-disable no-unused-vars */
import * as shopify from 'shopify/client';
/* eslint-enable no-unused-vars */

export interface TableRateProviderRate extends CarrierService.RateProviderRate {
  provider: 'TABLE'
}

/**********************************************************
 * RateProvider
 * 
 **************/

export class TableRateProvider implements CarrierService.RateProvider {

  private table: shopify.RateTable;

  constructor(rateTable: shopify.RateTable) {

    this.table = rateTable;
 
  }

  public getTableRate( productVariantId: shopify.ProductVariantId ): shopify.TableRate | undefined {

    return this.table.get( productVariantId );

  }

  private async getShippingItemsRatesForPackageType( shippingItems: Array<CarrierService.ShippingItem>, packagingType: CarrierService.PackagingType ): Promise< TableRateProviderRate[] > {
    const tableRates: TableRateProviderRate[] = [];

    shippingItems.forEach( shippingItem => {

      let tableRateEntry;

      if( shippingItem.shopifyProduct ) {

        tableRateEntry = this.getTableRate( shippingItem.shopifyProduct.variantId );
        
      }

      if( tableRateEntry ) {

        let rate: TableRateProviderRate = {
          provider: 'TABLE',
          cost: 0, // cost is 0 by default
          packagingType,
          numberOfRatedItems: 0, // again, not rated by default
          options: {
            isFreight: false
          }
        };


        if( !shippingItem.doNotRate ) { // Set cost from table if a rate-able item

          rate.cost = tableRateEntry;
          rate.numberOfRatedItems = 1;

        }

        tableRates.push( rate );
      }

    });


    return tableRates;

  }

  public async getBoxRates( shippingItems: Array<CarrierService.ShippingItem>, _destination: CarrierService.Contact ): Promise< TableRateProviderRate[] > {
    return this.getShippingItemsRatesForPackageType( shippingItems, 'package' );
  }

  public getPalletRates( palletItems: Array<CarrierService.ShippingItem>, _destination: CarrierService.Contact ): Promise< TableRateProviderRate[] > {
    return this.getShippingItemsRatesForPackageType( palletItems, 'pallet' );
  }
}