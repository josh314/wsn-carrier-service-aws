export interface LambdaEnvironment {
  SHOPIFY_STORE_NAME: string;
  SHOPIFY_ACCESS_TOKEN: string;
}

export interface Settings {
  prod: LambdaEnvironment,
  dev: LambdaEnvironment,
}

export function isEnv(key: string): key is keyof Settings {
  return key === 'prod' || key === 'dev';
}