# Test Coverage Best Practices Skill

## Purpose
Provides specialized guidance for evaluating test completeness, identifying untested code paths, and recommending effective test strategies.

## When to Use
- Analyzing source files to assess test coverage gaps
- Reviewing test files for assertion quality and completeness
- Suggesting specific test cases for untested code paths
- Evaluating test architecture and organization

## Analysis Checklist

### Coverage Identification
- Map every exported function/class/method to its corresponding test
- Identify functions with zero test coverage (no test file references them)
- Detect untested branches: `if/else`, `switch` cases, ternary operators
- Find untested error paths: `catch` blocks, error callbacks, rejection handlers
- Check for untested edge cases: empty arrays, null/undefined inputs, boundary values

### Test Quality Assessment
- Flag tests with no assertions (test runs but verifies nothing)
- Detect tests that only check happy paths without error scenarios
- Identify overly broad assertions (`toBeTruthy()` instead of specific value checks)
- Check for proper async test handling (`await`, `.resolves`, `.rejects`)
- Flag snapshot tests used as a substitute for behavioral assertions
- Detect tests that depend on execution order or shared mutable state

### Critical Paths to Test
- **Public API surface**: Every exported function must have tests
- **Error handling**: Every `try/catch`, `.catch()`, error callback
- **Boundary conditions**: Empty inputs, max values, off-by-one scenarios
- **State transitions**: Before/after mutations, lifecycle hooks
- **Integration points**: API calls, database queries, file I/O (with mocks)
- **Security-sensitive code**: Authentication, authorization, input validation

### Test Organization
- Test files should mirror source file structure
- Use descriptive `describe`/`it` blocks that read as specifications
- Group tests by feature or behavior, not by implementation detail
- Separate unit tests from integration tests
- Use factories or builders for test data instead of inline object literals

### Mocking Best Practices
- Mock external dependencies (APIs, databases, file system) not internal modules
- Verify mock interactions (was the mock called with correct arguments?)
- Reset mocks between tests to prevent state leakage
- Prefer dependency injection over module-level mocking where possible
- Use `jest.spyOn` over `jest.fn` when you need to preserve original behavior

### Suggested Test Templates
For untested functions, suggest tests following this pattern:
```typescript
describe('functionName', () => {
  it('should handle the happy path', () => { /* ... */ });
  it('should handle empty input', () => { /* ... */ });
  it('should handle null/undefined', () => { /* ... */ });
  it('should throw on invalid input', () => { /* ... */ });
  it('should handle edge case: [specific]', () => { /* ... */ });
});
```

## Priority Mapping
- **critical**: Core business logic with zero tests, security code untested
- **high**: Error handling paths untested, public API without coverage
- **medium**: Helper functions missing tests, incomplete branch coverage
- **low**: Simple getters/setters, configuration constants, type-only files
