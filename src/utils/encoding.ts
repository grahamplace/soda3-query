/**
 * Escapes single quotes in SQL string values
 */
export function escapeString(value: string): string {
  return value.replace(/'/g, "''");
}

/**
 * Formats a value for use in SoQL queries
 */
export function formatValue(value: unknown): string {
  if (value === null) {
    return 'NULL';
  }

  if (typeof value === 'boolean') {
    return value.toString();
  }

  if (typeof value === 'number') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '()';
    }
    // Check if array contains numbers or strings
    const formatted = value.map((v) => {
      if (typeof v === 'number') {
        return v.toString();
      }
      return `'${escapeString(String(v))}'`;
    });
    return `(${formatted.join(',')})`;
  }

  // String value
  return `'${escapeString(String(value))}'`;
}

/**
 * Formats a WHERE condition value based on operator
 */
export function formatWhereValue(operator: string, value: unknown): string {
  if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
    return '';
  }

  if (operator === 'IN') {
    if (!Array.isArray(value)) {
      throw new Error('IN operator requires an array value');
    }
    return formatValue(value);
  }

  return formatValue(value);
}
