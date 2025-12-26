import { describe, it, expect } from 'vitest';

import { QueryBuilder } from '../../../src/builder/QueryBuilder';

describe('HavingClause', () => {
  describe('Post-aggregation filtering', () => {
    it('adds basic having condition', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 10);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 10');
    });

    it('adds having condition with equality', () => {
      const builder = new QueryBuilder();
      builder.having('sum(amount)', '=', 1000);
      const query = builder.build();
      expect(query.$having).toBe('sum(amount) = 1000');
    });

    it('combines multiple having conditions with AND', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 10);
      builder.andHaving('sum(amount)', '>', 1000);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 10 AND sum(amount) > 1000');
    });

    it('combines multiple having conditions with OR', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 10);
      builder.orHaving('avg(price)', '>', 100);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 10 OR avg(price) > 100');
    });
  });

  describe('Aggregate functions in HAVING', () => {
    it('supports COUNT in having', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 5);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 5');
    });

    it('supports SUM in having', () => {
      const builder = new QueryBuilder();
      builder.having('sum(amount)', '>', 1000);
      const query = builder.build();
      expect(query.$having).toBe('sum(amount) > 1000');
    });

    it('supports AVG in having', () => {
      const builder = new QueryBuilder();
      builder.having('avg(price)', '>', 50);
      const query = builder.build();
      expect(query.$having).toBe('avg(price) > 50');
    });

    it('supports MIN in having', () => {
      const builder = new QueryBuilder();
      builder.having('min(price)', '>', 10);
      const query = builder.build();
      expect(query.$having).toBe('min(price) > 10');
    });

    it('supports MAX in having', () => {
      const builder = new QueryBuilder();
      builder.having('max(price)', '<', 1000);
      const query = builder.build();
      expect(query.$having).toBe('max(price) < 1000');
    });

    it('supports complex aggregate expressions', () => {
      const builder = new QueryBuilder();
      builder.having('sum(amount) / count(*)', '>', 100);
      const query = builder.build();
      expect(query.$having).toBe('sum(amount) / count(*) > 100');
    });
  });
});
