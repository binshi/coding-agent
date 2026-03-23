# Security Analysis Skill

## Purpose
Provides specialized guidance for identifying security vulnerabilities, insecure patterns, and compliance issues in application code.

## When to Use
- Analyzing any source code file for security vulnerabilities
- Reviewing authentication, authorization, and data handling code
- Evaluating dependency usage for known vulnerability patterns
- Assessing input validation and output encoding practices

## Analysis Checklist

### Injection Vulnerabilities
- **SQL Injection**: Detect string concatenation in SQL queries — require parameterized queries
- **XSS (Cross-Site Scripting)**: Flag unsanitized user input rendered in HTML (`innerHTML`, `dangerouslySetInnerHTML`, template literals in DOM)
- **Command Injection**: Detect user input passed to `exec()`, `spawn()`, `system()` without sanitization
- **Path Traversal**: Flag user input used in file paths without validation (`../` attacks)
- **LDAP/XML/NoSQL Injection**: Detect unsanitized input in query construction

### Authentication and Authorization
- Flag hardcoded credentials, API keys, tokens, or passwords
- Detect missing authentication checks on sensitive endpoints
- Identify broken access control (missing authorization after authentication)
- Check for insecure session management (predictable tokens, missing expiry)
- Flag use of weak hashing algorithms for passwords (MD5, SHA1) — require bcrypt/argon2
- Detect missing CSRF protection on state-changing operations

### Data Exposure
- Flag sensitive data logged to console or log files (passwords, tokens, PII)
- Detect sensitive data in error messages returned to clients
- Identify missing encryption for data at rest or in transit
- Check for overly permissive CORS configurations
- Flag sensitive data stored in localStorage/sessionStorage without encryption

### Cryptography
- Detect use of deprecated crypto algorithms (MD5, SHA1, DES, RC4)
- Flag hardcoded encryption keys or IVs
- Identify use of `Math.random()` for security-sensitive operations — require `crypto.randomBytes`
- Check for proper key length (AES-256, RSA-2048 minimum)
- Detect ECB mode usage — require CBC or GCM

### Dependency and Configuration
- Flag known vulnerable patterns from popular libraries
- Detect `eval()`, `Function()`, `setTimeout(string)` — dynamic code execution
- Check for disabled security headers (HSTS, CSP, X-Frame-Options)
- Identify insecure deserialization patterns
- Flag `http://` URLs where `https://` should be used

### Input Validation
- Detect missing input validation on API endpoints
- Flag missing length limits on string inputs (DoS via large payloads)
- Check for proper email, URL, and phone number validation
- Identify missing rate limiting on authentication endpoints
- Detect regex patterns vulnerable to ReDoS (catastrophic backtracking)

### Error Handling
- Flag stack traces or internal details exposed in production error responses
- Detect catch blocks that silently swallow security-relevant errors
- Check for proper error logging without sensitive data leakage
- Identify missing error handling on security-critical operations

## Severity Mapping
- **critical**: Active injection vulnerabilities, hardcoded secrets, broken authentication
- **high**: Missing input validation on external data, weak cryptography, data exposure
- **medium**: Missing security headers, overly permissive CORS, insecure session config
- **low**: Missing rate limiting, verbose error messages, minor configuration issues
- **info**: Security best practice suggestions, defense-in-depth recommendations
