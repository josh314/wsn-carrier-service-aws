import type {
  RateRequestBody,
  RateResponse,
  RateRequest,
} from '@types';

import { computeRates } from '../../lib/rates';
import { sendErrorNotification } from '../../lib/notify';

/******************************************
 * Helpers
 *
 * ******************************/

function isProduction(): boolean {
  return process.env.NODE_ENV && process.env.NODE_ENV.match('prod') ? true : false;
}


/******************************************
 * Handler
 *
 * ******************************/

export const handler = async (event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.APIGatewayEventRequestContext): Promise<AWSLambda.APIGatewayProxyResult> => {
  let rateRequestBody: RateRequestBody | undefined;
  try{
    if(process.env.DEBUG) {
      console.log('event:');
      console.log(JSON.stringify(event,null,2));
    }
    let resp: RateResponse | undefined;
    if (event.httpMethod.toUpperCase() === 'POST' && event.body) {
      rateRequestBody = JSON.parse(event.body) as RateRequestBody; // just believe me
      resp = await getRate(rateRequestBody.rate);
    }
    else if (event.httpMethod.toUpperCase() === 'GET') {
      resp = await getSampleRate();
    }

    if(!resp) {
      throw new Error('Invalid request.');
    }

    return {
      statusCode: 200,
      body: JSON.stringify(resp),
    };
  }
  catch (e) {
    console.error(new Date());
    console.error(e);

    let message: string;
    let error: Error;
    if( e instanceof Error ) {
      message = e.message;
      error = e;
    }
    else {
      message = 'Unknown error occurred.';
      error = new Error(message);
    }

    if( isProduction() ) {
      await sendErrorNotification(
        error,
        event,
        context,
        rateRequestBody
      );
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: true, message }),
    };

  }
};


const getSampleRate = () =>  Promise.resolve({
  rates: [
    {
      service_name: 'Fast, Convenient Shipping',
      description: 'Includes tracking. Sample response',
      service_code: 'wholesaleninjas_shipping',
      currency: 'USD',
      total_price: '10.00',
    }
  ]
});


async function getRate(rateReq: RateRequest): Promise<RateResponse> {

  const computeRateOpts = {
    destination: rateReq.destination,
    orderItems: rateReq.items
  };

  const resp: RateResponse = {
    rates: await computeRates( computeRateOpts )
  };

  return resp;
}