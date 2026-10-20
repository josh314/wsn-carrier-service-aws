# Wholesale Ninjas Shopify Carrier Service - AWS

An updated version of the Wholesale Ninjas Shopify Carrier Service migrated from Netlify to AWS hosting. A carrier service application to supply Shopify with shipping rates based on custom business logic.

## Deployment

Uses a CDK app to deploy the stack to AWS. The environment variables in use by the deployment application are:

```shell
DEBUG
NODE_ENV
```

with valid values for `NODE_ENV` being `dev` or `prod` (defaults to `dev` if not set).

Settings for the cloud application (secret environment variables for the lambda function) are stored in the untracked file `settings.ts`. This file should default export an object of type `Settings` (see `types/index.ts` for this type definition).

To deploy to a Shopify store, see the section on the `install.ts` script below.

# `install.ts` script

To deploy the carrier service to a Shopify store, you can use the `install.ts` script. This script has three main functions:
1. list carrier services for a store
2. create a new carrier service
3. delete an existing carrier service

Use the script like this:

```shell
NODE_ENV=<ENV> npx ts-node install.ts <command> <id>
```

where valid `<command>` values are `list`, `create`, or `delete` (defaults to `list`). `<id>` is the carrier-service ID for use with the `delete` command only. `NODE_ENV` is one of the valid environment values of `type Env` (see `types/index.ts`) and defaults to `local` if not set. 

# `ngrok`

To test the carrier service locally, you can use `ngrok` to expose a local dev container (see below) to the internet. You can then create a new carrier service in Shopify that points to the `ngrok` URL. Use ngrok like:

```bash
ngrok http 8888 --domain josh-wsn.ngrok.io
```

assuming that the local dev container is running on port `8888`. The `--domain` flag allows you to specify a custom subdomain for the ngrok URL, which must be configured in the `ngrok` web console if not already set up. There is also an `npm` script to start `ngrok`:

```bash
npm run ngrok
```

# Docker

For local development, we have a Dockerfile and a compose file. The compose file orchestrates the lambda. The purpose of this is just to test the lambda in isolation. To bring up a container, run a command like the following:

```bash
docker compose up 
```

To invoke a containerized lambda, you can use the following command:

```
curl -XPOST "http://localhost:8888/2015-03-31/functions/function/invocations" -d @events/event.json
```

or -- if `ngrok` is active

```
curl -XPOST "https://josh-wsn.ngrok.io/2015-03-31/functions/function/invocations" -d @events/event.json
```
