import type { RateRequestBody } from '@types';

export function sendErrorNotification(
  error: NodeJS.ErrnoException,
  event: AWSLambda.APIGatewayProxyEvent,
  context: AWSLambda.APIGatewayEventRequestContext,
  rateRequestBody?: RateRequestBody
): Promise<any> {
  return Promise.resolve( null );
}