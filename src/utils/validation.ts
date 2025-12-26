import { ComparisonOperator } from "../types/query";

/**
 * Validates that a comparison operator is supported
 */
export function validateOperator(operator: string): operator is ComparisonOperator {
  const validOperators: ComparisonOperator[] = [
    "=",
    "!=",
    "<",
    ">",
    "<=",
    ">=",
    "LIKE",
    "IN",
    "IS NULL",
    "IS NOT NULL",
  ];
  return validOperators.includes(operator as ComparisonOperator);
}

/**
 * Validates and normalizes order direction
 */
export function normalizeOrderDirection(
  direction?: string
): "ASC" | "DESC" {
  if (!direction) {
    return "ASC";
  }

  const normalized = direction.toLowerCase();
  if (normalized === "asc") {
    return "ASC";
  }
  if (normalized === "desc") {
    return "DESC";
  }

  throw new Error(`Invalid order direction: ${direction}. Must be 'asc' or 'desc'`);
}

/**
 * Validates that domain is provided
 */
export function validateDomain(domain?: string): asserts domain is string {
  if (!domain || typeof domain !== "string" || domain.trim().length === 0) {
    throw new Error("Domain is required for SodaClient");
  }
}

