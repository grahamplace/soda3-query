import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../../../src/builder/QueryBuilder';

describe('WhereClause', () => {
  describe('Operator validation', () => {
    it('validates = operator', () => {
      const builder = new QueryBuilder();
      builder.where('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("status = 'active'");
    });

    it('validates != operator', () => {
      const builder = new QueryBuilder();
      builder.where('status', '!=', 'inactive');
      const query = builder.build();
      expect(query.$where).toBe("status != 'inactive'");
    });

    it('validates < operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '<', 18);
      const query = builder.build();
      expect(query.$where).toBe('age < 18');
    });

    it('validates > operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 65);
      const query = builder.build();
      expect(query.$where).toBe('age > 65');
    });

    it('validates <= operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '<=', 18);
      const query = builder.build();
      expect(query.$where).toBe('age <= 18');
    });

    it('validates >= operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>=', 18);
      const query = builder.build();
      expect(query.$where).toBe('age >= 18');
    });

    it('validates LIKE operator', () => {
      const builder = new QueryBuilder();
      builder.where('name', 'LIKE', 'John%');
      const query = builder.build();
      expect(query.$where).toBe("name LIKE 'John%'");
    });

    it('validates IN operator', () => {
      const builder = new QueryBuilder();
      builder.where('status', 'IN', ['active', 'pending']);
      const query = builder.build();
      expect(query.$where).toBe("status IN ('active','pending')");
    });

    it('validates IS NULL', () => {
      const builder = new QueryBuilder();
      builder.where('deleted_at', 'IS NULL', null);
      const query = builder.build();
      expect(query.$where).toBe('deleted_at IS NULL');
    });

    it('validates IS NOT NULL', () => {
      const builder = new QueryBuilder();
      builder.where('email', 'IS NOT NULL', null);
      const query = builder.build();
      expect(query.$where).toBe('email IS NOT NULL');
    });
  });

  describe('Value escaping and encoding', () => {
    it('escapes single quotes in string values', () => {
      const builder = new QueryBuilder();
      builder.where('name', '=', "O'Brien");
      const query = builder.build();
      expect(query.$where).toBe("name = 'O''Brien'");
    });

    it('handles numbers without quotes', () => {
      const builder = new QueryBuilder();
      builder.where('age', '=', 42);
      const query = builder.build();
      expect(query.$where).toBe('age = 42');
    });

    it('handles booleans without quotes', () => {
      const builder = new QueryBuilder();
      builder.where('active', '=', true);
      const query = builder.build();
      expect(query.$where).toBe('active = true');
    });

    it('handles null values', () => {
      const builder = new QueryBuilder();
      builder.where('deleted_at', '=', null);
      const query = builder.build();
      expect(query.$where).toBe('deleted_at IS NULL');
    });

    it('handles arrays for IN operator', () => {
      const builder = new QueryBuilder();
      builder.where('id', 'IN', [1, 2, 3]);
      const query = builder.build();
      expect(query.$where).toBe('id IN (1,2,3)');
    });

    it('handles string arrays for IN operator', () => {
      const builder = new QueryBuilder();
      builder.where('status', 'IN', ['active', 'pending', 'completed']);
      const query = builder.build();
      expect(query.$where).toBe("status IN ('active','pending','completed')");
    });
  });

  describe('Complex conditions', () => {
    it('handles AND combination', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.andWhere('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND status = 'active'");
    });

    it('handles OR combination', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.orWhere('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 OR status = 'active'");
    });

    it('handles multiple AND conditions', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.andWhere('city', '=', 'New York');
      builder.andWhere('active', '=', true);
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND city = 'New York' AND active = true");
    });

    it('handles mixed AND/OR conditions', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.andWhere('city', '=', 'New York');
      builder.orWhere('status', '=', 'vip');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND city = 'New York' OR status = 'vip'");
    });
  });

  describe('Date/time value handling', () => {
    it('handles date strings', () => {
      const builder = new QueryBuilder();
      builder.where('created_at', '>', '2024-01-01');
      const query = builder.build();
      expect(query.$where).toBe("created_at > '2024-01-01'");
    });

    it('handles datetime strings', () => {
      const builder = new QueryBuilder();
      builder.where('created_at', '>', '2024-01-01T00:00:00');
      const query = builder.build();
      expect(query.$where).toBe("created_at > '2024-01-01T00:00:00'");
    });

    it('handles date functions', () => {
      const builder = new QueryBuilder();
      builder.whereRaw('EXTRACT(YEAR FROM created_at) = 2024');
      const query = builder.build();
      expect(query.$where).toBe('EXTRACT(YEAR FROM created_at) = 2024');
    });
  });

  describe('String escaping for LIKE patterns', () => {
    it('handles LIKE with wildcard', () => {
      const builder = new QueryBuilder();
      builder.where('name', 'LIKE', 'John%');
      const query = builder.build();
      expect(query.$where).toBe("name LIKE 'John%'");
    });

    it('handles LIKE with underscore', () => {
      const builder = new QueryBuilder();
      builder.where('name', 'LIKE', 'John_');
      const query = builder.build();
      expect(query.$where).toBe("name LIKE 'John_'");
    });

    it('handles LIKE with escaped single quotes', () => {
      const builder = new QueryBuilder();
      builder.where('name', 'LIKE', "O'%");
      const query = builder.build();
      expect(query.$where).toBe("name LIKE 'O''%'");
    });
  });
});
