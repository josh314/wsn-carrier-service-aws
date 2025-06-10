import * as rp from 'request-promise';
import { Product } from 'shopify/product';

/*********************************************
 * Types
 * 
 * *******************/
interface ClientAuthOpts {
	readonly store: string,
	readonly accessToken: string,
}

export type ProductVariantId = number | null;

export type TableRate = number | null;

export type RateTable = Map<ProductVariantId, TableRate>;

/*****************************
 * GraphQl request strings
 * 
 ****************************/
const gqlQueries = {

  getProductData: (productVariantGraphQlIds: Array<string>): string => {
    return `
      {${productVariantGraphQlIds.map((gid,idx)=>`
        _${idx}: productVariant(id: "${gid}") {
          id
          sku
          shippingItems: metafield(namespace:"shipping", key:"shippingItems") {
            value
          }
          numBoxes: metafield(namespace:"shipping", key:"numBoxes") {
            value
          }
          product {
            id
            title
            tags
            totalUnits: metafield(namespace:"lot", key:"totalUnits") {
              value
            }
          }          
        }`).join('')}}
    `;
  },

  getRateTable: (): string => {
    return `
      {
        shop {
          metafield(namespace:"wsn_shipping", key:"rate_table") {
            value
          }
        }
      }
    `;
  },

  getProductVariantRates: ( productVariantGraphQlIds: Array<string> ): string => {
    return `
      {${productVariantGraphQlIds.map((gid,idx)=>`
        _${idx}: productVariant(id: "${gid}") {
          id
          rate: metafield(namespace:"wsn_shipping", key:"flat_rate") {
            value
          }
        }`).join('')}}
    `;
  },

  getPalletBreakdownServiceRate: (): string => {
    return `
      {
        shop {
          metafield(namespace:"wsn_shipping", key:"palletBreakdownServiceRate") {
            value
          }
        }
      }
    `;
  },

};

const productVariantId2Gid = (pvid: number | string): string => `${pvid}`.search('gid://shopify/ProductVariant/') < 0 ? `gid://shopify/ProductVariant/${pvid}` : pvid.toString();

const productVariantGid2Id = ( pvid: number | string ): ProductVariantId => {

  if( typeof pvid === 'number' ) {
    return pvid;
  }
  else {
    const p = /gid:\/\/shopify\/ProductVariant\/([0-9]*)/;
    const m = pvid.match(p);
    if( m && m[1] ) {
      return parseInt(m[1]);
    }
  }

  return null;
};

function arrayifyGqlMultiData(gqlMultiData: Shopify.GraphQlMultiData): Array<any> {
  return Object.entries(gqlMultiData).map( x => x[1] ).filter( _ => _ );
}

function graphQlProductVariantRate2RateTableEntry( graphQlProductVariantRateResponse: Shopify.GraphQlProductVariantRate ): [ ProductVariantId, TableRate ] {

  return [
    productVariantGid2Id( graphQlProductVariantRateResponse.id ),
    graphQlProductVariantRateResponse.rate && graphQlProductVariantRateResponse.rate.value ? parseFloat(graphQlProductVariantRateResponse.rate.value) : null
  ];

}

/*****************************************
 * Client
 * 
 *********************************/

export class Client {
  authOpts: ClientAuthOpts;

  constructor(_clientAuthOpts: ClientAuthOpts) {  
    this.authOpts = _clientAuthOpts;
  }

  async request(opts: Shopify.RequestOpts): Promise<any> {

    const req: rp.Options = {
      method: 'POST',
      uri: `https://${this.authOpts.store}.myshopify.com/admin/api/graphql.json`,
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": this.authOpts.accessToken
      },
      body: opts.gqlQuery
    };

    console.log('Requesting product data from Shopify:');
    console.log( JSON.stringify(req, null, 2) );
    const shopifyResp = await rp(req);

    if(process.env.DEBUG) {
      console.log('Shopify Response:');
    }
    let resp: any;
    try {
      resp = JSON.parse(shopifyResp);
      if(process.env.DEBUG) {
        console.log(JSON.stringify(resp, null, 2));
      }
    }
    catch (e) {
      resp = shopifyResp;
      if(process.env.DEBUG) {
        console.log(resp);
      }
    }
    
    return resp;
  }

  async getProductData(productVariantIds: Array<number>): Promise<Array<Product>> {

    const shopifyResp: Shopify.GraphQlResponse = await this.request({
      gqlQuery: gqlQueries.getProductData(productVariantIds.map(productVariantId2Gid)),
    });

    const gqlProductVariants: Array<Shopify.GraphQlProductVariant> = arrayifyGqlMultiData(shopifyResp.data);
    const products: Array<Product> = gqlProductVariants.filter( _ => _ /* filter out null */ ).map( _ => new Product(_) );
    return products;

  }

  async getRateTable(): Promise< RateTable > {
    
    const shopifyResp: Shopify.GraphQlResponse = await this.request({
      gqlQuery: gqlQueries.getRateTable(),
    });

    const data = JSON.parse( shopifyResp.data.shop.metafield.value );

    // convert data into correct form for RateTable
    const rateTable: RateTable = new Map( data.map( (_: { variant_id: number, rate: TableRate }) => [ _.variant_id, _.rate ]) );

    return rateTable;

  }

  async getRateTable2( productVariantIds: Array<number> ): Promise< RateTable > {

    const shopifyResp: Shopify.GraphQlResponse = await this.request({
      gqlQuery: gqlQueries.getProductVariantRates( productVariantIds.map(productVariantId2Gid) ),
    });

    // convert data into correct form for RateTable
    const tableEntries = arrayifyGqlMultiData( shopifyResp.data ).filter( _ => _ && _.id && _.rate /* filter out nulls */ ).map( graphQlProductVariantRate2RateTableEntry );
    const rateTable: RateTable = new Map( tableEntries );

    return rateTable;

  }


  async getPalletBreakdownServiceRateValue() {

    const shopifyResp: Shopify.GraphQlResponse = await this.request({
      gqlQuery: gqlQueries.getPalletBreakdownServiceRate(),
    });

    const rateValue: number = JSON.parse( shopifyResp.data.shop.metafield.value );

    return rateValue;

  }

}
