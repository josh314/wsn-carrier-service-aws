export interface LambdaEnv {
  SHOPIFY_STORE_NAME: string;
  SHOPIFY_ACCESS_TOKEN: string;
}

export const envs = [ 'prod', 'dev', 'local' ] as const;

export type Env = typeof envs[ number ];

export type EnvSettings = {
  lambdaEnv: LambdaEnv;
  hostedZoneDomain?: string,
  domainName?: string,
}

export type Settings = {
  [K in Env]: EnvSettings;
};

export function isEnv(key: string | undefined ): key is Env {
  if( !key ) {
    return false;
  }
  return ( envs as readonly string[] ).includes( key );
}