import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';

import type { Env, EnvSettings, LambdaEnv } from '@types';

const SNS_TOPIC_NAME = 'WsnCarrierServiceFailureTopic';

function isProduction() : boolean {
  if( process.env.NODE_ENV && process.env.NODE_ENV.match('prod') ) {
    return true;
  }
  return false;
}

interface WsnCarrierServiceStackProps extends cdk.StackProps {
  stackEnv: Env;
  envSettings: EnvSettings;
}

export class WsnCarrierServiceStack extends cdk.Stack {

  stackEnv: Env;
  notificationEmails: string[];
  lambdaEnv: LambdaEnv;

  constructor( scope: Construct, id: string, props: WsnCarrierServiceStackProps ) {
    super( scope, id, props );
    const { stackEnv, envSettings } = props;

    this.stackEnv = stackEnv;
    this.notificationEmails = envSettings.notificationEmails;
    this.lambdaEnv = envSettings.lambdaEnv;

    const fn = this.configureLambdaFunction();

    // Configure an SNS topic to publish failure notifications to. Grant the Lambda function permission to publish to it.
    const topic = this.configureNotifications();
    topic.grantPublish( fn );

  }

  topicArn() {
    const stack = cdk.Stack.of(this);
    return `arn:aws:sns:${ stack.region }:${ stack.account }:${ SNS_TOPIC_NAME }`;
  }

  configureNotifications() {

    // Configure topic for failure notifications
    const topic = new sns.Topic( this, 'FailureTopic', {
      displayName: 'Wholesale Ninjas Shopify Carrier Service Failure',
      topicName: 'WsnCarrierServiceFailureTopic',
    } );
    const email = ssm.StringParameter.valueForStringParameter( this, '/notifications/email/admin' );
    topic.addSubscription( new subscriptions.EmailSubscription( email ) );

    return topic;

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

    const environment = {
      ...( process.env.DEBUG ? { DEBUG: process.env.DEBUG } : {} ),
      ...( isProduction() ? {} : { NODE_OPTIONS: '--enable-source-maps' } ),
      NODE_ENV: this.stackEnv,
      SNS_TOPIC_ARN: this.topicArn(),
      ...this.lambdaEnv,
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