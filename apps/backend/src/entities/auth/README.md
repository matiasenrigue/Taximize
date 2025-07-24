# Authentication

## Overview

The Authentication module handles user registration, login, and token management for the application. It implements a secure JWT-based authentication system with refresh tokens, providing a balance between security and user experience.

## Architecture

### Core Components

- **auth.controller.ts**: Contains the authentication logic for signup, signin, and token refresh
- **auth.routes.ts**: Defines the authentication endpoints and applies validation middleware
- **utils/generateTokens.ts**: Utility functions for creating JWT access and refresh tokens

## How It Works

### Authentication Flow

1. **User Registration (Signup)**
   - User provides email, username, and password
   - System validates input (email format, password length)
   - Checks for existing users with the same email
   - Creates new user account with hashed password
   - Returns success confirmation with user ID

2. **User Login (Signin)**
   - User provides email and password
   - System verifies credentials against stored hash
   - Generates access token (15 minutes) and refresh token (7 days)
   - Performs background cleanup of expired user data
   - Sets refresh token as HTTP-only cookie
   - Returns access token in response body

3. **Token Refresh**
   - Client sends refresh token via HTTP-only cookie
   - System verifies refresh token validity
   - Generates new access token
   - Returns new access token to client

4. **User Logout**
   - Requires authenticated user (protected endpoint)
   - Clears the refresh token cookie
   - Returns success confirmation
   - Client should discard access token

### Token Strategy

The module implements a dual-token approach:

- **Access Token**: Short-lived (15 minutes), sent in response body, used for API requests
- **Refresh Token**: Long-lived (7 days), stored as HTTP-only cookie, used only for refreshing access tokens

This design provides:
- Security through short access token lifespan
- Convenience through automatic token refresh
- Protection against XSS attacks (refresh token in HTTP-only cookie)


## Security Features

### Password Security
- Minimum password length: 8 characters
- Passwords are hashed before storage (handled by User model)
- Password comparison uses secure hashing algorithms

### Token Security
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days
- Refresh tokens stored as HTTP-only cookies
- Secure flag enabled in production
- SameSite strict policy for CSRF protection
- Separate secrets for access and refresh tokens

### Validation
- Email format validation using regex
- Required field validation
- Duplicate email prevention
- Input sanitization through validation middleware


### Environment Variables
```env
ACCESS_TOKEN_SECRET=your-access-token-secret
REFRESH_TOKEN_SECRET=your-refresh-token-secret
NODE_ENV=production|development
```

## References and Further Reading

### JWT Security Best Practices
- [Auth0: What Are Refresh Tokens and How to Use Them Securely](https://auth0.com/blog/refresh-tokens-what-are-they-and-when-to-use-them/) - Validates the 15-minute access token and 7-day refresh token approach
- [Curity: JWT Security Best Practices](https://curity.io/resources/learn/jwt-best-practices/) - Industry-standard recommendations for JWT implementation
- [RFC 8725: JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725) - Official IETF standards document


### Express.js JWT Implementation
- [Auth0 GitHub: express-jwt](https://github.com/auth0/express-jwt) - Official JWT middleware for Express.js
- [DigitalOcean: How To Use JSON Web Tokens (JWTs) in Express.js](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs) - Comprehensive guide matching this implementation pattern


### Token Strategy and Architecture
- [Baeldung: Significance of a JWT Refresh Token](https://www.baeldung.com/cs/json-web-token-refresh-token) - Explains the security benefits of dual-token approach
- [Microsoft Identity Platform: Refresh tokens](https://learn.microsoft.com/en-us/entra/identity-platform/refresh-tokens) - Enterprise-level documentation supporting refresh token patterns
