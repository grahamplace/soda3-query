import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SodaClient } from '../../src/client/SodaClient';

// Mock fetch type - extends the fetch signature with vitest mock methods
type MockFetch = typeof fetch & ReturnType<typeof vi.fn<typeof fetch>>;

// Mock fetch globally
global.fetch = vi.fn<typeof fetch>() as MockFetch;

describe('Query Execution Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Mock HTTP client tests', () => {
    it('formats query parameters correctly', async () => {
      const mockResponse = [
        { name: 'John', age: 35 },
        { name: 'Jane', age: 32 },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'test-token',
      });

      const result = await client
        .query('resource-id')
        .select(['name', 'age'])
        .where('age', '>', 30)
        .orderBy('age', 'desc')
        .limit(100)
        .offset(0)
        .execute();

      expect(result.data).toHaveLength(2);
      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('https://data.city.gov/resource/resource-id.json');
      expect(call[0]).toContain('%24select=name%2Cage');
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('age');
      expect(call[0]).toContain('%24order');
      expect(call[0]).toContain('%24limit=100');
      expect(call[0]).toContain('%24offset=0');
      expect(call[1]?.method).toBe('GET');
    });

    it('parses response correctly', async () => {
      const mockResponse = [
        { id: 1, name: 'Test 1', value: 100 },
        { id: 2, name: 'Test 2', value: 200 },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      const result = await client.query('resource-id').select('*').execute();

      expect(result).toEqual({ data: mockResponse });
      expect(result.data).toHaveLength(2);
    });

    it('handles error responses', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: 'Invalid query parameter',
          message: 'The $where clause contains invalid syntax',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      await expect(
        client.query('resource-id').where('invalid', '>', 'syntax').execute(),
      ).rejects.toThrow();
    });

    it('handles authentication errors', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: 'Unauthorized',
          message: 'Invalid app token',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'invalid-token',
      });

      await expect(client.query('resource-id').select('*').execute()).rejects.toThrow();
    });

    it('handles rate limiting', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        }),
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      await expect(client.query('resource-id').select('*').execute()).rejects.toThrow();
    });
  });

  describe('Complex query scenarios', () => {
    it('executes query with GROUP BY and HAVING', async () => {
      const mockResponse = [
        { category: 'A', 'count(*)': 15 },
        { category: 'B', 'count(*)': 20 },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      const result = await client
        .query('resource-id')
        .select(['category', 'count(*)'])
        .groupBy('category')
        .having('count(*)', '>', 10)
        .execute();

      expect(result.data).toHaveLength(2);
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24select');
      expect(call[0]).toContain('category');
      expect(call[0]).toContain('%24group=category');
      expect(call[0]).toContain('%24having');
    });

    it('executes query with multiple WHERE conditions', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      await client
        .query('resource-id')
        .select('*')
        .where('age', '>', 30)
        .where('city', '=', 'New York')
        .execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('age');
      expect(call[0]).toContain('city');
      expect(call[0]).toContain('AND');
    });

    it('executes query with IN operator', async () => {
      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      await client
        .query('resource-id')
        .select('*')
        .where('status', 'IN', ['active', 'pending'])
        .execute();

      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('IN');
      expect(call[0]).toContain('active');
      expect(call[0]).toContain('pending');
    });
  });
});
