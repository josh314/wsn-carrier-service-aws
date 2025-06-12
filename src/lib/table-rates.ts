import type {
  Contact,
  PackagingType,
  ShippingItem,
  IRateProvider,
  RateProviderRate,
  ShopifyProductVariantId,
  ShopifyRateTable,
  ShopifyTableRate
} from '@types';

export interface TableRateProviderRate extends RateProviderRate {
  provider: 'TABLE'
}

/**********************************************************
 * RateProvider
 *
 **************/

export class TableRateProvider implements IRateProvider {

  private table: ShopifyRateTable;

  constructor(rateTable: ShopifyRateTable) {

    this.table = rateTable;

  }

  public getTableRate( productVariantId: ShopifyProductVariantId ): ShopifyTableRate | undefined {

    return this.table.get( productVariantId );

  }

  private async getShippingItemsRatesForPackageType( shippingItems: Array<ShippingItem>, packagingType: PackagingType ): Promise< TableRateProviderRate[] > {
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

  public async getBoxRates( shippingItems: Array<ShippingItem>, _destination: Contact ): Promise< TableRateProviderRate[] > {
    return this.getShippingItemsRatesForPackageType( shippingItems, 'package' );
  }

  public getPalletRates( palletItems: Array<ShippingItem>, _destination: Contact ): Promise< TableRateProviderRate[] > {
    return this.getShippingItemsRatesForPackageType( palletItems, 'pallet' );
  }
}