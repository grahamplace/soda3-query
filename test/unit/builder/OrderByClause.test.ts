import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../../../src/builder/QueryBuilder';

describe('OrderByClause', () => {
  describe('Single column ordering', () => {
    it('orders by single column with default ASC', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });

    it('orders by single column with explicit ASC', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name', 'asc');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });

    it('orders by single column with DESC', () => {
      const builder = new QueryBuilder();
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('age DESC');
    });
  });

  describe('Multiple column ordering', () => {
    it('orders by multiple columns', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name');
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('name ASC,age DESC');
    });

    it('orders by three columns', () => {
      const builder = new QueryBuilder();
      builder.orderBy('category');
      builder.orderBy('name');
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('category ASC,name ASC,age DESC');
    });
  });

  describe('Direction validation', () => {
    it("accepts lowercase 'asc'", () => {
      const builder = new QueryBuilder();
      builder.orderBy('name', 'asc');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });

    it("accepts uppercase 'ASC'", () => {
      const builder = new QueryBuilder();
      builder.orderBy('name', 'ASC');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });

    it("accepts lowercase 'desc'", () => {
      const builder = new QueryBuilder();
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('age DESC');
    });

    it("accepts uppercase 'DESC'", () => {
      const builder = new QueryBuilder();
      builder.orderBy('age', 'DESC');
      const query = builder.build();
      expect(query.$order).toBe('age DESC');
    });

    it('defaults to ASC when direction is not provided', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });
  });
});
