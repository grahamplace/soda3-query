import { SodaClient } from '../client/SodaClient';

/**
 * Options for binding QueryBuilder to a client
 */
export interface QueryBuilderClientBinding {
  client: SodaClient;
  resourceId: string;
}
