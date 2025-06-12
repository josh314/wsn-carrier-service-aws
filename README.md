# Wholesale Ninjas Shopify Carrier Service - AWS

An updated version of the Wholesale Ninjas Shopify Carrier Service (https://gitlab.com/wazue/wsn-carrier-service) , now hosted on AWS. A carrier service application to supply Shopify with shipping rates based on custom business logic.

## Deployment

Uses a CDK app to deploy the stack to AWS. The environment variables in use by the deployment application are:

```shell
DEBUG
NODE_ENV
```

with valid values for `NODE_ENV` being `dev` or `prod` (defaults to `dev` if not set).

Settings for the cloud application (secret environment variables for the lambda function) are stored in the untracked file `settings.ts`. This file should default export an object of type `Settings` (see `types/index.ts` for this type definition).