import { computeRates } from 'rates';

import { sendErrorNotification } from 'notify';

/****************************************** 
 * Handler
 * 
 * ******************************/

export const handler = async (event: AWSLambda.APIGatewayProxyEvent, context: AWSLambda.APIGatewayEventRequestContext): Promise<AWSLambda.APIGatewayProxyResult> => {
  let rateRequestBody: CarrierService.RateRequestBody | undefined;
  try{
    if(process.env.DEBUG) {
      console.log('event:');
      console.log(JSON.stringify(event,null,2));
    }
    let resp: CarrierService.RateResponse | undefined;
    if (event.httpMethod.toUpperCase() === 'POST' && event.body) {
      rateRequestBody = JSON.parse(event.body);
      resp = await getRate(rateRequestBody!.rate);
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
    if( process.env.NODE_ENV === 'production' ) {
      sendErrorNotification(
        e,
        event,
        context,
        rateRequestBody
      );
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ error: true, message: e.message }),
    };
  }
};


const getSampleRate = async () =>  ({
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


async function getRate(rateReq: CarrierService.RateRequest): Promise<CarrierService.RateResponse> {

  const computeRateOpts: CarrierService.ComputeRateOptions = {
    destination: rateReq.destination,
    orderItems: rateReq.items
  };

  const resp: CarrierService.RateResponse = {
    rates: await computeRates(computeRateOpts)
  };

  return resp;
}