# Middleware

This folder contains Express middleware functions that handle cross-cutting concerns like authentication, validation, and error handling across the application.

## Components

- **auth.middleware.ts** - JWT-based authentication for general users
- **driverAuth.middleware.ts** - Specialized authentication for driver endpoints
- **validation.middleware.ts** - Request validation using express-validator
- **error.middleware.ts** - Global error handling with environment-aware responses

## How It Works

### Authentication Flow
```
Request → Bearer Token Check → JWT Verification → User Lookup → Attach to req.user
```

The `protect` middleware:
1. Extracts Bearer token from Authorization header
2. Verifies JWT signature using ACCESS_TOKEN_SECRET
3. Fetches user from database using token payload
4. Attaches user instance to `req.user` for downstream use

### Driver Authentication
The `requireDriver` middleware must be used **after** the `protect` middleware:
```typescript
router.get('/driver/routes', protect, requireDriver, getDriverRoutes);
```

### Validation Chain
```typescript
router.post('/signup', signupValidation, signupController);
```
- Validation rules run first (email format, password length, etc.)
- `validateRequest` middleware checks for errors
- Returns 400 with error array if validation fails

## Error Handling

The global error handler provides environment-aware responses:
- **Development**: Full error message + stack trace
- **Production**: Generic message for 500 errors (security)
- **Test**: Full error details for debugging

Common error responses:
| Status | Message | Cause |
|--------|---------|-------|
| 401 | "Not authorized, no token" | Missing Authorization header |
| 401 | "Not authorized, token failed" | Invalid/expired JWT |
| 401 | "User not found" | Valid token but user deleted |
| 400 | Validation errors array | Input validation failed |

## Integration Points

- **User Model**: Auth middleware queries User table for each request
- **Token Generation**: Works with auth module's `generateAccessToken()`
- **Express Async Handler**: Wraps async functions for proper error handling

## Best Practices

1. **Middleware Order Matters**: Always use `protect` before `requireDriver`
2. **Token Format**: Must be `Bearer <token>` (case-sensitive)
3. **Error Status**: Set status before throwing - `res.status(401); throw new Error(...)`
4. **Validation**: Chain multiple validators for comprehensive input checking

## Security Considerations

- Stack traces hidden in production 
- Tokens verified on every request 
- Input sanitization through express-validator
- Failed auth attempts return generic messages 