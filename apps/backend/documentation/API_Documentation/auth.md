# 🔐 Authentication API

## 📁 Entity Documentation
**[View Auth Entity README →](../../src/entities/auth/README.md)** *(Architecture, Components, and Implementation Details)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/auth/signup`](#user-registration) | POST | Register new user account | ❌ |
| [`/api/auth/signin`](#user-login) | POST | Login and get access token | ❌ |
| [`/api/auth/refresh`](#refresh-token) | POST | Refresh expired access token | 🍪 Cookie |

---

## 🚀 User Registration

**Endpoint:** `POST /api/auth/signup`

Creates a new user account with email, username, and password validation.

### 📥 Request

```json
{
  "email": "user@example.com",
  "username": "johndoe",
  "password": "securePassword123"
}
```

### 📤 Success Response (201)

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

### ❌ Error Response (400)

```json
{
  "success": false,
  "error": "User with this email already exists"
}
```

### 🔍 Validation Rules
- **Email**: Required, valid format, normalized to lowercase
- **Username**: Required, minimum 3 characters
- **Password**: Required, minimum 8 characters

---

## 🔑 User Login

**Endpoint:** `POST /api/auth/signin`

Authenticates user and returns JWT access token. Sets refresh token as HTTP-only cookie.

### 📥 Request

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 🍪 Cookie Set
- **Name**: `refreshToken`
- **Path**: `/api/auth/refresh`
- **Expiry**: 7 days
- **Flags**: HttpOnly, Secure (production), SameSite=strict

### ❌ Error Response (400)

```json
{
  "success": false,
  "error": "Invalid email or password"
}
```

### 🧹 Side Effects
- Triggers background cleanup of expired shifts and rides
- Sets refresh token cookie for automatic token renewal

---

## 🔄 Refresh Token

**Endpoint:** `POST /api/auth/refresh`

Uses refresh token from cookie to generate new access token when current token expires.

### 📥 Request

No body required - refresh token sent automatically via cookie

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### ❌ Error Response (401)

```json
{
  "success": false,
  "error": "No refresh token"
}
```

### ❌ Error Response (403)

```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```
