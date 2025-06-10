declare const __APP__: string;
declare const __VERSION__: string;

export const handler = async (_event: AWSLambda.APIGatewayProxyEvent, _context: AWSLambda.APIGatewayEventRequestContext): Promise<AWSLambda.APIGatewayProxyResult> => ({
  statusCode: 200,
  body: JSON.stringify({
    app: __APP__,
    version: __VERSION__,
    node_version: process.version,
    environment: process.env.NODE_ENV
  }, null, 2)
});
