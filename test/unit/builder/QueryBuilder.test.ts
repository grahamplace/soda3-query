import { describe, it, expect } from 'vitest';
import { QueryBuilder } from '../../../src/builder/QueryBuilder';

describe('QueryBuilder', () => {
  describe('Initialization', () => {
    it('can be instantiated', () => {
      const builder = new QueryBuilder();
      expect(builder).toBeInstanceOf(QueryBuilder);
    });
  });

  describe('Method chaining', () => {
    it('all methods return this for chaining', () => {
      const builder = new QueryBuilder();
      const result1 = builder.select('name');
      const result2 = builder.where('age', '>', 30);
      const result3 = builder.orderBy('name');
      const result4 = builder.limit(10);
      const result5 = builder.offset(5);

      expect(result1).toBe(builder);
      expect(result2).toBe(builder);
      expect(result3).toBe(builder);
      expect(result4).toBe(builder);
      expect(result5).toBe(builder);
    });
  });

  describe('Select clause', () => {
    it('selects a single field', () => {
      const builder = new QueryBuilder();
      builder.select('name');
      const query = builder.build();
      expect(query.$select).toBe('name');
    });

    it('selects multiple fields', () => {
      const builder = new QueryBuilder();
      builder.select(['name', 'age', 'city']);
      const query = builder.build();
      expect(query.$select).toBe('name,age,city');
    });

    it('selects wildcard', () => {
      const builder = new QueryBuilder();
      builder.select('*');
      const query = builder.build();
      expect(query.$select).toBe('*');
    });

    it('replaces previous selection when select is called twice', () => {
      const builder = new QueryBuilder();
      builder.select(['name', 'age']);
      builder.select('city');
      const query = builder.build();
      expect(query.$select).toBe('city');
    });
  });

  describe('Where clause', () => {
    it('adds basic comparison condition', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      const query = builder.build();
      expect(query.$where).toBe('age > 30');
    });

    it('adds equality condition', () => {
      const builder = new QueryBuilder();
      builder.where('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("status = 'active'");
    });

    it('combines multiple where clauses with AND by default', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.where('city', '=', 'New York');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND city = 'New York'");
    });

    it('explicitly adds AND condition', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.andWhere('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND status = 'active'");
    });

    it('adds OR condition', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.orWhere('status', '=', 'active');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 OR status = 'active'");
    });

    it('handles != operator', () => {
      const builder = new QueryBuilder();
      builder.where('status', '!=', 'inactive');
      const query = builder.build();
      expect(query.$where).toBe("status != 'inactive'");
    });

    it('handles < operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '<', 18);
      const query = builder.build();
      expect(query.$where).toBe('age < 18');
    });

    it('handles <= operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '<=', 65);
      const query = builder.build();
      expect(query.$where).toBe('age <= 65');
    });

    it('handles >= operator', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>=', 18);
      const query = builder.build();
      expect(query.$where).toBe('age >= 18');
    });

    it('handles LIKE operator', () => {
      const builder = new QueryBuilder();
      builder.where('name', 'LIKE', 'John%');
      const query = builder.build();
      expect(query.$where).toBe("name LIKE 'John%'");
    });

    it('handles IN operator with array', () => {
      const builder = new QueryBuilder();
      builder.where('status', 'IN', ['active', 'pending']);
      const query = builder.build();
      expect(query.$where).toBe("status IN ('active','pending')");
    });

    it('handles IS NULL', () => {
      const builder = new QueryBuilder();
      builder.where('deleted_at', 'IS NULL', null);
      const query = builder.build();
      expect(query.$where).toBe('deleted_at IS NULL');
    });

    it('handles IS NOT NULL', () => {
      const builder = new QueryBuilder();
      builder.where('email', 'IS NOT NULL', null);
      const query = builder.build();
      expect(query.$where).toBe('email IS NOT NULL');
    });

    it('handles number values', () => {
      const builder = new QueryBuilder();
      builder.where('count', '=', 42);
      const query = builder.build();
      expect(query.$where).toBe('count = 42');
    });

    it('handles boolean values', () => {
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

    it('handles complex AND/OR combinations', () => {
      const builder = new QueryBuilder();
      builder.where('age', '>', 30);
      builder.andWhere('city', '=', 'New York');
      builder.orWhere('status', '=', 'vip');
      const query = builder.build();
      expect(query.$where).toBe("age > 30 AND city = 'New York' OR status = 'vip'");
    });

    it('handles whereRaw for custom conditions', () => {
      const builder = new QueryBuilder();
      builder.whereRaw('EXTRACT(YEAR FROM date_column) = 2024');
      const query = builder.build();
      expect(query.$where).toBe('EXTRACT(YEAR FROM date_column) = 2024');
    });

    it('combines whereRaw with regular where', () => {
      const builder = new QueryBuilder();
      builder.where('status', '=', 'active');
      builder.andWhereRaw('EXTRACT(YEAR FROM created_at) = 2024');
      const query = builder.build();
      expect(query.$where).toBe("status = 'active' AND EXTRACT(YEAR FROM created_at) = 2024");
    });
  });

  describe('OrderBy clause', () => {
    it('orders by single column', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name');
      const query = builder.build();
      expect(query.$order).toBe('name ASC');
    });

    it('orders by column with direction', () => {
      const builder = new QueryBuilder();
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('age DESC');
    });

    it('orders by column with uppercase direction', () => {
      const builder = new QueryBuilder();
      builder.orderBy('age', 'DESC');
      const query = builder.build();
      expect(query.$order).toBe('age DESC');
    });

    it('orders by multiple columns', () => {
      const builder = new QueryBuilder();
      builder.orderBy('name');
      builder.orderBy('age', 'desc');
      const query = builder.build();
      expect(query.$order).toBe('name ASC,age DESC');
    });
  });

  describe('GroupBy clause', () => {
    it('groups by single column', () => {
      const builder = new QueryBuilder();
      builder.groupBy('category');
      const query = builder.build();
      expect(query.$group).toBe('category');
    });

    it('groups by multiple columns', () => {
      const builder = new QueryBuilder();
      builder.groupBy(['category', 'status']);
      const query = builder.build();
      expect(query.$group).toBe('category,status');
    });

    it('groups by single column as string', () => {
      const builder = new QueryBuilder();
      builder.groupBy('category');
      const query = builder.build();
      expect(query.$group).toBe('category');
    });
  });

  describe('Having clause', () => {
    it('adds basic having condition', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 10);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 10');
    });

    it('combines multiple having clauses', () => {
      const builder = new QueryBuilder();
      builder.having('count(*)', '>', 10);
      builder.andHaving('sum(amount)', '>', 1000);
      const query = builder.build();
      expect(query.$having).toBe('count(*) > 10 AND sum(amount) > 1000');
    });
  });

  describe('Limit and Offset', () => {
    it('sets limit', () => {
      const builder = new QueryBuilder();
      builder.limit(100);
      const query = builder.build();
      expect(query.$limit).toBe(100);
    });

    it('sets offset', () => {
      const builder = new QueryBuilder();
      builder.offset(50);
      const query = builder.build();
      expect(query.$offset).toBe(50);
    });

    it('handles zero limit', () => {
      const builder = new QueryBuilder();
      builder.limit(0);
      const query = builder.build();
      expect(query.$limit).toBe(0);
    });

    it('handles zero offset', () => {
      const builder = new QueryBuilder();
      builder.offset(0);
      const query = builder.build();
      expect(query.$offset).toBe(0);
    });

    it('handles large limit values', () => {
      const builder = new QueryBuilder();
      builder.limit(10000);
      const query = builder.build();
      expect(query.$limit).toBe(10000);
    });
  });

  describe('Build method', () => {
    it('returns empty object for empty query', () => {
      const builder = new QueryBuilder();
      const query = builder.build();
      expect(query).toEqual({});
    });

    it('returns properly formatted SoQL parameters for complete query', () => {
      const builder = new QueryBuilder();
      builder
        .select(['name', 'age'])
        .where('age', '>', 30)
        .orderBy('age', 'desc')
        .limit(100)
        .offset(0);
      const query = builder.build();
      expect(query).toEqual({
        $select: 'name,age',
        $where: 'age > 30',
        $order: 'age DESC',
        $limit: 100,
        $offset: 0,
      });
    });

    it('encodes special characters in values', () => {
      const builder = new QueryBuilder();
      builder.where('name', '=', "O'Brien");
      const query = builder.build();
      // SQL escaping: single quotes are doubled
      expect(query.$where).toBe("name = 'O''Brien'");
    });

    it('combines multiple clauses correctly', () => {
      const builder = new QueryBuilder();
      builder
        .select(['name', 'age', 'city'])
        .where('age', '>', 30)
        .where('city', '=', 'New York')
        .groupBy('category')
        .having('count(*)', '>', 10)
        .orderBy('name')
        .orderBy('age', 'desc')
        .limit(50)
        .offset(25);
      const query = builder.build();
      expect(query).toEqual({
        $select: 'name,age,city',
        $where: "age > 30 AND city = 'New York'",
        $group: 'category',
        $having: 'count(*) > 10',
        $order: 'name ASC,age DESC',
        $limit: 50,
        $offset: 25,
      });
    });
  });
});
