/**
 * Options for SodaClient constructor
 */
export interface SodaClientOptions {
  domain: string;
  appToken?: string;
  timeout?: number;
}

/**
 * Internal client state
 */
export interface SodaClientState {
  domain: string;
  appToken?: string;
  timeout?: number;
}
