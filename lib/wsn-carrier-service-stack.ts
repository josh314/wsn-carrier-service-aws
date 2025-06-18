import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

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
  lambdaEnv: LambdaEnv;
  hostedZoneDomain?: string;
  domainName?: string;
  function: lambdaNodejs.NodejsFunction;
  topic: sns.ITopic;
  api: apigateway.RestApi;

  constructor( scope: Construct, id: string, props: WsnCarrierServiceStackProps ) {
    super( scope, id, props );
    const { stackEnv, envSettings } = props;

    this.stackEnv = stackEnv;
    this.lambdaEnv = envSettings.lambdaEnv;
    this.hostedZoneDomain = envSettings.hostedZoneDomain;
    this.domainName = envSettings.domainName;

    this.function = this.createLambdaFunction();

    // Configure an SNS topic to publish failure notifications to. Grant the Lambda function permission to publish to it.
    this.topic = this.createNotificationTopic();
    this.topic.grantPublish( this.function);

    this.api = this.createAPI();

  }

  topicArn() {
    const stack = cdk.Stack.of(this);
    return `arn:aws:sns:${ stack.region }:${ stack.account }:${ SNS_TOPIC_NAME }`;
  }

  createNotificationTopic() {

    // Configure topic for failure notifications
    const topic = new sns.Topic( this, 'FailureTopic', {
      displayName: 'Wholesale Ninjas Shopify Carrier Service Failure',
      topicName: 'WsnCarrierServiceFailureTopic',
    } );
    const email = ssm.StringParameter.valueForStringParameter( this, '/notifications/email/admin' );
    topic.addSubscription( new subscriptions.EmailSubscription( email ) );

    return topic;

  }

  createLambdaFunction() {
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
      timeout: cdk.Duration.seconds( 60 ),
      environment,
      bundling: bundlingOpts,
    };

    const fn = new lambdaNodejs.NodejsFunction( this, fnName, fnProperties );

    return fn;

  }

  createAPI() {

    let certificate;
    let hostedZone;
    if( this.hostedZoneDomain && this.domainName ) {

      hostedZone = route53.HostedZone.fromLookup( this, 'HostedZone', {
        domainName: this.hostedZoneDomain,
      });

      certificate = new acm.Certificate( this, 'ApiGatewayCertificate', {
        domainName: this.domainName,
        certificateName: 'Wholesale Ninjas Shopify Carrier Service Certificate',
        validation: acm.CertificateValidation.fromDns( hostedZone ),
      });

    }

    const api = new apigateway.LambdaRestApi( this, 'ApiGateway', {
      handler: this.function,
      description: `Wholesale Ninjas Shopify Carrier Service API`,
      restApiName: 'WsnCarrierServiceAPI',
      proxy: true,
      ...(
        this.domainName && certificate ?

          {
            domainName: {
              domainName: this.domainName,
              certificate,
              endpointType: apigateway.EndpointType.EDGE,
            },
          } :

          {}
      ),

    });

    if( hostedZone && this.domainName ) {

      const target = route53.RecordTarget.fromAlias(
        new route53Targets.ApiGateway( api )
      );

      new route53.ARecord(this, 'CustomDomainAliasRecord', {
        zone: hostedZone,
        recordName: this.domainName,
        target,
      });

      new route53.AaaaRecord(this, 'CustomDomainAliasRecordAAAA', {
        zone: hostedZone,
        recordName: this.domainName,
        target,
      });

    }

    return api;

  }

}