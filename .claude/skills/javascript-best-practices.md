# JavaScript Best Practices Skill

## Purpose
Provides specialized guidance for analyzing JavaScript and TypeScript code quality, identifying anti-patterns, and recommending modern best practices.

## When to Use
- Analyzing `.js`, `.ts`, `.jsx`, `.tsx` files for code quality
- Reviewing pull requests that contain JavaScript/TypeScript changes
- Identifying deprecated patterns and suggesting modern alternatives

## Analysis Checklist

### Security
- Check for `eval()`, `Function()` constructor, and dynamic code execution
- Detect unsanitized user input in DOM manipulation (`innerHTML`, `document.write`)
- Flag hardcoded secrets, API keys, or credentials
- Identify missing input validation and sanitization
- Check for prototype pollution vulnerabilities
- Detect insecure use of `JSON.parse` without try/catch
- Flag use of `http://` instead of `https://`

### Performance
- Identify synchronous operations that should be async (file I/O, network calls)
- Detect memory leaks: unremoved event listeners, unclosed streams, circular references
- Flag unnecessary re-renders in React components (missing `useMemo`, `useCallback`)
- Check for N+1 query patterns in data fetching
- Identify inefficient array operations (nested loops where a Map/Set would be better)
- Detect missing debounce/throttle on high-frequency event handlers
- Flag large bundle imports where tree-shaking could help (`import _ from 'lodash'` vs `import { map } from 'lodash'`)

### Modern Patterns
- Prefer `const`/`let` over `var`
- Use optional chaining (`?.`) and nullish coalescing (`??`) instead of verbose null checks
- Prefer `async/await` over raw Promise chains or callbacks
- Use template literals instead of string concatenation
- Prefer destructuring for object/array access
- Use `Array.prototype` methods (`map`, `filter`, `reduce`) over imperative loops where appropriate
- Prefer `for...of` over `for...in` for array iteration
- Use `Object.entries()`, `Object.keys()`, `Object.values()` for object iteration

### Error Handling
- Every `async` function should have proper error handling
- Avoid empty `catch` blocks — at minimum log the error
- Use custom error classes for domain-specific errors
- Ensure Promises are not silently swallowed (no floating promises)
- Check for proper cleanup in `finally` blocks

### TypeScript-Specific
- Avoid `any` type — use `unknown` with type guards instead
- Prefer `interface` for object shapes, `type` for unions/intersections
- Use `readonly` for immutable properties
- Ensure exhaustive switch statements with `never` type
- Use strict null checks and avoid non-null assertions (`!`) where possible
- Prefer `enum` or const objects over magic strings/numbers

### Code Organization
- Functions should do one thing (Single Responsibility)
- Keep functions under 30 lines where practical
- Avoid deep nesting (max 3 levels) — extract helper functions
- Use meaningful, descriptive names (no single-letter variables except loop counters)
- Group related imports and separate third-party from local imports

## Severity Mapping
- **critical**: Security vulnerabilities (eval, XSS, hardcoded secrets)
- **high**: Unhandled errors, memory leaks, floating promises
- **medium**: Missing TypeScript types, complex functions, deprecated patterns
- **low**: Style issues, naming conventions, minor optimizations
- **info**: Suggestions for modern patterns, readability improvements
