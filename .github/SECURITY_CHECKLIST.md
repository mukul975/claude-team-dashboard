# Security Checklist for Contributors

This checklist ensures all security best practices are followed when contributing to AgentDashboard.

## Pre-Commit Security Checklist

### Sensitive Data Protection

- [ ] No API keys, tokens, or credentials in code
- [ ] No hardcoded passwords or secrets
- [ ] No PII (Personally Identifiable Information)
- [ ] `.env.example` used for environment variable templates
- [ ] All secrets added to `.gitignore`
- [ ] No database credentials in code
- [ ] No cloud provider keys (AWS, Azure, GCP)

### Input Validation & Sanitization

- [ ] All user input validated before processing
- [ ] Input length limits enforced
- [ ] File upload restrictions implemented (if applicable)
- [ ] URL validation for external requests
- [ ] Email validation using proper regex
- [ ] No `eval()` or `Function()` constructor with user input
- [ ] No `dangerouslySetInnerHTML` without sanitization

### XSS (Cross-Site Scripting) Prevention

- [ ] React's built-in XSS protection utilized
- [ ] No raw HTML rendering without sanitization
- [ ] Content Security Policy (CSP) headers configured
- [ ] User-generated content properly escaped
- [ ] No inline JavaScript in HTML
- [ ] DOMPurify used if rendering HTML is necessary

### SQL Injection Prevention

- [ ] Parameterized queries used exclusively
- [ ] No string concatenation for SQL queries
- [ ] ORM/query builder used properly
- [ ] Stored procedures used where appropriate
- [ ] Database user has minimal privileges

### Authentication & Authorization

- [ ] Passwords hashed with bcrypt/Argon2 (never plain text)
- [ ] Salt rounds set to 12+ for bcrypt
- [ ] JWT tokens have expiration times
- [ ] JWT secret is strong (256+ bits)
- [ ] Session tokens are secure and httpOnly
- [ ] Multi-factor authentication (MFA) supported
- [ ] Account lockout after failed login attempts
- [ ] Password reset uses secure tokens with expiration

### WebSocket Security

- [ ] WebSocket connections authenticated
- [ ] Rate limiting on WebSocket messages
- [ ] Message validation implemented
- [ ] Origin header validation
- [ ] WSS (secure WebSocket) used in production
- [ ] Connection limits per IP/user
- [ ] Proper error handling without info leakage

### Dependency Security

- [ ] `npm audit` run and no critical vulnerabilities
- [ ] Dependencies updated to latest secure versions
- [ ] Unused dependencies removed
- [ ] Dependency versions pinned or locked
- [ ] Dependabot configured and monitored
- [ ] Supply chain attack considerations

### CORS & CSRF Protection

- [ ] CORS configured with specific origins (not `*`)
- [ ] CSRF tokens implemented for state-changing operations
- [ ] SameSite cookie attribute set
- [ ] Preflight requests handled correctly
- [ ] Credentials included only when necessary

### Transport Security

- [ ] HTTPS enforced in production
- [ ] TLS 1.2+ minimum version
- [ ] Strong cipher suites configured
- [ ] HSTS (HTTP Strict Transport Security) header set
- [ ] Certificate validation implemented
- [ ] No mixed content (HTTP resources on HTTPS pages)

### Security Headers

- [ ] Helmet.js configured (if using Express)
- [ ] Content-Security-Policy header set
- [ ] X-Frame-Options set to DENY or SAMEORIGIN
- [ ] X-Content-Type-Options set to nosniff
- [ ] X-XSS-Protection header configured
- [ ] Referrer-Policy header set
- [ ] Permissions-Policy header configured

### Error Handling & Logging

- [ ] Error messages don't leak sensitive information
- [ ] Stack traces hidden in production
- [ ] Errors logged securely (no secrets in logs)
- [ ] Failed authentication attempts logged
- [ ] Security events logged (access control failures)
- [ ] Log injection prevented
- [ ] Logs stored securely with access controls

### File System Security

- [ ] Path traversal attacks prevented
- [ ] File permissions set correctly
- [ ] No arbitrary file uploads without validation
- [ ] Uploaded files scanned for malware
- [ ] File type validation (not just extension)
- [ ] File size limits enforced
- [ ] Uploaded files stored outside web root

### API Security

- [ ] Rate limiting implemented
- [ ] API keys rotated regularly
- [ ] API versioning implemented
- [ ] Deprecation notices for old endpoints
- [ ] Input validation on all endpoints
- [ ] Output encoding implemented
- [ ] No sensitive data in URLs/query params

## Code Review Security Checklist

When reviewing pull requests, verify:

### General Security

- [ ] No commented-out security controls
- [ ] No TODO/FIXME related to security
- [ ] No temporary workarounds bypassing security
- [ ] No debug code left in production paths
- [ ] Security libraries used correctly

### Logic & Business Rules

- [ ] Authorization checks can't be bypassed
- [ ] Business logic validated server-side (not just client-side)
- [ ] Race conditions considered and handled
- [ ] Integer overflow/underflow prevented
- [ ] Proper boundary checks on arrays/collections

### Third-Party Integrations

- [ ] Third-party APIs called securely
- [ ] OAuth flow implemented correctly
- [ ] Webhook signatures validated
- [ ] Third-party scripts loaded from trusted sources
- [ ] Subresource Integrity (SRI) used for CDN resources

## Deployment Security Checklist

Before deploying to production:

### Environment Configuration

- [ ] Environment variables properly secured
- [ ] Secrets management system in place
- [ ] Debug mode disabled
- [ ] Development tools/endpoints removed
- [ ] Default credentials changed
- [ ] Unnecessary services disabled

### Monitoring & Alerting

- [ ] Security monitoring enabled
- [ ] Intrusion detection configured
- [ ] Log aggregation set up
- [ ] Alerting for suspicious activity
- [ ] Audit trails maintained
- [ ] Incident response plan documented

### Infrastructure

- [ ] Firewall rules configured
- [ ] Database access restricted
- [ ] SSH keys used (not passwords)
- [ ] Regular backups configured
- [ ] Backup restoration tested
- [ ] DDoS protection enabled
- [ ] Container security best practices followed

## Emergency Security Procedures

### If You Discover a Vulnerability

1. **DO NOT** commit code with the vulnerability
2. **DO NOT** discuss publicly in issues/PRs
3. **DO** report to security team immediately
4. **DO** follow responsible disclosure guidelines
5. **DO** provide clear reproduction steps

### If Credentials Are Exposed

1. **Immediately** revoke/rotate the exposed credentials
2. **Notify** repository maintainers
3. **Check** git history for exposure extent
4. **Rewrite** git history if needed (with coordination)
5. **Update** all instances using those credentials
6. **Document** incident for post-mortem

## Security Testing Tools

Run these tools before submitting PR:

```bash
# Dependency vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Security linting
npm run lint

# Run all tests
npm test

# Build check
npm run build
```

## External Security Resources

### OWASP Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)

### Security Best Practices

- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [React Security Best Practices](https://reactjs.org/docs/dom-elements.html#dangerouslysetinnerhtml)

### Security Tools

- [npm audit](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [Snyk](https://snyk.io/)
- [Dependabot](https://github.com/dependabot)
- [CodeQL](https://codeql.github.com/)
- [OWASP ZAP](https://www.zaproxy.org/)

## Security Training

Consider taking these courses:

- OWASP WebGoat (hands-on training)
- PortSwigger Web Security Academy (free)
- SANS Secure Coding courses
- GitHub Security Lab training

---

**Remember**: Security is everyone's responsibility. When in doubt, ask!

**Last Updated**: 2026-02-10
