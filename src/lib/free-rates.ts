import type {
  IRateProvider,
  RateProviderRate,
  ShippingItem,
  Contact,
  PackagingType
} from '@types';

/***********************************************
 * Types
 *
 *******/

interface FreeRateProviderRate extends RateProviderRate {
  provider: 'PROMO'
}

/**********************************************************
 * RateProvider
 *
 **************/

export class FreeRateProvider implements IRateProvider {
  public async getBoxRates( shippingItems: Array<ShippingItem>, _destination: Contact ): Promise< FreeRateProviderRate[] > {

    return this.getRates( 'package', shippingItems );

  }

  public async getPalletRates( palletItems: Array<ShippingItem>, _destination: Contact ): Promise< FreeRateProviderRate[] > {
    return this.getRates( 'pallet', palletItems );
  }

  private async getRates( packagingType: PackagingType, shippingItems: Array<ShippingItem> ): Promise<FreeRateProviderRate[]> {
    const rates: FreeRateProviderRate[] = [];

    if(shippingItems.length > 0) {

      rates.push({
        provider: 'PROMO',
        cost: 0,
        options: {
          isFreight: false //TODO: there should be some logic here instead of just setting false
        },
        packagingType: packagingType,
        numberOfRatedItems: shippingItems.filter( _ => !_.doNotRate ).length // TODO:
      });

    }

    return rates;
  }

  public hasPromotion( shippingItem: ShippingItem ): boolean {

    if( !shippingItem.shopifyProduct ) {

      return false;

    }


    // if( shippingItem.shopifyProduct.isTagged( 'cosmetics' ) || shippingItem.shopifyProduct.isTagged( 'personal care' ) ) {

    //   return true;

    // }

    return false;
  }

}
