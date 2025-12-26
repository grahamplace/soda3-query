import { SodaClientOptions, SodaClientState } from './types';
import { SoQLQueryParams } from '../types/query';
import { SodaResponse, ResourceMetadata } from '../types/response';
import { QueryBuilder } from '../builder/QueryBuilder';
import { validateDomain } from '../utils/validation';

/**
 * SODA v3 API client
 */
export class SodaClient {
  private state: SodaClientState;

  constructor(options: SodaClientOptions) {
    validateDomain(options.domain);
    this.state = {
      domain: options.domain,
      appToken: options.appToken,
      timeout: options.timeout,
    };
  }

  /**
   * Create a query builder bound to this client
   */
  query(resourceId: string): QueryBuilder {
    const builder = new QueryBuilder();
    return builder.bind(this, resourceId);
  }

  /**
   * Execute a query against a resource
   */
  async executeQuery<T = unknown>(
    resourceId: string,
    queryParams: SoQLQueryParams,
  ): Promise<SodaResponse<T>> {
    const url = this.buildQueryUrl(resourceId, queryParams);
    const headers = this.buildHeaders();

    const controller = new AbortController();
    if (this.state.timeout) {
      setTimeout(() => controller.abort(), this.state.timeout);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `SODA API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      // SODA API returns array directly, wrap it in { data: [...] } format
      return { data: Array.isArray(data) ? data : [data] } as SodaResponse<T>;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.state.timeout}ms`);
        }
        throw error;
      }
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }

  /**
   * Get metadata for a resource
   */
  async getMetadata(resourceId: string): Promise<ResourceMetadata> {
    const url = this.buildMetadataUrl(resourceId);
    const headers = this.buildHeaders();

    const controller = new AbortController();
    if (this.state.timeout) {
      setTimeout(() => controller.abort(), this.state.timeout);
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `SODA API error: ${response.status} ${response.statusText}. ${JSON.stringify(errorData)}`,
        );
      }

      const data = await response.json();
      return data as ResourceMetadata;
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error(`Request timeout after ${this.state.timeout}ms`);
        }
        throw error;
      }
      throw new Error(`Unknown error: ${String(error)}`);
    }
  }

  /**
   * Build the query URL for a resource with query parameters
   */
  private buildQueryUrl(resourceId: string, queryParams: SoQLQueryParams): string {
    const domain = this.state.domain.replace(/^https?:\/\//, '');
    const baseUrl = `https://${domain}/resource/${resourceId}.json`;

    const params = new URLSearchParams();

    if (queryParams.$select) {
      params.append('$select', queryParams.$select);
    }
    if (queryParams.$where) {
      params.append('$where', queryParams.$where);
    }
    if (queryParams.$order) {
      params.append('$order', queryParams.$order);
    }
    if (queryParams.$group) {
      params.append('$group', queryParams.$group);
    }
    if (queryParams.$having) {
      params.append('$having', queryParams.$having);
    }
    if (queryParams.$limit !== undefined) {
      params.append('$limit', String(queryParams.$limit));
    }
    if (queryParams.$offset !== undefined) {
      params.append('$offset', String(queryParams.$offset));
    }

    const queryString = params.toString();
    return queryString ? `${baseUrl}?${queryString}` : baseUrl;
  }

  /**
   * Build the metadata URL for a resource
   */
  private buildMetadataUrl(resourceId: string): string {
    const domain = this.state.domain.replace(/^https?:\/\//, '');
    return `https://${domain}/api/views/${resourceId}.json`;
  }

  /**
   * Build request headers
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.state.appToken) {
      headers['X-App-Token'] = this.state.appToken;
    }

    return headers;
  }
}
