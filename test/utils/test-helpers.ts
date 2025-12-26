import { SodaClient } from '../../src/client/SodaClient';
import { QueryBuilder } from '../../src/builder/QueryBuilder';

export function createTestClient(overrides?: Partial<ConstructorParameters<typeof SodaClient>[0]>) {
  return new SodaClient({
    domain: 'data.test.gov',
    appToken: 'test-token',
    ...overrides,
  });
}

export function createTestBuilder() {
  return new QueryBuilder();
}

export const mockSodaResponse = {
  data: [
    { id: 1, name: 'Test 1', value: 100 },
    { id: 2, name: 'Test 2', value: 200 },
  ],
};

export const mockSodaMetadata = {
  id: 'test-resource',
  name: 'Test Resource',
  description: 'A test resource',
  columns: [
    { name: 'id', dataTypeName: 'number' },
    { name: 'name', dataTypeName: 'text' },
    { name: 'value', dataTypeName: 'number' },
  ],
};
