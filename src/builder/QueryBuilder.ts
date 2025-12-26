import { SoQLQueryParams, ComparisonOperator, OrderDirection, WhereValue } from '../types/query';
import { SodaResponse } from '../types/response';
import { SodaClient } from '../client/SodaClient';
import { formatWhereValue } from '../utils/encoding';
import { validateOperator, normalizeOrderDirection } from '../utils/validation';

/**
 * Internal state for WHERE conditions
 */
interface WhereCondition {
  column: string;
  operator: ComparisonOperator;
  value: WhereValue;
  logicalOperator: 'AND' | 'OR';
  isRaw?: boolean;
  rawCondition?: string;
}

/**
 * Internal state for ORDER BY conditions
 */
interface OrderByCondition {
  column: string;
  direction: 'ASC' | 'DESC';
}

/**
 * Internal state for HAVING conditions
 */
interface HavingCondition {
  column: string;
  operator: ComparisonOperator;
  value: WhereValue;
  logicalOperator: 'AND' | 'OR';
}

/**
 * QueryBuilder for constructing SoQL queries
 */
export class QueryBuilder {
  private selectFields: string[] | null = null;
  private whereConditions: WhereCondition[] = [];
  private orderByConditions: OrderByCondition[] = [];
  private groupByFields: string[] | null = null;
  private havingConditions: HavingCondition[] = [];
  private limitValue: number | null = null;
  private offsetValue: number | null = null;
  private clientBinding: { client: SodaClient; resourceId: string } | null = null;

  /**
   * Bind this builder to a client and resource ID for execution
   */
  bind(client: SodaClient, resourceId: string): this {
    this.clientBinding = { client, resourceId };
    return this;
  }

  /**
   * Select fields to retrieve
   */
  select(fields: string | string[]): this {
    if (Array.isArray(fields)) {
      this.selectFields = fields.length > 0 ? fields : null;
    } else {
      this.selectFields = [fields];
    }
    return this;
  }

  /**
   * Add a WHERE condition (defaults to AND)
   */
  where(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    // Convert = null to IS NULL
    let finalOperator = operator as ComparisonOperator;
    if (operator === '=' && value === null) {
      finalOperator = 'IS NULL';
    } else if (operator === '!=' && value === null) {
      finalOperator = 'IS NOT NULL';
    }

    this.whereConditions.push({
      column,
      operator: finalOperator,
      value,
      logicalOperator: 'AND',
    });
    return this;
  }

  /**
   * Add a raw WHERE condition
   */
  whereRaw(condition: string): this {
    this.whereConditions.push({
      column: '',
      operator: '=',
      value: null,
      logicalOperator: this.whereConditions.length > 0 ? 'AND' : 'AND',
      isRaw: true,
      rawCondition: condition,
    });
    return this;
  }

  /**
   * Add an AND WHERE condition
   */
  andWhere(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.whereConditions.push({
      column,
      operator: operator as ComparisonOperator,
      value,
      logicalOperator: 'AND',
    });
    return this;
  }

  /**
   * Add an AND WHERE condition with raw SQL
   */
  andWhereRaw(condition: string): this {
    this.whereConditions.push({
      column: '',
      operator: '=',
      value: null,
      logicalOperator: 'AND',
      isRaw: true,
      rawCondition: condition,
    });
    return this;
  }

  /**
   * Add an OR WHERE condition
   */
  orWhere(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.whereConditions.push({
      column,
      operator: operator as ComparisonOperator,
      value,
      logicalOperator: 'OR',
    });
    return this;
  }

  /**
   * Add an OR WHERE condition with raw SQL
   */
  orWhereRaw(condition: string): this {
    this.whereConditions.push({
      column: '',
      operator: '=',
      value: null,
      logicalOperator: 'OR',
      isRaw: true,
      rawCondition: condition,
    });
    return this;
  }

  /**
   * Add an ORDER BY clause
   */
  orderBy(column: string, direction?: OrderDirection): this {
    const normalizedDirection = normalizeOrderDirection(direction);
    this.orderByConditions.push({
      column,
      direction: normalizedDirection,
    });
    return this;
  }

  /**
   * Add a GROUP BY clause
   */
  groupBy(columns: string | string[]): this {
    if (Array.isArray(columns)) {
      this.groupByFields = columns.length > 0 ? columns : null;
    } else {
      this.groupByFields = [columns];
    }
    return this;
  }

  /**
   * Add a HAVING condition
   */
  having(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.havingConditions.push({
      column,
      operator: operator as ComparisonOperator,
      value,
      logicalOperator: 'AND',
    });
    return this;
  }

  /**
   * Add an AND HAVING condition
   */
  andHaving(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.havingConditions.push({
      column,
      operator: operator as ComparisonOperator,
      value,
      logicalOperator: 'AND',
    });
    return this;
  }

  /**
   * Add an OR HAVING condition
   */
  orHaving(column: string, operator: string, value: WhereValue): this {
    if (!validateOperator(operator)) {
      throw new Error(`Invalid operator: ${operator}`);
    }

    this.havingConditions.push({
      column,
      operator: operator as ComparisonOperator,
      value,
      logicalOperator: 'OR',
    });
    return this;
  }

  /**
   * Set the LIMIT
   */
  limit(count: number): this {
    this.limitValue = count;
    return this;
  }

  /**
   * Set the OFFSET
   */
  offset(count: number): this {
    this.offsetValue = count;
    return this;
  }

  /**
   * Build the WHERE clause string
   */
  private buildWhereClause(): string | undefined {
    if (this.whereConditions.length === 0) {
      return undefined;
    }

    const parts: string[] = [];

    for (let i = 0; i < this.whereConditions.length; i++) {
      const condition = this.whereConditions[i];

      if (i > 0) {
        parts.push(condition.logicalOperator);
      }

      if (condition.isRaw && condition.rawCondition) {
        parts.push(condition.rawCondition);
      } else {
        const { column, operator, value } = condition;
        let conditionStr = `${column} ${operator}`;

        if (operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
          const formattedValue = formatWhereValue(operator, value);
          conditionStr += ` ${formattedValue}`;
        }

        parts.push(conditionStr);
      }
    }

    return parts.join(' ');
  }

  /**
   * Build the ORDER BY clause string
   */
  private buildOrderByClause(): string | undefined {
    if (this.orderByConditions.length === 0) {
      return undefined;
    }

    return this.orderByConditions.map((cond) => `${cond.column} ${cond.direction}`).join(',');
  }

  /**
   * Build the GROUP BY clause string
   */
  private buildGroupByClause(): string | undefined {
    if (!this.groupByFields || this.groupByFields.length === 0) {
      return undefined;
    }

    return this.groupByFields.join(',');
  }

  /**
   * Build the HAVING clause string
   */
  private buildHavingClause(): string | undefined {
    if (this.havingConditions.length === 0) {
      return undefined;
    }

    const parts: string[] = [];

    for (let i = 0; i < this.havingConditions.length; i++) {
      const condition = this.havingConditions[i];

      if (i > 0) {
        parts.push(condition.logicalOperator);
      }

      const { column, operator, value } = condition;
      let conditionStr = `${column} ${operator}`;

      if (operator !== 'IS NULL' && operator !== 'IS NOT NULL') {
        const formattedValue = formatWhereValue(operator, value);
        conditionStr += ` ${formattedValue}`;
      }

      parts.push(conditionStr);
    }

    return parts.join(' ');
  }

  /**
   * Build the SoQL query parameters
   */
  build(): SoQLQueryParams {
    const params: SoQLQueryParams = {};

    if (this.selectFields && this.selectFields.length > 0) {
      params.$select = this.selectFields.join(',');
    }

    const whereClause = this.buildWhereClause();
    if (whereClause) {
      params.$where = whereClause;
    }

    const orderByClause = this.buildOrderByClause();
    if (orderByClause) {
      params.$order = orderByClause;
    }

    const groupByClause = this.buildGroupByClause();
    if (groupByClause) {
      params.$group = groupByClause;
    }

    const havingClause = this.buildHavingClause();
    if (havingClause) {
      params.$having = havingClause;
    }

    if (this.limitValue !== null) {
      params.$limit = this.limitValue;
    }

    if (this.offsetValue !== null) {
      params.$offset = this.offsetValue;
    }

    return params;
  }

  /**
   * Execute the query (requires client binding)
   */
  async execute<T = unknown>(): Promise<SodaResponse<T>> {
    if (!this.clientBinding) {
      throw new Error(
        'QueryBuilder is not bound to a client. Use SodaClient.query() or call bind() first.',
      );
    }

    const queryParams = this.build();
    return this.clientBinding.client.executeQuery<T>(this.clientBinding.resourceId, queryParams);
  }
}
