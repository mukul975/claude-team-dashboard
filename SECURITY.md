# Security Policy

## Our Commitment to Security

The AgentDashboard project takes security seriously. We appreciate the security research community's efforts in helping us maintain a secure platform for our users.

## Supported Versions

We release security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

If you discover a security vulnerability, please report it to us privately:

### Preferred Method: Security Advisory

1. Go to the [Security tab](https://github.com/mukul975/agentdashboard/security/advisories)
2. Click "Report a vulnerability"
3. Fill out the form with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

### Alternative Method: Email

Send an email to: **mukul975@users.noreply.github.com**

Include in your report:
- **Description**: Detailed description of the vulnerability
- **Impact**: Potential security impact
- **Reproduction**: Step-by-step instructions to reproduce
- **Version**: Affected version(s)
- **Environment**: OS, Node.js version, browser (if applicable)
- **Fix**: Suggested remediation (optional)

## What to Expect

After submitting a vulnerability report:

1. **Acknowledgment**: We'll acknowledge receipt within 48 hours
2. **Initial Assessment**: We'll provide an initial assessment within 5 business days
3. **Updates**: We'll keep you informed of our progress
4. **Fix**: We'll work on a fix and aim to release it as soon as possible
5. **Credit**: We'll credit you in the security advisory (unless you prefer to remain anonymous)
6. **Disclosure**: We'll coordinate public disclosure timing with you

## Security Best Practices for Users

### Installation Security

```bash
# Verify package integrity
npm audit

# Check for vulnerabilities
npm audit fix

# Use package-lock.json for reproducible installs
npm ci
```

### Configuration Security

1. **Environment Variables**: Never commit `.env` files
   ```bash
   # Add to .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **API Keys**: Store sensitive credentials securely
   - Use environment variables
   - Consider using secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly

3. **HTTPS Only**: Always use HTTPS in production
   ```javascript
   // Force HTTPS
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https' && process.env.NODE_ENV === 'production') {
       res.redirect(`https://${req.header('host')}${req.url}`);
     } else {
       next();
     }
   });
   ```

### Deployment Security

1. **Dependencies**: Keep dependencies up-to-date
   - Enable Dependabot
   - Review dependency updates regularly
   - Monitor security advisories

2. **Access Control**: Implement proper authentication
   - Use strong passwords
   - Enable MFA where possible
   - Follow principle of least privilege

3. **Rate Limiting**: Prevent abuse
   ```javascript
   // Already implemented in server.js
   const rateLimit = require('express-rate-limit');
   ```

4. **Security Headers**: Enabled via Helmet.js
   - Content Security Policy
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

### WebSocket Security

1. **Authentication**: Authenticate WebSocket connections
2. **Validation**: Validate all incoming messages
3. **Rate Limiting**: Limit message frequency per connection
4. **Origin Validation**: Check Origin header

## Known Security Considerations

### 1. WebSocket Connections

**Risk**: WebSocket connections could be abused if not properly secured

**Mitigation**:
- Token authentication required on every connection (closed with 4001 if missing)
- Connection rate limiting implemented
- Message validation in place
- Per-connection message rate limit (50 msg/sec) and size limit (64 KB)

### 2. File System Access

**Risk**: Server monitors file system for changes

**Mitigation**:
- Read-only file system access
- Restricted to project directory
- No arbitrary file uploads

### 3. Client-Side Rendering

**Risk**: XSS vulnerabilities in React components

**Mitigation**:
- React's built-in XSS protection
- No `dangerouslySetInnerHTML` usage
- Content Security Policy headers

## Security Features

### Current Implementation

- ✅ **Helmet.js**: Security headers
- ✅ **CORS**: Cross-origin resource sharing protection
- ✅ **Rate Limiting**: API and WebSocket connection throttling
- ✅ **Input Validation**: Request body size limits
- ✅ **Dependency Scanning**: Automated via Dependabot
- ✅ **CodeQL**: Static code analysis
- ✅ **npm audit**: Vulnerability scanning

### Roadmap

- ✅ WebSocket authentication (token required on every connection)
- ✅ Session management (sessionStorage token with rotation on login)
- ✅ API token support (Bearer token on all API routes)
- ✅ Audit logging (WebSocket connection/disconnect/error with IP logging)
- 🔄 Intrusion detection

## Vulnerability Disclosure Policy

### Coordinated Disclosure

We follow a coordinated vulnerability disclosure process:

1. **Report received** → Acknowledged within 48 hours
2. **Verification** → Confirmed within 5 business days
3. **Fix development** → Timeline communicated to reporter
4. **Security release** → Fix released as security patch
5. **Public disclosure** → 30 days after fix release (or earlier by mutual agreement)
6. **CVE assignment** → For critical vulnerabilities

### Public Disclosure

After a fix is released:
- Security advisory published on GitHub
- Release notes include security fixes
- Credit given to reporter (unless anonymous)
- CVE assigned for critical issues

## Security Hall of Fame

We recognize security researchers who help make AgentDashboard more secure.

*No vulnerabilities reported yet. Be the first to help us improve security!*

## Compliance

### OWASP Top 10 Coverage

We follow OWASP Top 10 security guidelines:

1. ✅ **Broken Access Control**: Rate limiting, CORS
2. ✅ **Cryptographic Failures**: HTTPS enforced
3. ✅ **Injection**: Input validation, parameterized queries
4. ✅ **Insecure Design**: Security by design principles
5. ✅ **Security Misconfiguration**: Helmet.js, secure defaults
6. ✅ **Vulnerable Components**: Dependabot, npm audit
7. ✅ **Authentication Failures**: Planned for future releases
8. ✅ **Data Integrity Failures**: Code signing, integrity checks
9. ✅ **Logging Failures**: Access and error logging
10. ✅ **SSRF**: Input validation on external requests

## Contact

For security-related questions or concerns:
- **Security Team**: mukul975@users.noreply.github.com
- **Project Maintainer**: [@mukul975](https://github.com/mukul975)
- **GitHub Issues**: For non-security bugs only

## Acknowledgments

We appreciate responsible disclosure and will acknowledge security researchers who help us improve AgentDashboard's security posture.

---

**Last Updated**: 2026-02-10
**Version**: 1.0.0
