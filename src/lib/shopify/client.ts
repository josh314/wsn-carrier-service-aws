import type {
  ShopifyRequestOpts,
  ShopifyProductVariantId,
  ShopifyRateTable,
  ShopifyTableRate,
  ShopifyGraphQlProductVariantRate,
  ShopifyGraphQlMultiData
} from '@types';

import axios from 'axios';
import { Product } from './product';

/*********************************************
 * Types
 *
 * *******************/
interface ClientAuthOpts {
	readonly store: string,
	readonly accessToken: string,
}

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

const productVariantGid2Id = ( pvid: number | string ): ShopifyProductVariantId => {

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

function arrayifyGqlMultiData(gqlMultiData: ShopifyGraphQlMultiData): Array<any> {
  return Object.entries(gqlMultiData).map( x => x[1] ).filter( _ => _ );
}

function graphQlProductVariantRate2RateTableEntry( graphQlProductVariantRateResponse: ShopifyGraphQlProductVariantRate ): [ ShopifyProductVariantId, ShopifyTableRate ] {

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

  async request(opts: ShopifyRequestOpts): Promise<any> {

    const req: axios.AxiosRequestConfig = {
      method: 'POST',
      url: `https://${this.authOpts.store}.myshopify.com/admin/api/graphql.json`,
      headers: {
        "Content-Type": "application/graphql",
        "X-Shopify-Access-Token": this.authOpts.accessToken
      },
      data: opts.gqlQuery,
      responseType: 'json'
    };

    console.log('Requesting product data from Shopify:');
    console.log( JSON.stringify(req, null, 2) );

    const resp = await axios(req);

    const payload = resp.data;

    if( process.env.DEBUG ) {
      console.log('Shopify response:');
      console.log( JSON.stringify(payload, null, 2) );
    }

    if( payload.errors ) {
      throw new Error( JSON.stringify( payload.errors, null, 2 ) );
    }

    return payload;
  }

  async getProductData(productVariantIds: Array<number>): Promise<Array<Product>> {

    const shopifyResp = await this.request({
      gqlQuery: gqlQueries.getProductData(productVariantIds.map(productVariantId2Gid)),
    });

    const gqlProductVariants = arrayifyGqlMultiData(shopifyResp.data);
    const products: Array<Product> = gqlProductVariants.filter( _ => _ /* filter out null */ ).map( _ => new Product(_) );
    return products;

  }

  async getRateTable(): Promise< ShopifyRateTable > {

    const shopifyResp = await this.request({
      gqlQuery: gqlQueries.getRateTable(),
    });

    const data = JSON.parse( shopifyResp.data.shop.metafield.value );

    // convert data into correct form for RateTable
    const rateTable: ShopifyRateTable  = new Map( data.map( (_: { variant_id: ShopifyProductVariantId, rate: ShopifyTableRate }) => [ _.variant_id, _.rate ]) );

    return rateTable;

  }

  async getRateTable2( productVariantIds: Array<number> ): Promise< ShopifyRateTable > {

    const shopifyResp = await this.request({
      gqlQuery: gqlQueries.getProductVariantRates( productVariantIds.map(productVariantId2Gid) ),
    });

    // convert data into correct form for RateTable
    const tableEntries = arrayifyGqlMultiData( shopifyResp.data ).filter( _ => _ && _.id && _.rate /* filter out nulls */ ).map( graphQlProductVariantRate2RateTableEntry );
    const rateTable = new Map( tableEntries );

    return rateTable;

  }


  async getPalletBreakdownServiceRateValue() {

    const shopifyResp = await this.request({
      gqlQuery: gqlQueries.getPalletBreakdownServiceRate(),
    });

    const rateValue: number = JSON.parse( shopifyResp.data.shop.metafield.value );

    return rateValue;

  }

}
