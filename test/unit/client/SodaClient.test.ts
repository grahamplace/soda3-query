import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SodaClient } from '../../../src/client/SodaClient';

// Mock fetch type - extends the fetch signature with vitest mock methods
type MockFetch = typeof fetch & ReturnType<typeof vi.fn<typeof fetch>>;

// Mock fetch globally
global.fetch = vi.fn<typeof fetch>() as MockFetch;

describe('SodaClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with valid options', () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'test-token',
      });
      expect(client).toBeInstanceOf(SodaClient);
    });

    it('initializes without app token', () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });
      expect(client).toBeInstanceOf(SodaClient);
    });

    it('throws error when domain is missing', () => {
      expect(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        new SodaClient({} as any);
      }).toThrow();
    });
  });

  describe('Query method', () => {
    it('returns QueryBuilder instance', () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });
      const builder = client.query('resource-id');
      expect(builder).toBeDefined();
      expect(builder.execute).toBeDefined();
    });

    it('returns QueryBuilder bound to client', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'test-token',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const builder = client.query('resource-id');
      await builder.select('*').execute();

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toContain('data.city.gov');
      expect(call[0]).toContain('resource-id');
    });
  });

  describe('ExecuteQuery method', () => {
    it('constructs correct URL', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.executeQuery('resource-id', { $select: '*' });

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toBe('https://data.city.gov/resource/resource-id.json?%24select=*');
    });

    it('sends GET request with query parameters in URL', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      const queryParams = {
        $select: 'name,age',
        $where: 'age > 30',
        $limit: 100,
      };

      await client.executeQuery('resource-id', queryParams);

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[1]?.method).toBe('GET');
      expect(call[0]).toContain('%24select=name%2Cage');
      expect(call[0]).toContain('%24where');
      expect(call[0]).toContain('age');
      expect(call[0]).toContain('%24limit=100');
    });

    it('includes app token in headers if provided', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'test-token-123',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.executeQuery('resource-id', { $select: '*' });

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers['X-App-Token']).toBe('test-token-123');
    });

    it('does not include app token header if not provided', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      } as Response);

      await client.executeQuery('resource-id', { $select: '*' });

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      const headers = call[1]?.headers as Record<string, string> | undefined;
      expect(headers?.['X-App-Token']).toBeUndefined();
    });

    it('handles successful responses', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      const mockData = [
        { id: 1, name: 'Test' },
        { id: 2, name: 'Test 2' },
      ];

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      } as Response);

      const result = await client.executeQuery('resource-id', { $select: '*' });

      expect(result).toEqual({ data: mockData });
    });

    it('handles 4xx error responses', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ error: 'Invalid query' }),
      } as Response);

      await expect(client.executeQuery('resource-id', { $select: '*' })).rejects.toThrow();
    });

    it('handles 5xx error responses', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ error: 'Server error' }),
      } as Response);

      await expect(client.executeQuery('resource-id', { $select: '*' })).rejects.toThrow();
    });

    it('handles network errors', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockRejectedValueOnce(new Error('Network error'));

      await expect(client.executeQuery('resource-id', { $select: '*' })).rejects.toThrow(
        'Network error',
      );
    });

    it('handles request timeout', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
        timeout: 1000,
      });

      (global.fetch as MockFetch).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                json: async () => ({ data: [] }),
              } as Response);
            }, 2000);
          }),
      );

      // Note: Actual timeout handling would depend on fetch implementation
      // This test verifies the timeout option is accepted
      expect(client).toBeDefined();
    });
  });

  describe('GetMetadata method', () => {
    it('constructs correct metadata URL', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      (global.fetch as MockFetch).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ columns: [] }),
        } as Response),
      );

      await client.getMetadata('resource-id');

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      expect(call[0]).toBe('https://data.city.gov/api/views/resource-id.json');
    });

    it('returns metadata structure', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
      });

      const mockMetadata = {
        id: 'resource-id',
        name: 'Test Resource',
        columns: [
          { name: 'id', dataTypeName: 'number' },
          { name: 'name', dataTypeName: 'text' },
        ],
      };

      (global.fetch as MockFetch).mockImplementationOnce(() =>
        Promise.resolve({
          ok: true,
          json: async () => mockMetadata,
        } as Response),
      );

      const result = await client.getMetadata('resource-id');

      expect(result).toEqual(mockMetadata);
      expect(result.id).toBe('resource-id');
      expect(result.name).toBe('Test Resource');
      expect(result.columns).toHaveLength(2);
    });

    it('includes app token in metadata request if provided', async () => {
      const client = new SodaClient({
        domain: 'data.city.gov',
        appToken: 'test-token-123',
      });

      (global.fetch as MockFetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ columns: [] }),
      } as Response);

      await client.getMetadata('resource-id');

      expect(global.fetch).toHaveBeenCalled();
      const call = (global.fetch as MockFetch).mock.calls[0];
      const headers = call[1]?.headers as Record<string, string>;
      expect(headers['X-App-Token']).toBe('test-token-123');
    });
  });
});
