import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';

import settings from '../settings';
import { isEnv } from '@types'

function isProduction() : boolean {
  if( process.env.NODE_ENV && process.env.NODE_ENV.match('prod') ) {
    return true
  }
  return false;
}

interface WsnCarrierServiceStackProps extends cdk.StackProps {
}

export class WsnCarrierServiceStack extends cdk.Stack {

  constructor( scope: Construct, id: string, props?: WsnCarrierServiceStackProps ) {
    super( scope, id, props );
    this.configureLambdaFunction();
  }

  configureLambdaFunction() {
    const fnName = 'WsnCarrierServiceLambda';

    const bundlingOpts: cdk.aws_lambda_nodejs.BundlingOptions = {
      minify: isProduction(),
      commandHooks: {
        beforeBundling() {
          return [];
        },
        afterBundling( _inputDir: string, outputDir: string ): string[] { // makes a local copy of the output bundle for testing purposes
          return [
            `mkdir -p dist`,
            `cp -r ${outputDir}/* dist/`,
          ];
        },
        beforeInstall() {
          return [];
        },
      },
      sourceMap: !isProduction(),
      ...( !isProduction() ? { sourceMapMode: cdk.aws_lambda_nodejs.SourceMapMode.BOTH } : {} ),
    };

    // defaults to dev if NODE_ENV is not set
    const rawEnv = process.env.NODE_ENV || 'dev';
    const env = isEnv( rawEnv ) ? rawEnv : 'dev';

    const environment = {
      DEBUG: process.env.DEBUG ?? '',
      NODE_ENV: env,
      ...settings[ env ]
    };

    const fnProperties: cdk.aws_lambda_nodejs.NodejsFunctionProps = {
      functionName: fnName,
      description: `Wholesale Ninjas Shopify Carrier Service Lambda Function`,
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: `src/functions/get-rate/index.ts`,
      handler: 'handler',
      environment,
      bundling: bundlingOpts,
    };

    const fn = new lambdaNodejs.NodejsFunction( this, fnName, fnProperties );

    return fn;

  }

}