/**
 * SODA v3 API response structure
 */
export interface SodaResponse<T = unknown> {
  data: T[];
}

/**
 * Resource metadata from SODA API
 */
export interface ResourceMetadata {
  id: string;
  name: string;
  description?: string;
  columns: ColumnMetadata[];
  [key: string]: unknown;
}

/**
 * Column metadata
 */
export interface ColumnMetadata {
  name: string;
  dataTypeName: string;
  description?: string;
  [key: string]: unknown;
}
