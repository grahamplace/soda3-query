import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../../../src/builder/QueryBuilder';

describe('SelectClause', () => {
  describe('Field selection formatting', () => {
    it('formats single field correctly', () => {
      const builder = new QueryBuilder();
      builder.select('name');
      const query = builder.build();
      expect(query.$select).toBe('name');
    });

    it('formats multiple fields correctly', () => {
      const builder = new QueryBuilder();
      builder.select(['name', 'age', 'email']);
      const query = builder.build();
      expect(query.$select).toBe('name,age,email');
    });
  });

  describe('Aggregate function support', () => {
    it('supports COUNT(*)', () => {
      const builder = new QueryBuilder();
      builder.select('count(*)');
      const query = builder.build();
      expect(query.$select).toBe('count(*)');
    });

    it('supports COUNT with field', () => {
      const builder = new QueryBuilder();
      builder.select('count(id)');
      const query = builder.build();
      expect(query.$select).toBe('count(id)');
    });

    it('supports SUM', () => {
      const builder = new QueryBuilder();
      builder.select('sum(amount)');
      const query = builder.build();
      expect(query.$select).toBe('sum(amount)');
    });

    it('supports AVG', () => {
      const builder = new QueryBuilder();
      builder.select('avg(price)');
      const query = builder.build();
      expect(query.$select).toBe('avg(price)');
    });

    it('supports MIN', () => {
      const builder = new QueryBuilder();
      builder.select('min(price)');
      const query = builder.build();
      expect(query.$select).toBe('min(price)');
    });

    it('supports MAX', () => {
      const builder = new QueryBuilder();
      builder.select('max(price)');
      const query = builder.build();
      expect(query.$select).toBe('max(price)');
    });

    it('supports multiple aggregate functions', () => {
      const builder = new QueryBuilder();
      builder.select(['count(*)', 'sum(amount)', 'avg(price)']);
      const query = builder.build();
      expect(query.$select).toBe('count(*),sum(amount),avg(price)');
    });

    it('supports mixing aggregates with regular fields', () => {
      const builder = new QueryBuilder();
      builder.select(['name', 'count(*)', 'sum(amount)']);
      const query = builder.build();
      expect(query.$select).toBe('name,count(*),sum(amount)');
    });
  });

  describe('Aliases', () => {
    it('supports field aliases', () => {
      const builder = new QueryBuilder();
      builder.select('name as full_name');
      const query = builder.build();
      expect(query.$select).toBe('name as full_name');
    });

    it('supports aggregate function aliases', () => {
      const builder = new QueryBuilder();
      builder.select('count(*) as total');
      const query = builder.build();
      expect(query.$select).toBe('count(*) as total');
    });

    it('supports multiple aliased fields', () => {
      const builder = new QueryBuilder();
      builder.select(['name as full_name', 'age as years_old']);
      const query = builder.build();
      expect(query.$select).toBe('name as full_name,age as years_old');
    });
  });

  describe('Edge cases', () => {
    it('handles empty array by not setting select', () => {
      const builder = new QueryBuilder();
      builder.select([]);
      const query = builder.build();
      expect(query.$select).toBeUndefined();
    });

    it('handles field names with special characters', () => {
      const builder = new QueryBuilder();
      builder.select('field_name');
      const query = builder.build();
      expect(query.$select).toBe('field_name');
    });

    it('handles field names with spaces when quoted', () => {
      const builder = new QueryBuilder();
      builder.select('"field name"');
      const query = builder.build();
      expect(query.$select).toBe('"field name"');
    });
  });
});
