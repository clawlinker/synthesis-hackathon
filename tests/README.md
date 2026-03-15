# Tests — Manual Verification

This directory contains test files that can be run manually with:

```bash
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom
npx vitest run
```

## Test Files

- `receipt-api.test.ts` — Validates API response shapes and fallback behavior
- `data-models.test.ts` — Verifies TypeScript interfaces and data structures

## Why Tests Are Not In CI

The automated cron runner (`synthesis-autonomous`) does not include tests in `package.json` to avoid adding dependencies that aren't approved for autonomous execution. Tests are kept for manual verification and future CI integration.

## Running Tests Locally

```bash
# Install test dependencies (approved for dev work)
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom @types/jsdom jsdom

# Run tests
npx vitest run
```
