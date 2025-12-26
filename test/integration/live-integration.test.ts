import { describe, it, expect, beforeAll } from 'vitest';
import { SodaClient } from '../../src/client/SodaClient';

// Only run these tests if ENABLE_REAL_API_TESTS is set to 'true'
const shouldRunLiveTests = process.env.ENABLE_REAL_API_TESTS === 'true';

describe.skipIf(!shouldRunLiveTests)('Live Integration Tests', () => {
  const SF_DOMAIN = 'data.sfgov.org';
  const RESOURCE_ID = 'vw6y-z8j6'; // 311 Cases dataset
  let client: SodaClient;

  beforeAll(() => {
    client = new SodaClient({
      domain: SF_DOMAIN,
      timeout: 10000, // 10 second timeout
    });
  });

  describe('Basic SELECT query', () => {
    it('should retrieve specific fields from the dataset', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'service_name', 'status_description'])
        .limit(5)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);
      expect(result.data.length).toBeLessThanOrEqual(5);

      // Verify structure of first record
      if (result.data.length > 0) {
        const firstRecord = result.data[0] as Record<string, unknown>;
        expect(firstRecord).toHaveProperty('service_request_id');
        expect(firstRecord).toHaveProperty('service_name');
        expect(firstRecord).toHaveProperty('status_description');
      }
    });

    it('should retrieve all fields with wildcard', async () => {
      const result = await client.query(RESOURCE_ID).select('*').limit(3).execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify first record has multiple fields
      if (result.data.length > 0) {
        const firstRecord = result.data[0] as Record<string, unknown>;
        const fieldCount = Object.keys(firstRecord).length;
        expect(fieldCount).toBeGreaterThan(5); // Should have many fields
      }
    });
  });

  describe('WHERE clause with text equality', () => {
    it('should filter by status_description', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'status_description'])
        .where('status_description', '=', 'Open')
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all returned records have the expected status
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.status_description).toBe('Open');
      });
    });

    it('should filter by service_name', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'service_name'])
        .where('service_name', '=', 'Graffiti Removal')
        .limit(5)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all returned records match the service name
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.service_name).toBe('Graffiti Removal');
      });
    });
  });

  describe('WHERE clause with comparison operators', () => {
    it('should filter by numeric comparison (supervisor_district > 5)', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'supervisor_district'])
        .where('supervisor_district', '>', 5)
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all returned records match the comparison
      // Note: API returns numeric fields as strings, so we parse them
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        const district = rec.supervisor_district;
        if (district !== null && district !== undefined) {
          const districtNum =
            typeof district === 'string' ? parseFloat(district) : (district as number);
          expect(districtNum).toBeGreaterThan(5);
        }
      });
    });

    it('should filter by numeric comparison (supervisor_district <= 3)', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'supervisor_district'])
        .where('supervisor_district', '<=', 3)
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all returned records match the comparison
      // Note: API returns numeric fields as strings, so we parse them
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        const district = rec.supervisor_district;
        if (district !== null && district !== undefined) {
          const districtNum =
            typeof district === 'string' ? parseFloat(district) : (district as number);
          expect(districtNum).toBeLessThanOrEqual(3);
        }
      });
    });
  });

  describe('WHERE clause with IN operator', () => {
    it('should filter by multiple status values', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'status_description'])
        .where('status_description', 'IN', ['Open', 'Closed'])
        .limit(20)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all returned records have one of the specified statuses
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(['Open', 'Closed']).toContain(rec.status_description);
      });
    });
  });

  describe('ORDER BY clause', () => {
    it('should order results by requested_datetime DESC', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'requested_datetime'])
        .orderBy('requested_datetime', 'desc')
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify results are sorted in descending order
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i] as Record<string, unknown>;
          const next = result.data[i + 1] as Record<string, unknown>;
          const currentDate = new Date(current.requested_datetime as string).getTime();
          const nextDate = new Date(next.requested_datetime as string).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });

    it('should order results by service_request_id ASC', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id'])
        .orderBy('service_request_id', 'asc')
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeGreaterThan(0);

      // Verify results are sorted in ascending order
      // Note: API returns numeric fields as strings, so we parse them for comparison
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i] as Record<string, unknown>;
          const next = result.data[i + 1] as Record<string, unknown>;
          const currentId = current.service_request_id;
          const nextId = next.service_request_id;
          const currentIdNum =
            typeof currentId === 'string' ? parseInt(currentId, 10) : (currentId as number);
          const nextIdNum = typeof nextId === 'string' ? parseInt(nextId, 10) : (nextId as number);
          expect(currentIdNum).toBeLessThanOrEqual(nextIdNum);
        }
      }
    });
  });

  describe('LIMIT clause', () => {
    it('should limit results to specified number', async () => {
      const limit = 5;
      const result = await client.query(RESOURCE_ID).select('*').limit(limit).execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(limit);
    });

    it('should handle large limit values', async () => {
      const limit = 100;
      const result = await client.query(RESOURCE_ID).select('*').limit(limit).execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(limit);
    });
  });

  describe('Combined query clauses', () => {
    it('should combine SELECT, WHERE, ORDER BY, and LIMIT', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'service_name', 'status_description', 'requested_datetime'])
        .where('status_description', '=', 'Open')
        .orderBy('requested_datetime', 'desc')
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(10);

      // Verify WHERE clause
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.status_description).toBe('Open');
      });

      // Verify ORDER BY (descending)
      if (result.data.length > 1) {
        for (let i = 0; i < result.data.length - 1; i++) {
          const current = result.data[i] as Record<string, unknown>;
          const next = result.data[i + 1] as Record<string, unknown>;
          const currentDate = new Date(current.requested_datetime as string).getTime();
          const nextDate = new Date(next.requested_datetime as string).getTime();
          expect(currentDate).toBeGreaterThanOrEqual(nextDate);
        }
      }
    });

    it('should combine multiple WHERE conditions with AND', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'status_description', 'supervisor_district'])
        .where('status_description', '=', 'Open')
        .where('supervisor_district', '>', 5)
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify both WHERE conditions
      // Note: API returns numeric fields as strings, so we parse them
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.status_description).toBe('Open');
        const district = rec.supervisor_district;
        if (district !== null && district !== undefined) {
          const districtNum =
            typeof district === 'string' ? parseFloat(district) : (district as number);
          expect(districtNum).toBeGreaterThan(5);
        }
      });
    });
  });

  describe('NULL handling', () => {
    it('should filter by IS NOT NULL', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'closed_date'])
        .where('closed_date', 'IS NOT NULL', null)
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all records have non-null closed_date
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.closed_date).not.toBeNull();
        expect(rec.closed_date).toBeDefined();
      });
    });

    it('should filter by IS NULL', async () => {
      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id', 'closed_date'])
        .where('closed_date', 'IS NULL', null)
        .limit(10)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);

      // Verify all records have null/undefined closed_date
      // Note: API returns null values as undefined (missing property)
      result.data.forEach((record) => {
        const rec = record as Record<string, unknown>;
        expect(rec.closed_date).toBeUndefined();
      });
    });
  });

  describe('Metadata retrieval', () => {
    it('should retrieve dataset metadata', async () => {
      const metadata = await client.getMetadata(RESOURCE_ID);

      expect(metadata).toHaveProperty('columns');
      expect(Array.isArray(metadata.columns)).toBe(true);
      expect(metadata.columns.length).toBeGreaterThan(0);

      // Verify column structure
      if (metadata.columns.length > 0) {
        const firstColumn = metadata.columns[0];
        expect(firstColumn).toHaveProperty('fieldName');
        expect(firstColumn).toHaveProperty('dataTypeName');
      }
    });

    it('should include expected columns in metadata', async () => {
      const metadata = await client.getMetadata(RESOURCE_ID);

      const columnNames = metadata.columns.map((col) => col.fieldName);
      expect(columnNames).toContain('service_request_id');
      expect(columnNames).toContain('service_name');
      expect(columnNames).toContain('status_description');
    });
  });

  describe('Error handling', () => {
    it('should throw error for invalid resource ID', async () => {
      await expect(
        client.query('invalid-resource-id-12345').select('*').limit(1).execute(),
      ).rejects.toThrow();
    });

    it('should handle invalid WHERE clause gracefully', async () => {
      // This might succeed but return empty results, or it might fail
      // We just want to ensure it doesn't crash
      try {
        const result = await client
          .query(RESOURCE_ID)
          .select('*')
          .where('nonexistent_field', '=', 'value')
          .limit(1)
          .execute();

        // If it succeeds, it should return a valid structure
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } catch (error) {
        // If it fails, it should throw a proper error
        expect(error).toBeInstanceOf(Error);
      }
    });

    it('should handle invalid field in SELECT', async () => {
      // This might succeed but return empty/null values, or it might fail
      try {
        const result = await client
          .query(RESOURCE_ID)
          .select(['service_request_id', 'nonexistent_field'])
          .limit(1)
          .execute();

        // If it succeeds, it should return a valid structure
        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
      } catch (error) {
        // If it fails, it should throw a proper error
        expect(error).toBeInstanceOf(Error);
      }
    });
  });

  describe('Pagination', () => {
    it('should handle OFFSET for pagination', async () => {
      const limit = 10;
      const offset = 20;

      const result = await client
        .query(RESOURCE_ID)
        .select(['service_request_id'])
        .orderBy('service_request_id', 'asc')
        .limit(limit)
        .offset(offset)
        .execute();

      expect(result).toHaveProperty('data');
      expect(Array.isArray(result.data)).toBe(true);
      expect(result.data.length).toBeLessThanOrEqual(limit);
    });

    it('should return different results for different offsets', async () => {
      const limit = 5;

      const page1 = await client
        .query(RESOURCE_ID)
        .select(['service_request_id'])
        .orderBy('service_request_id', 'asc')
        .limit(limit)
        .offset(0)
        .execute();

      const page2 = await client
        .query(RESOURCE_ID)
        .select(['service_request_id'])
        .orderBy('service_request_id', 'asc')
        .limit(limit)
        .offset(limit)
        .execute();

      expect(page1.data.length).toBeLessThanOrEqual(limit);
      expect(page2.data.length).toBeLessThanOrEqual(limit);

      // Verify pages are different (assuming enough data exists)
      if (page1.data.length > 0 && page2.data.length > 0) {
        const page1Ids = page1.data.map((r) => (r as Record<string, unknown>).service_request_id);
        const page2Ids = page2.data.map((r) => (r as Record<string, unknown>).service_request_id);

        // All IDs in page2 should be different from page1 (or at least not all the same)
        const allSame = page2Ids.every((id) => page1Ids.includes(id));
        expect(allSame).toBe(false);
      }
    });
  });
});
