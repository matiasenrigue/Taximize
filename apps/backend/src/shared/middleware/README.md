# Middleware

Express middleware functions that handle authentication, validation, and error handling across the application. These components provide security, data integrity, and consistent error responses.

## 🔧 Components

1. **Auth Middleware** (`auth.middleware.ts`)
   - JWT-based authentication for general users
   - Extracts Bearer tokens and attaches user to `req.user`

2. **Driver Auth Middleware** (`driverAuth.middleware.ts`)
   - Specialized authentication for driver-specific endpoints
   - Must be used after the main `protect` middleware

3. **Validation Middleware** (`validation.middleware.ts`)
   - Request validation using express-validator
   - Returns standardized error responses for invalid input

4. **Error Middleware** (`error.middleware.ts`)
   - Global error handling with environment-aware responses
   - Hides sensitive information in production
