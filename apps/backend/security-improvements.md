  ✅ What's Working:

  - Core security stack (Helmet, CORS, rate limiting, bcrypt, JWT) is properly implemented
  - Password hashing and JWT authentication are solid
  - Environment variables are used correctly

  ⚠️ Critical Issues:

  1. DATABASE_URL is logged in plaintext in server.ts - immediate security risk
  2. No dedicated input validation library - vulnerable to malformed inputs
  3. Error messages expose internal details in production
  4. Missing CSRF protection and request sanitization

  📋 Best Way to Apply Missing Security:

  I've created a detailed security-improvements.md file with:
  1. Immediate fixes (remove sensitive logs)
  2. Code examples for implementing validation (express-validator or Zod)
  3. Step-by-step security hardening (CSRF, sanitization, logging)
  4. Testing strategies for security features
  5. Priority-based implementation plan

  The most critical action is removing the DATABASE_URL console.log. After that, implementing proper input validation would
  be the highest priority to prevent injection attacks and malformed data issues.

# Security Improvements Action Plan

## 🚨 Immediate Actions Required

### 1. Remove Sensitive Data Logging
**File**: `src/server.ts`
```typescript
// REMOVE THIS LINE:
console.log(`DATABASE_URL: ${process.env.DATABASE_URL}`);
```

### 2. Implement Input Validation Middleware

**Option A: Using express-validator**
```bash
npm install express-validator
```

**Example implementation**:
```typescript
// src/shared/middleware/validation.middleware.ts
import { body, validationResult } from 'express-validator';

export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// In auth routes:
export const signupValidation = [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[A-Za-z])(?=.*\d)/),
  body('username').isLength({ min: 3 }).trim().escape(),
  validateRequest
];
```

**Option B: Using Zod (TypeScript-first)**
```bash
npm install zod
```

```typescript
// src/shared/schemas/auth.schema.ts
import { z } from 'zod';

export const signupSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[A-Za-z])(?=.*\d)/),
    username: z.string().min(3)
  })
});
```

### 3. Sanitize Error Messages in Production

**Update**: `src/shared/middleware/error.middleware.ts`
```typescript
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(res.statusCode || 500).json({
    message: err.message,
    ...(isDevelopment && { stack: err.stack }),
    // In production, use generic messages for internal errors
    ...((!isDevelopment && res.statusCode === 500) && { 
      message: 'Internal server error' 
    })
  });
};
```

## 📋 High Priority Improvements

### 1. Add CSRF Protection
```bash
npm install csurf
```

```typescript
// In app.ts
import csrf from 'csurf';
const csrfProtection = csrf({ cookie: true });
app.use(csrfProtection);
```

### 2. Implement Request Sanitization
```bash
npm install express-mongo-sanitize xss
```

```typescript
// In app.ts
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';

app.use(mongoSanitize()); // Prevent NoSQL injection
app.use(xss()); // Prevent XSS attacks
```

### 3. Add Security Logging
```bash
npm install winston
```

```typescript
// src/shared/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Log security events
logger.info('Login attempt', { email, ip: req.ip });
logger.warn('Failed login', { email, ip: req.ip });
```

### 4. Implement Account Security

**Add to User Model**:
```typescript
// In user.model.ts
@Column({
  type: DataType.INTEGER,
  defaultValue: 0,
})
failedLoginAttempts!: number;

@Column({
  type: DataType.DATE,
  allowNull: true,
})
lockoutUntil?: Date;

// Method to handle failed login
async handleFailedLogin() {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockoutUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 min lockout
  }
  await this.save();
}

// Check if account is locked
isLocked() {
  return this.lockoutUntil && this.lockoutUntil > new Date();
}
```

## 📊 Testing Security Improvements

### Add Security Tests
```typescript
// src/entities/auth/__tests__/security.test.ts
describe('Security Tests', () => {
  it('should reject SQL injection attempts', async () => {
    const maliciousEmail = "admin@test.com'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/auth/signin')
      .send({ email: maliciousEmail, password: 'test' });
    expect(response.status).toBe(400);
  });

  it('should lock account after 5 failed attempts', async () => {
    // Test account lockout
  });

  it('should sanitize XSS attempts', async () => {
    const xssUsername = '<script>alert("xss")</script>';
    // Test XSS prevention
  });
});
```

## 🔒 Security Checklist

- [ ] Remove all console.log statements with sensitive data
- [ ] Implement input validation on all endpoints
- [ ] Add CSRF protection
- [ ] Implement request sanitization
- [ ] Add security logging
- [ ] Implement account lockout
- [ ] Add password complexity requirements
- [ ] Sanitize error messages in production
- [ ] Update package.json with all dependencies
- [ ] Add security headers beyond Helmet defaults
- [ ] Implement API versioning
- [ ] Add rate limiting per user (not just IP)
- [ ] Audit all raw SQL queries
- [ ] Add security monitoring alerts

## 🚀 Implementation Priority

1. **Day 1**: Remove sensitive logs, add input validation
2. **Day 2**: Implement CSRF, request sanitization
3. **Day 3**: Add logging, account security
4. **Week 2**: Complete remaining items

This will bring the backend to production-ready security standards.