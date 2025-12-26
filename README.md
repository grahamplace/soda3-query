# soda3-query

[![npm version](https://img.shields.io/npm/v/soda3-query.svg)](https://www.npmjs.com/package/soda3-query)
[![npm downloads](https://img.shields.io/npm/dm/soda3-query.svg)](https://www.npmjs.com/package/soda3-query)
[![codecov](https://codecov.io/gh/grahamplace/soda3-query/branch/main/graph/badge.svg)](https://codecov.io/gh/grahamplace/soda3-query)

A fluent query builder for SODA (Socrata Open Data API) v3, providing an ORM-like interface for constructing SoQL queries in Node.js.

## Features

- 🎯 **Fluent Query Builder** - Chain methods to build queries naturally
- 🔒 **Type-Safe** - Full TypeScript support with comprehensive type definitions
- 🚀 **SODA v3 Compatible** - Built specifically for the SODA v3 API
- 📦 **Zero Dependencies** - Uses native Node.js `fetch` (Node 18+)
- 🎨 **Flexible** - Use standalone query builder or integrated client

## Installation

```bash
npm install soda3-query
# or
pnpm add soda3-query
# or
yarn add soda3-query
```

📦 **Package:** [npmjs.com/package/soda3-query](https://www.npmjs.com/package/soda3-query)

## Quick Start

```typescript
import { SodaClient } from 'soda3-query';

// Initialize the client
const client = new SodaClient({
  domain: 'data.city.gov',
  appToken: 'your-app-token', // Optional but recommended
});

// Execute a query
const results = await client
  .query('resource-id')
  .select(['name', 'age', 'city'])
  .where('age', '>', 30)
  .where('city', '=', 'New York')
  .orderBy('age', 'desc')
  .limit(100)
  .offset(0)
  .execute();

console.log(results.data);
```

## API Documentation

### SodaClient

The main client for interacting with SODA v3 APIs.

#### Constructor

```typescript
new SodaClient(options: SodaClientOptions)
```

**Options:**

- `domain` (required): The SODA domain (e.g., `'data.city.gov'`)
- `appToken` (optional): Your SODA application token for higher rate limits
- `timeout` (optional): Request timeout in milliseconds

#### Methods

##### `query(resourceId: string): QueryBuilder`

Creates a query builder bound to this client for the specified resource.

##### `executeQuery<T>(resourceId: string, queryParams: SoQLQueryParams): Promise<SodaResponse<T>>`

Executes a query directly with raw query parameters.

##### `getMetadata(resourceId: string): Promise<ResourceMetadata>`

Retrieves metadata about a resource.

### QueryBuilder

The fluent query builder for constructing SoQL queries.

#### Methods

##### `select(fields: string | string[]): QueryBuilder`

Specifies which fields to retrieve. Supports:

- Single field: `select('name')`
- Multiple fields: `select(['name', 'age', 'city'])`
- Wildcard: `select('*')`
- Aggregate functions: `select(['category', 'count(*)', 'sum(amount)'])`
- Aliases: `select('name as full_name')`

##### `where(column: string, operator: string, value: WhereValue): QueryBuilder`

Adds a WHERE condition (defaults to AND). Supports operators:

- `=`, `!=`, `<`, `>`, `<=`, `>=`
- `LIKE` - Pattern matching
- `IN` - Value in array
- `IS NULL`, `IS NOT NULL` - Null checks

##### `andWhere(column: string, operator: string, value: WhereValue): QueryBuilder`

Explicitly adds an AND condition.

##### `orWhere(column: string, operator: string, value: WhereValue): QueryBuilder`

Adds an OR condition.

##### `whereRaw(condition: string): QueryBuilder`

Adds a raw SQL condition for complex queries.

##### `orderBy(column: string, direction?: 'asc' | 'desc'): QueryBuilder`

Adds an ORDER BY clause. Default direction is `'asc'`.

##### `groupBy(columns: string | string[]): QueryBuilder`

Adds a GROUP BY clause.

##### `having(column: string, operator: string, value: WhereValue): QueryBuilder`

Adds a HAVING clause for post-aggregation filtering.

##### `limit(count: number): QueryBuilder`

Sets the LIMIT for pagination.

##### `offset(count: number): QueryBuilder`

Sets the OFFSET for pagination.

##### `build(): SoQLQueryParams`

Builds and returns the SoQL query parameters object without executing.

##### `execute<T>(): Promise<SodaResponse<T>>`

Executes the query and returns the results. Requires the builder to be bound to a client.

## Examples

### Basic Query

```typescript
const results = await client
  .query('resource-id')
  .select('*')
  .where('status', '=', 'active')
  .limit(10)
  .execute();
```

### Multiple Conditions

```typescript
const results = await client
  .query('resource-id')
  .select(['name', 'age', 'city'])
  .where('age', '>', 30)
  .where('city', '=', 'New York')
  .orWhere('status', '=', 'vip')
  .orderBy('age', 'desc')
  .execute();
```

### Aggregations with GROUP BY

```typescript
const results = await client
  .query('resource-id')
  .select(['category', 'count(*)', 'sum(amount)'])
  .groupBy('category')
  .having('count(*)', '>', 10)
  .orderBy('category')
  .execute();
```

### IN Operator

```typescript
const results = await client
  .query('resource-id')
  .select('*')
  .where('status', 'IN', ['active', 'pending', 'completed'])
  .execute();
```

### NULL Checks

```typescript
// Automatically converts = null to IS NULL
const results = await client
  .query('resource-id')
  .select('*')
  .where('deleted_at', '=', null)
  .execute();

// Or explicitly
const results = await client
  .query('resource-id')
  .select('*')
  .where('email', 'IS NOT NULL', null)
  .execute();
```

### LIKE Pattern Matching

```typescript
const results = await client
  .query('resource-id')
  .select('*')
  .where('name', 'LIKE', 'John%')
  .execute();
```

### Raw SQL Conditions

```typescript
const results = await client
  .query('resource-id')
  .select('*')
  .where('status', '=', 'active')
  .andWhereRaw('EXTRACT(YEAR FROM created_at) = 2024')
  .execute();
```

### Standalone Query Builder

You can also use the query builder without a client to generate query parameters:

```typescript
import { QueryBuilder } from 'soda3-query';

const query = new QueryBuilder()
  .select(['name', 'age'])
  .where('age', '>', 30)
  .orderBy('name')
  .limit(100)
  .build();

// Returns: {
//   $select: 'name,age',
//   $where: 'age > 30',
//   $order: 'name ASC',
//   $limit: 100
// }
```

### Pagination

```typescript
// First page
const page1 = await client.query('resource-id').select('*').limit(20).offset(0).execute();

// Second page
const page2 = await client.query('resource-id').select('*').limit(20).offset(20).execute();
```

### Get Resource Metadata

```typescript
const metadata = await client.getMetadata('resource-id');
console.log(metadata.columns); // Array of column definitions
```

## Error Handling

The client throws errors for various scenarios:

```typescript
try {
  const results = await client.query('resource-id').select('*').execute();
} catch (error) {
  if (error instanceof Error) {
    console.error('Query failed:', error.message);
    // Handle 4xx, 5xx, network errors, timeouts, etc.
  }
}
```

## TypeScript Support

Full TypeScript support is included. You can type your query results:

```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const results = await client
  .query<User>('users-resource-id')
  .select(['id', 'name', 'email'])
  .where('active', '=', true)
  .execute();

// results.data is typed as User[]
```

## Comparison Operators

| Operator      | Description           | Example                                 |
| ------------- | --------------------- | --------------------------------------- |
| `=`           | Equal                 | `.where('status', '=', 'active')`       |
| `!=`          | Not equal             | `.where('status', '!=', 'inactive')`    |
| `<`           | Less than             | `.where('age', '<', 18)`                |
| `>`           | Greater than          | `.where('age', '>', 65)`                |
| `<=`          | Less than or equal    | `.where('age', '<=', 18)`               |
| `>=`          | Greater than or equal | `.where('age', '>=', 18)`               |
| `LIKE`        | Pattern match         | `.where('name', 'LIKE', 'John%')`       |
| `IN`          | Value in array        | `.where('status', 'IN', ['a', 'b'])`    |
| `IS NULL`     | Null check            | `.where('deleted_at', 'IS NULL', null)` |
| `IS NOT NULL` | Not null check        | `.where('email', 'IS NOT NULL', null)`  |

## Requirements

- Node.js 18 or higher (uses native `fetch`)

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with coverage in watch mode
npm run test:coverage:watch

# Run live API integration tests (requires internet connection)
npm run test:live-integration

# Type check
npm run typecheck

# Lint
npm run lint

# Format code
npm run format

# Build
npm run build
```

### Test Coverage

The project includes comprehensive test coverage reporting. Coverage reports are generated in multiple formats:

- **Text**: Displayed in terminal
- **HTML**: Interactive report in `coverage/index.html`
- **LCOV**: For CI/CD integration (e.g., Codecov)
- **JSON**: Machine-readable format

**Coverage Thresholds:**

- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

View the HTML coverage report:

```bash
npm run test:coverage
open coverage/index.html
```

### Live Integration Tests

The test suite includes optional live integration tests that query real SODA v3 endpoints from multiple cities' open data portals. These tests validate that the query builder produces correct SoQL that the API accepts and returns expected results across different SODA deployments.

**Test Coverage:**

- **San Francisco** (`data.sfgov.org`) - Comprehensive tests using the 311 Cases dataset
- **Multi-City Tests** - Basic compatibility tests across:
  - San Francisco (`data.sfgov.org`)
  - Chicago (`data.cityofchicago.org`)
  - Seattle (`data.seattle.gov`)
  - Los Angeles (`data.lacity.org`)
  - Dallas (`www.dallasopendata.com`)
  - Austin (`data.austintexas.gov`)
  - New York City (`data.cityofnewyork.us`)

**To run live integration tests:**

```bash
# Using the npm script
npm run test:live-integration

# Or manually with environment variable
ENABLE_REAL_API_TESTS=true npm test
```

**CI/CD Integration:**

The repository includes GitHub Actions workflows that follow best practices for running live tests:

- **On Pull Requests:** Only fast unit tests, linting, and type checking run (no live tests)
- **On Merges to Main:** Live integration tests run automatically after code is merged
- **Scheduled:** Optional daily scheduled runs to catch external API changes/regressions

This approach balances:

- **Fast feedback** on PRs (unit tests complete in seconds)
- **Comprehensive validation** after merge (live tests ensure real-world compatibility)
- **Early detection** of external API changes (scheduled runs)

**Note:**

- Live integration tests require an internet connection
- Tests may be slower than mocked tests (~10-15 seconds for full suite)
- Tests are subject to API rate limits
- Tests are skipped by default in CI/CD pipelines (opt-in via environment variable)
- The tests use public datasets which don't require authentication
- Multi-city tests validate compatibility across different SODA versions and configurations

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Release Process

This package follows [Semantic Versioning](https://semver.org/). For details on the release process, see [RELEASING.md](./RELEASING.md).

**Quick Release:**

1. Use the "Prepare Release" GitHub Action workflow
2. Review and merge the release PR
3. Create and push a version tag (e.g., `v1.2.3`)
4. The release workflow automatically publishes to npm

## Links

- 📦 [npm Package](https://www.npmjs.com/package/soda3-query)
- 🔗 [GitHub Repository](https://github.com/grahamplace/soda3-query)
- 📚 [SODA API Documentation](https://dev.socrata.com/)
