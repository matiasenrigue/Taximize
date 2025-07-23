# Authentication API Documentation

## Overview

The Authentication API handles user registration, login, and token refresh functionality. All authentication endpoints are publicly accessible but return JWT tokens for authenticated access to other API endpoints.

**Base URL:** `/api/auth`

### Key Features:
- Input validation using express-validator middleware
- Dual-token authentication (access token + refresh token)
- Secure HTTP-only cookies for refresh tokens
- Automatic cleanup of expired data on login
- Email normalization and input sanitization

## Endpoints

### 1. User Registration (Sign Up)

**Description:** Creates a new user account in the system. Validates email format and password strength before creating the user.

**URL:** `POST /api/auth/signup`

**Authentication:** Not required

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Content-Type | string | Yes | Must be `application/json` |

#### Request Body
```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Valid email address (will be normalized) |
| username | string | Yes | Unique username (minimum 3 characters) |
| password | string | Yes | Minimum 8 characters |

### Response

#### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe"
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

#### Validation Error Response (400 Bad Request)
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Email is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securePassword123"
  }'
```

---

### 2. User Login (Sign In)

**Description:** Authenticates a user with email and password. Returns an access token and sets a refresh token as an HTTP-only cookie. Also triggers background cleanup of expired shifts and rides for the user.

**URL:** `POST /api/auth/signin`

**Authentication:** Not required

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Content-Type | string | Yes | Must be `application/json` |

#### Request Body
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | Registered email address (will be normalized) |
| password | string | Yes | User's password |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Note:** A refresh token is also set as an HTTP-only cookie with the following properties:
- Name: `refreshToken`
- Path: `/api/auth/refresh`
- Expiry: 7 days
- HttpOnly: true
- Secure: true (in production)
- SameSite: strict

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

#### Validation Error Response (400 Bad Request)
```json
{
  "success": false,
  "errors": [
    {
      "type": "field",
      "value": "",
      "msg": "Email is required",
      "path": "email",
      "location": "body"
    }
  ]
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

---

### 3. Refresh Access Token

**Description:** Uses the refresh token stored in HTTP-only cookie to generate a new access token. This endpoint is used when the access token expires.

**URL:** `POST /api/auth/refresh`

**Authentication:** Requires valid refresh token in cookie

### Request Parameters

#### Headers
No additional headers required (cookie is sent automatically by browser)

#### Cookies
| Cookie | Type | Required | Description |
|--------|------|----------|-------------|
| refreshToken | string | Yes | Valid refresh token (automatically sent) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### Error Response (401 Unauthorized)
```json
{
  "success": false,
  "error": "No refresh token"
}
```

#### Error Response (403 Forbidden)
```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

### Example Usage
```bash
# Browser will automatically send the cookie
curl -X POST http://localhost:3000/api/auth/refresh \
  --cookie "refreshToken=your-refresh-token"
```

---

## Token Information

### Access Token
- Type: JWT (JSON Web Token)
- Expiry: 15 minutes
- Usage: Include in Authorization header as `Bearer <token>`

### Refresh Token
- Type: JWT stored as HTTP-only cookie
- Expiry: 7 days
- Usage: Automatically sent by browser to `/api/auth/refresh` endpoint

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 201 | User created successfully |
| 200 | Login successful / Token refreshed |
| 400 | Bad request (validation errors, user exists, wrong credentials) |
| 401 | Unauthorized (no refresh token) |
| 403 | Forbidden (invalid refresh token) |

## Validation Rules

### Signup Validation
- **Email**: Required, must be valid email format, normalized
- **Username**: Required, minimum 3 characters, trimmed and escaped
- **Password**: Required, minimum 8 characters

### Signin Validation
- **Email**: Required, must be valid email format, normalized
- **Password**: Required

### Notes
- All validation errors return a 400 status with an `errors` array containing detailed field-level error information
- Email addresses are automatically normalized (lowercase, trim whitespace)
- Username input is sanitized to prevent XSS attacks