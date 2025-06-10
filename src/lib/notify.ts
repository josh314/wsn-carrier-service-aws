declare const __APP__: string;

import sendgrid = require('@sendgrid/mail');

export function sendErrorNotification(
  error: NodeJS.ErrnoException,
  event: AWSLambda.APIGatewayProxyEvent,
  context: AWSLambda.APIGatewayEventRequestContext,
  rateRequestBody?: CarrierService.RateRequestBody
): Promise<any> {
  sendgrid.setApiKey(process.env.SENDGRID_API_KEY!);

  const msg = {
    to: 'josh314@gmail.com',
    from: 'josh314@gmail.com',
    subject: `Error in application: ${__APP__}`,
    html: `
      <dl>
        ${error.code ? `<dt>Code</dt><dd>${error.code}</dd>` : ''}
        ${error.errno ? `<dt>Err No</dt><dd>${error.errno}</dd>` : ''}
        ${error.message ? `<dt>Message</dt><dd>${error.message}</dd>` : ''}
        ${error.name ? `<dt>Name</dt><dd>${error.name}</dd>` : '' } 
        ${error.path ? `<dt>Path</dt><dd>${error.path}</dd>` : ''}
        ${error.stack ? `<dt>Stack</dt><dd><pre>${error.stack}</pre></dd>` : ''}
        ${error.syscall ? `<dt>Syscall</dt><dd>${error.syscall}</dd>`: ''}
        ${rateRequestBody ? `<dt>Rate Request Body</dt><dd><pre>${JSON.stringify(rateRequestBody, null, 2)}</pre></dd>`: ''}
        ${event ? `<dt>Lambda Event</dt><dd><pre>${JSON.stringify(event, null, 2)}</pre></dd>`: ''}
        ${context ? `<dt>Lambda Context</dt><dd><pre>${JSON.stringify(context, null, 2)}</pre></dd>`: ''}
      </dl>
    `
  };
  return sendgrid.send(msg);
}