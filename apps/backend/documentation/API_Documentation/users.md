# Users API Documentation

## Overview

The Users API provides endpoints for authenticated users to manage and retrieve their profile information. All user endpoints require authentication via JWT token.

**Base URL:** `/api/users`

**Authentication:** All endpoints require a valid JWT access token

## Endpoints

### 1. Get Current User Profile

**Description:** Retrieves the profile information of the currently authenticated user. This endpoint returns basic user data excluding sensitive information like passwords. The user object is automatically loaded by the authentication middleware.

**URL:** `GET /api/users/me`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
None

#### Request Body
None

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "username": "johndoe",
    "email": "user@example.com",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-20T14:45:00.000Z"
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique user identifier (UUID) |
| username | string | User's display name |
| email | string | User's email address |
| createdAt | string | ISO 8601 timestamp of account creation |
| updatedAt | string | ISO 8601 timestamp of last profile update |

#### Error Responses

**401 Unauthorized - No Token**
```json
{
  "success": false,
  "error": "Not authorized, no token"
}
```

**401 Unauthorized - Invalid Token**
```json
{
  "success": false,
  "error": "Not authorized, token failed"
}
```

**401 Unauthorized - User Not Found**
```json
{
  "success": false,
  "error": "User not found"
}
```

**401 Unauthorized - Missing User**
```json
{
  "success": false,
  "error": "User authentication required"
}
```

These errors occur when:
- No authorization token is provided ("Not authorized, no token")
- The token is invalid, expired, or malformed ("Not authorized, token failed")
- The user associated with the token no longer exists ("User not found")
- The user object is missing in the request ("User authentication required")

### Example Usage

```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/Axios Example
```javascript
const getUserProfile = async () => {
  try {
    const response = await axios.get('/api/users/me', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    console.log('User profile:', response.data.data);
  } catch (error) {
    console.error('Failed to fetch profile:', error.response.data.error);
  }
};
```

---

## Authentication Flow

To use the Users API endpoints, you must first authenticate via the Auth API:

1. **Login** via `POST /api/auth/signin` to receive an access token
2. **Include the token** in the Authorization header for all user requests
3. **Refresh the token** via `POST /api/auth/refresh` when it expires

## Security Notes

- User passwords are never included in API responses
- All user endpoints require valid authentication
- Tokens should be stored securely (e.g., httpOnly cookies or secure storage)
- Users can only access their own profile data

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - data returned |
| 401 | Unauthorized - invalid or missing token |
| 403 | Forbidden - token valid but insufficient permissions |
| 500 | Internal server error |