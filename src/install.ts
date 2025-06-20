import Shopify from 'shopify-api-node';
import settings from '../settings';

import { isEnv } from '../types';

const die = (msg: string) => {
  console.error(msg);
  process.exit(1);
};

const rawNodeEnv = process.env.NODE_ENV;
const nodeEnv = isEnv( rawNodeEnv ) ? rawNodeEnv : 'dev';

const envSettings = settings[ nodeEnv ];
const domainName = envSettings.domainName;

const command = process.argv[2] || 'list';
const id = parseInt( process.argv[3] );

/********************************************************************
 * Initialization of client
 *
 * *******************/

const shopify = new Shopify({
  shopName: envSettings.lambdaEnv.SHOPIFY_STORE_NAME,
  accessToken: envSettings.lambdaEnv.SHOPIFY_ACCESS_TOKEN,
});

let cmd;

if(command==='list') {
  cmd = shopify.carrierService.list();
}
else if (command==='create') {

  const carrierServiceSettings = {
    "name": "wsn_carrier_service_aws",
    "callback_url": `https://${domainName}`,
    "service_discovery": true
  };

  cmd = shopify.carrierService.create(carrierServiceSettings);
}
else if (command==='delete' && id && !isNaN(id)) {
  cmd = shopify.carrierService.delete(id);
}
else {
  die(`Unknown command: ${command}. Valid commands are: list, create, delete <id>`);
}

if(cmd) {
  cmd
    .then(console.log)
    .catch(console.error);
}