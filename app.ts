import * as cdk from 'aws-cdk-lib';
import { WsnCarrierServiceStack } from './lib/wsn-carrier-service-stack';

const app = new cdk.App();
new WsnCarrierServiceStack(app, 'WsnCarrierServiceStack', {

  description: 'Demo deployment for a Lambda written in Typescript',

  env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },

});
