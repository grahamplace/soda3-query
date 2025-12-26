import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SodaClient } from '../../src/client/SodaClient';
import { QueryBuilder } from '../../src/builder/QueryBuilder';

// Mock fetch type - extends the fetch signature with vitest mock methods
type MockFetch = typeof fetch & ReturnType<typeof vi.fn<typeof fetch>>;

// Mock fetch globally
global.fetch = vi.fn<typeof fetch>() as MockFetch;

describe('End-to-End Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Complete query builder + client flow', () => {
    it('executes a complete query with all clauses', async () => {
      const mockData = [
        { id: 1, name: 'Item 1', category: 'A', price: 100 },
        { id: 2, name: 'Item 2', category: 'A', price: 150 },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
        appToken: 'test-token',
      });

      const result = await client
        .query('resource-123')
        .select(['id', 'name', 'category', 'price'])
        .where('price', '>', 50)
        .where('category', '=', 'A')
        .orderBy('price', 'desc')
        .limit(10)
        .offset(0)
        .execute();

      expect(result).toEqual({ data: mockData });
      expect(result.data).toHaveLength(2);
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24select=id%2Cname%2Ccategory%2Cprice');
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('price');
      expect(call[0]).toContain('category');
      expect(call[0]).toContain('%24order');
      expect(call[0]).toContain('%24limit=10');
      expect(call[0]).toContain('%24offset=0');
      expect(call[1]?.method).toBe('GET');
    });

    it('handles standalone query builder', () => {
      const builder = new QueryBuilder();
      const query = builder
        .select(['name', 'age'])
        .where('age', '>', 30)
        .orderBy('name')
        .limit(100)
        .build();

      expect(query).toEqual({
        $select: 'name,age',
        $where: 'age > 30',
        $order: 'name ASC',
        $limit: 100,
      });
    });
  });

  describe('Complex queries with multiple clauses', () => {
    it('executes query with GROUP BY, HAVING, and ORDER BY', async () => {
      const mockResponse = [
        { category: 'A', 'count(*)': 10, 'sum(price)': 1000 },
        { category: 'B', 'count(*)': 8, 'sum(price)': 800 },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      const result = await client
        .query('resource-123')
        .select(['category', 'count(*)', 'sum(price)'])
        .groupBy('category')
        .having('count(*)', '>', 5)
        .orderBy('category')
        .execute();

      expect(result.data).toHaveLength(2);
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24select');
      expect(call[0]).toContain('category');
      expect(call[0]).toContain('%24group=category');
      expect(call[0]).toContain('%24having');
      expect(call[0]).toContain('%24order');
    });

    it('executes query with OR conditions', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await client
        .query('resource-123')
        .select('*')
        .where('status', '=', 'active')
        .orWhere('priority', '=', 'high')
        .execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('OR');
    });

    it('executes query with IS NULL condition', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await client.query('resource-123').select('*').where('deleted_at', 'IS NULL', null).execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('deleted_at');
      expect(call[0]).toContain('IS+NULL');
    });
  });

  describe('Pagination scenarios', () => {
    it('handles pagination with limit and offset', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await client.query('resource-123').select('*').limit(20).offset(40).execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24limit=20');
      expect(call[0]).toContain('%24offset=40');
    });

    it('handles first page (offset 0)', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await client.query('resource-123').select('*').limit(10).offset(0).execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24limit=10');
      expect(call[0]).toContain('%24offset=0');
    });
  });

  describe('Error scenarios', () => {
    it('handles invalid resource ID', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({
          error: 'Not Found',
          message: 'Resource not found',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await expect(client.query('invalid-resource').select('*').execute()).rejects.toThrow();
    });

    it('handles invalid query syntax', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Bad Request',
          message: 'Invalid SoQL syntax',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await expect(
        client.query('resource-123').whereRaw('invalid syntax here').execute(),
      ).rejects.toThrow();
    });

    it('handles server errors gracefully', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({
          error: 'Internal Server Error',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.example.com',
      });

      await expect(client.query('resource-123').select('*').execute()).rejects.toThrow();
    });
  });
});
