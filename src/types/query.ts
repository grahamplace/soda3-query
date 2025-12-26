/**
 * SoQL query parameters as used in SODA v3 API
 */
export interface SoQLQueryParams {
  $select?: string;
  $where?: string;
  $order?: string;
  $group?: string;
  $having?: string;
  $limit?: number;
  $offset?: number;
}

/**
 * Supported comparison operators for WHERE clauses
 */
export type ComparisonOperator =
  | "="
  | "!="
  | "<"
  | ">"
  | "<="
  | ">="
  | "LIKE"
  | "IN"
  | "IS NULL"
  | "IS NOT NULL";

/**
 * Order direction for ORDER BY clauses
 */
export type OrderDirection = "asc" | "desc" | "ASC" | "DESC";

/**
 * Value types that can be used in WHERE clauses
 */
export type WhereValue = string | number | boolean | null | string[] | number[];

