# Users Module

This module handles user-related operations and data management.

## Overview

The users module provides endpoints for retrieving authenticated user information. All endpoints require authentication via JWT token in the Authorization header.

## Endpoints

### GET /api/users/me
Retrieves the current authenticated user's information.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "createdAt": "ISO 8601 timestamp",
    "updatedAt": "ISO 8601 timestamp"
  }
}
```

## User Model

The User model includes:
- `id` - UUID primary key
- `email` - Unique email address
- `username` - Display name
- `password` - Hashed password (never exposed in API responses)
- `createdAt` - Account creation timestamp
- `updatedAt` - Last modification timestamp

## Authentication

All user endpoints require the `protect` middleware, which:
1. Extracts the JWT token from the Authorization header
2. Verifies the token signature
3. Fetches the complete user record from the database
4. Attaches the user instance to `req.user`

## Security Notes

- Passwords are automatically hashed using bcrypt before storage
- Password fields are never included in API responses
- All endpoints require valid authentication tokens