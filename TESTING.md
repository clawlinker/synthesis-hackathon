# Testing Guide — Agent Receipts

This document describes the test suite for the Synthesis Hackathon submission.

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/receipt-api.test.ts
```

## Test Coverage

### Receipt API Tests (`tests/receipt-api.test.ts`)
- Returns sample data when BASESCAN_API_KEY is missing
- Includes sample receipts when fetch fails
- Handles wallet parameter correctly
- Handles invalid wallet parameter gracefully

### Data Models Tests (`tests/data-models.test.ts`)
- Validates sample receipts structure
- Verifies required fields and types
- Tests type safety

## CI/CD Integration

Add to your GitHub Actions workflow:

```yaml
- name: Run tests
  run: |
    npm ci
    npm test
```

## Test Patterns

1. **Isolation**: Each test sets up its own environment
2. **Validation**: Verify response shapes and data types
3. **Fallbacks**: Test error handling and fallback behavior
4. **Type Safety**: TypeScript interfaces validated against runtime data

## Mocking Strategy

- Next.js modules mocked with `vi.mock()`
- External APIs (Basescan) mocked in API route tests
- Environment variables cleaned between tests
