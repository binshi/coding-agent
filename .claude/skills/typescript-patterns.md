# TypeScript Patterns Skill

## Purpose
Provides specialized guidance for evaluating TypeScript-specific patterns, type safety, and idiomatic TypeScript usage in code reviews.

## When to Use
- Analyzing `.ts` and `.tsx` files for type safety and correctness
- Reviewing TypeScript configuration and strict mode compliance
- Identifying opportunities to leverage the TypeScript type system more effectively

## Analysis Checklist

### Type Safety
- Flag all uses of `any` — suggest `unknown` with type narrowing instead
- Detect implicit `any` from missing return types or parameter types
- Check for unsafe type assertions (`as` casts) that bypass type checking
- Identify missing generic constraints that could cause runtime errors
- Flag non-null assertions (`!`) — prefer proper null checks or optional chaining
- Detect `@ts-ignore` / `@ts-expect-error` comments — ensure they are justified

### Generics and Utility Types
- Suggest `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>` where manual types duplicate existing ones
- Recommend `Record<K, V>` over index signatures where appropriate
- Use `Readonly<T>` and `ReadonlyArray<T>` for immutable data
- Suggest `Extract`, `Exclude`, `NonNullable` for union type manipulation
- Identify opportunities for generic functions to reduce code duplication

### Discriminated Unions and Exhaustiveness
- Prefer discriminated unions over type assertions for polymorphic data
- Ensure `switch` statements on union types are exhaustive (use `never` in default)
- Use tagged/discriminated unions for state machines and result types
- Recommend `Result<T, E>` pattern for error handling over thrown exceptions

### Interface vs Type
- Use `interface` for object shapes that may be extended
- Use `type` for unions, intersections, mapped types, and conditional types
- Avoid `interface` for function types — use `type` instead
- Ensure consistent usage within the codebase

### Module and Import Patterns
- Prefer named exports over default exports for better refactoring support
- Use `import type` for type-only imports to reduce bundle size
- Detect circular dependencies between modules
- Ensure barrel files (`index.ts`) don't cause unnecessary bundling

### Strict Mode Compliance
- `strictNullChecks`: Ensure null/undefined are handled explicitly
- `noImplicitAny`: All variables and parameters should have explicit types
- `strictFunctionTypes`: Function parameter types should be contravariant
- `noUncheckedIndexedAccess`: Array/object index access returns `T | undefined`

### Advanced Patterns
- Recommend branded/nominal types for domain primitives (e.g., `UserId`, `Email`)
- Suggest `satisfies` operator for type validation without widening
- Use `const` assertions for literal types and readonly tuples
- Recommend `Zod` or `io-ts` for runtime validation of external data

## Severity Mapping
- **critical**: Unsafe `any` in security-sensitive code, missing null checks on external data
- **high**: Widespread `any` usage, missing return types on public APIs, `@ts-ignore` without justification
- **medium**: Missing generic constraints, suboptimal utility type usage, implicit `any`
- **low**: Interface vs type inconsistency, missing `import type`, style preferences
- **info**: Opportunities for advanced patterns, branded types, `satisfies` usage
