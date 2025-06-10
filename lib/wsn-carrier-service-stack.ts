import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';


interface WsnCarrierServiceStackProps extends cdk.StackProps {
}

export class WsnCarrierServiceStack extends cdk.Stack {

  constructor( scope: Construct, id: string, props?: WsnCarrierServiceStackProps ) {
    super( scope, id, props );
  }


}