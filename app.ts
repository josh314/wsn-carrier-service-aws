import * as cdk from 'aws-cdk-lib';
import { WsnCarrierServiceStack } from './lib/wsn-carrier-service-stack';

import { isEnv } from './types';

const rawNodeEnv = process.env.NODE_ENV;
const nodeEnv = isEnv( rawNodeEnv ) ? rawNodeEnv : 'dev';

if( nodeEnv === 'local' ) {
  console.error('Cannot deploy stack locally. Please set NODE_ENV to "dev" or "prod".');
  process.exit(1);
}

import settings from './settings';

const app = new cdk.App();
new WsnCarrierServiceStack(app, 'WsnCarrierServiceStack', {

  description: 'Demo deployment for a Lambda written in Typescript',

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

  stackEnv: nodeEnv,
  envSettings: settings[ nodeEnv ],

});
