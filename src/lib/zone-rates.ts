
type State = string;
type Zone = number;

// List of lists: each element is the tuple [ *state postal abbreviation*, *rate zone*]
const stateZonesList: Array<[State, Zone]> = [
  [ "AL", 0 ],
  // [ "AK", 2 ],
  [ "AZ", 1 ],
  [ "AR", 1 ],
  [ "CA", 1 ],
  [ "CO", 1 ],
  [ "CT", 0 ],
  [ "DE", 0 ],
  [ "DC", 0 ],
  [ "FL", 0 ],
  [ "GA", 0 ],
  // [ "HI", 0 ],
  [ "ID", 1 ],
  [ "IL", 0 ],
  [ "IN", 0 ],
  [ "IA", 1 ],
  [ "KS", 1 ],
  [ "KY", 0 ],
  [ "LA", 1 ],
  [ "ME", 0 ],
  [ "MD", 0 ],
  [ "MA", 0 ],
  [ "MI", 0 ],
  [ "MN", 1 ],
  [ "MS", 0 ],
  [ "MO", 1 ],
  [ "MT", 1 ],
  [ "NE", 1 ],
  [ "NV", 1 ],
  [ "NH", 0 ],
  [ "NJ", 0 ],
  [ "NM", 1 ],
  [ "NY", 0 ],
  [ "NC", 0 ],
  [ "ND", 1 ],
  [ "OH", 0 ],
  [ "OK", 1 ],
  [ "OR", 1 ],
  [ "PA", 0 ],
  [ "RI", 0 ],
  [ "SC", 0 ],
  [ "SD", 1 ],
  [ "TN", 0 ],
  [ "TX", 1 ],
  [ "UT", 1 ],
  [ "VT", 0 ],
  [ "VA", 0 ],
  [ "WA", 1 ],
  [ "WV", 0 ],
  [ "WI", 0 ],
  [ "WY", 1 ],
];

// stateZones.get( *state postal code* ) returns *rate zone*
const stateZones: Map<State, Zone> = new Map(stateZonesList);

interface ZoneRate {
  boxLot: number,
  palletBreakdown: number,
  palletFreight: {
    base: number,
    per: number
  },
}

export interface ZoneRateOptions extends CarrierService.RateOptions {
  zone: Zone
}

export interface ZoneRateProviderRate extends CarrierService.RateProviderRate {
  provider: 'ZONE',
  options: ZoneRateOptions,
}


/**********************************************************
 * RateProvider
 * 
 **************/

export class ZoneRateProvider implements CarrierService.RateProvider {

  zoneRates: Array<ZoneRate>;

  constructor( palletBreakdownServiceRateValue: number ) {

    this.zoneRates = [
      {
        boxLot: 30,
        palletBreakdown: palletBreakdownServiceRateValue,
        palletFreight: {
          base: 160, 
          per: 80
        }
      },
      {
        boxLot: 30,
        palletBreakdown: palletBreakdownServiceRateValue,
        palletFreight: {
          base: 260,
          per: 100
        }
      },
    ];

  }


  private getBoxRateForState(state: State, numberOfItems: number): ZoneRateProviderRate {

    let zone: Zone | undefined = stateZones.get(state);
    let rate: ZoneRateProviderRate;

    if(typeof zone !== 'undefined') {

      rate = {
        provider: 'ZONE',
        cost: this.zoneRates[zone].boxLot * numberOfItems,
        packagingType: 'package',
        numberOfRatedItems: numberOfItems,
        options: {
          isFreight: false,
          zone: zone
        }
      };

    }
    else {
      throw new Error(`Zone rate not found for state ${state}.`);
    }

    return rate;
  }

  private getPalletBreakdownRate( state: State, palletItem: CarrierService.ShippingItem ): ZoneRateProviderRate {

    let zone: Zone | undefined = stateZones.get( state );
    let rate: ZoneRateProviderRate;

    if(typeof zone !== 'undefined') {

      rate = {
        provider: 'ZONE',
        cost: palletItem.doNotRate ? 0 : this.zoneRates[zone].palletBreakdown ,
        packagingType: 'pallet',
        numberOfRatedItems: palletItem.doNotRate ? 0 : 1,
        options: {
          isFreight: false,
          zone: zone
        }
      };

    }
    else {
      throw new Error(`Zone rate not found for state ${state}.`);
    }

    return rate;
  }

  private getPalletFreightRate(state: State, numberOfItems: number): ZoneRateProviderRate {
    
    let zone: Zone | undefined = stateZones.get(state);
    let rate: ZoneRateProviderRate;

    if(typeof zone !== 'undefined') {

      const zoneRate: ZoneRate = this.zoneRates[zone];

      const cost = ( numberOfItems > 0 ) ? zoneRate.palletFreight.base + numberOfItems * zoneRate.palletFreight.per : 0;

      rate = {
        provider: 'ZONE',
        cost: cost,
        packagingType: 'pallet',
        numberOfRatedItems: numberOfItems,
        options: {
          isFreight: true,
          zone: zone
        }
      };

    }
    else {
      throw new Error(`Zone rate not found for state ${state}.`);
    }

    return rate;
  }

  private combineRates( r1: ZoneRateProviderRate, r2: ZoneRateProviderRate ): ZoneRateProviderRate {

    if( r1.options.zone !== r1.options.zone ) {
      throw new Error(`Cannot combine rates with different zones.`);
    }

    let rate: ZoneRateProviderRate = {
      provider: 'ZONE',
      cost: r1.cost + r2.cost,
      packagingType: 'pallet',
      numberOfRatedItems: r1.numberOfRatedItems + r2.numberOfRatedItems,
      options: {
        isFreight: r1.options.isFreight || r2.options.isFreight,
        zone: r1.options.zone // Note: assuming r1 and r2 are same zone
      }
    };

    return rate;

  }

  public async getBoxRates( shippingItems: Array<CarrierService.ShippingItem>, destination: CarrierService.Contact ): Promise< ZoneRateProviderRate[] > {
    const boxLotRates: ZoneRateProviderRate[] = [];

    if(shippingItems.length > 0) {
      boxLotRates.push( this.getBoxRateForState( destination.province , shippingItems.length ) );
    }

    return boxLotRates;

  }

  public async getPalletRates( palletItems: Array<CarrierService.ShippingItem>, destination: CarrierService.Contact ): Promise< ZoneRateProviderRate[] > {
    const palletRates: ZoneRateProviderRate[] = [];

    const freightItems = palletItems.filter( p => p.shipsByFreight );
    const palletBreakdownItems = palletItems.filter( p => !p.shipsByFreight );
  
    if( freightItems.length > 0 ) {
      palletRates.push( this.getPalletFreightRate( destination.province , freightItems.length ) );
    }

    return palletRates.concat( palletBreakdownItems.map( _item => this.getPalletBreakdownRate( destination.province, _item ) ) );
  }
}
