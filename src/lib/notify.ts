import { SNSClient, PublishCommand, PublishCommandOutput } from '@aws-sdk/client-sns';

import type { RateRequestBody } from '@types';

export function sendErrorNotification(
  error: NodeJS.ErrnoException,
  event: AWSLambda.APIGatewayProxyEvent,
  context: AWSLambda.APIGatewayEventRequestContext,
  rateRequestBody?: RateRequestBody
): Promise<PublishCommandOutput> {

  console.error( `Sending error notification to SNS topic ${ process.env.SNS_TOPIC_ARN }...` );

  const sns = new SNSClient({
    region: process.env.AWS_REGION
  });

  const Message =
    `An error occurred in the Wholesale Ninjas Carrier Service Lambda function.`+
    `${error.code ? `\n\nCode\n\t${error.code}` : ''}` +
    `${error.errno ? `\n\nErr No\n\t${error.errno}` : ''}` +
    `${error.message ? `\n\nMessage\n\t${error.message.replace( /\n/g, '\n\t',  )}` : ''}` +
    `${error.name ? `\n\nName\n\t${error.name}` : '' }` +
    `${error.path ? `\n\nPath\n\t${error.path}` : ''}` +
    `${error.stack ? `\n\nStack \n\t${error.stack.replace( /\n/g, '\n\t' )}` : ''}` +
    `${error.syscall ? `\n\nSyscall \n\t${error.syscall}`: ''}` +
    `${rateRequestBody ? `\n\nRate Request Body\n${JSON.stringify(rateRequestBody, null, 2)}`: ''}` +
    `${event ? `\n\nLambda Event \n${JSON.stringify(event, null, 2)}`: ''}` +
    `${context ? `\n\nLambda Context \n${JSON.stringify(context, null, 2)}`: ''}`;

  const cmd = new PublishCommand({
    TopicArn: process.env.SNS_TOPIC_ARN,
    Subject: 'Wholesale Ninjas Carrier Service Error',
    Message,
  });
  return sns.send(cmd);

}