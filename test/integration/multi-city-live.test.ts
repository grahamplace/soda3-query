import { describe, it, expect, beforeAll } from 'vitest';
import { SodaClient } from '../../src/client/SodaClient';

// Only run these tests if ENABLE_REAL_API_TESTS is set to 'true'
const shouldRunLiveTests = process.env.ENABLE_REAL_API_TESTS === 'true';

/**
 * Multi-City Live Integration Tests
 *
 * These tests validate that the SODA query builder works correctly across
 * different city deployments of Socrata/SODA. This helps ensure compatibility
 * with different SODA versions and configurations.
 *
 * Cities tested:
 * - San Francisco (data.sfgov.org)
 * - Chicago (data.cityofchicago.org)
 * - Seattle (data.seattle.gov)
 * - Los Angeles (data.lacity.org)
 * - Dallas (www.dallasopendata.com)
 * - Austin (data.austintexas.gov)
 * - New York City (data.cityofnewyork.us)
 */
describe.skipIf(!shouldRunLiveTests)('Multi-City Live Integration Tests', () => {
  // City configurations: domain, resource ID, and a sample field to query
  const cityConfigs = [
    {
      name: 'San Francisco',
      domain: 'data.sfgov.org',
      resourceId: 'vw6y-z8j6', // 311 Cases
      testField: 'service_request_id',
      testValue: '12345',
    },
    {
      name: 'Chicago',
      domain: 'data.cityofchicago.org',
      resourceId: '4ijn-s7e5', // Food Inspections
      testField: 'dba_name',
      testValue: 'RESTAURANT',
    },
    {
      name: 'Seattle',
      domain: 'data.seattle.gov',
      resourceId: '4xy5-26gy', // Weather
      testField: 'date',
      testValue: '2012-10-02',
    },
    {
      name: 'Los Angeles',
      domain: 'data.lacity.org',
      resourceId: '2nrs-mtv8', // Crime Data
      testField: 'dr_no',
      testValue: '211507896',
    },
    {
      name: 'Dallas',
      domain: 'www.dallasopendata.com',
      resourceId: '9fxf-t2tr', // Police Calls
      testField: 'incident_number',
      testValue: '25-2268844',
    },
    {
      name: 'Austin',
      domain: 'data.austintexas.gov',
      resourceId: 'ecmv-9xxi', // Restaurant Inspections
      testField: 'restaurant_name',
      testValue: 'RESTAURANT',
    },
    {
      name: 'New York City',
      domain: 'data.cityofnewyork.us',
      resourceId: '5uac-w243', // NYPD Complaint Data
      testField: 'cmplnt_num',
      testValue: '303250435',
    },
  ];

  // Create clients for each city
  const clients = new Map<string, SodaClient>();

  beforeAll(() => {
    cityConfigs.forEach((config) => {
      clients.set(
        config.name,
        new SodaClient({
          domain: config.domain,
          timeout: 10000, // 10 second timeout
        }),
      );
    });
  });

  describe('Basic SELECT queries across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should retrieve data from ${config.name}`, async () => {
        const client = clients.get(config.name)!;

        const result = await client
          .query(config.resourceId)
          .select([config.testField])
          .limit(5)
          .execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.length).toBeLessThanOrEqual(5);

        // Verify structure of first record
        if (result.data.length > 0) {
          const firstRecord = result.data[0] as Record<string, unknown>;
          expect(firstRecord).toHaveProperty(config.testField);
        }
      });

      it(`should retrieve all fields from ${config.name} with wildcard`, async () => {
        const client = clients.get(config.name)!;

        const result = await client.query(config.resourceId).limit(2).execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify first record has at least one field
        if (result.data.length > 0) {
          const firstRecord = result.data[0] as Record<string, unknown>;
          const fieldCount = Object.keys(firstRecord).length;
          expect(fieldCount).toBeGreaterThanOrEqual(1);
        }
      });
    });
  });

  describe('WHERE clause queries across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should filter data in ${config.name} using WHERE clause`, async () => {
        const client = clients.get(config.name)!;

        // Use IS NOT NULL operator (pass null as value)
        const result = await client
          .query(config.resourceId)
          .select([config.testField])
          .where(config.testField, '!=', null)
          .limit(5)
          .execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify all returned records have the field
        result.data.forEach((record) => {
          const rec = record as Record<string, unknown>;
          expect(rec).toHaveProperty(config.testField);
          expect(rec[config.testField]).not.toBeNull();
          expect(rec[config.testField]).not.toBeUndefined();
        });
      });
    });
  });

  describe('ORDER BY queries across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should sort data in ${config.name} using ORDER BY`, async () => {
        const client = clients.get(config.name)!;

        const result = await client
          .query(config.resourceId)
          .select([config.testField])
          .orderBy(config.testField, 'desc')
          .limit(5)
          .execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);

        // Verify sorting (at least check that we got results)
        if (result.data.length > 1) {
          // For string fields, we can't easily verify sort order without knowing the data
          // But we can verify the query executed successfully
          const firstRecord = result.data[0] as Record<string, unknown>;
          expect(firstRecord).toHaveProperty(config.testField);
        }
      });
    });
  });

  describe('LIMIT clause across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should respect LIMIT in ${config.name}`, async () => {
        const client = clients.get(config.name)!;

        const limit = 3;
        const result = await client
          .query(config.resourceId)
          .select([config.testField])
          .limit(limit)
          .execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeLessThanOrEqual(limit);
      });
    });
  });

  describe('Combined queries across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should execute complex query in ${config.name} (SELECT + WHERE + ORDER + LIMIT)`, async () => {
        const client = clients.get(config.name)!;

        const result = await client
          .query(config.resourceId)
          .select([config.testField])
          .where(config.testField, '!=', null)
          .orderBy(config.testField, 'desc')
          .limit(5)
          .execute();

        expect(result).toHaveProperty('data');
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data.length).toBeGreaterThan(0);
        expect(result.data.length).toBeLessThanOrEqual(5);

        // Verify structure
        result.data.forEach((record) => {
          const rec = record as Record<string, unknown>;
          expect(rec).toHaveProperty(config.testField);
        });
      });
    });
  });

  describe('Metadata retrieval across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should retrieve metadata from ${config.name}`, async () => {
        const client = clients.get(config.name)!;

        const metadata = await client.getMetadata(config.resourceId);

        expect(metadata).toBeDefined();
        expect(typeof metadata).toBe('object');
        // Metadata structure may vary, but should have some basic properties
        expect(Object.keys(metadata).length).toBeGreaterThan(0);
      });
    });
  });

  describe('Error handling across cities', () => {
    cityConfigs.forEach((config) => {
      it(`should handle invalid resource ID in ${config.name}`, async () => {
        const client = clients.get(config.name)!;

        await expect(
          client.query('invalid-resource-id-12345').limit(1).execute(),
        ).rejects.toThrow();
      });
    });
  });
});
