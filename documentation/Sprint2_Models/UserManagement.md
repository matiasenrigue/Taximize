# User Management API Documentation

> Status: **MISSING IMPLEMENTATION** ⚠️
> These APIs are called by the frontend but are not implemented in the backend

## Overview

The frontend application (`useUser.ts` hook) expects the following user management APIs, but they are not implemented in the backend. This creates a critical misalignment where all user profile functionality will fail.

## Required API Endpoints

### **GET** `/api/user`

Get current user profile information.

* **Authentication**: Required (Bearer token)
* **Response**:
  * **200 OK**
    ```json
    {
      "id": "uuid",
      "username": "string",
      "email": "string",
      "createdAt": "ISO date string",
      "updatedAt": "ISO date string"
    }
    ```
  * **401 Unauthorized** - Invalid or missing token
  * **404 Not Found** - User not found

### **DELETE** `/api/user`

Delete the current user account.

* **Authentication**: Required (Bearer token)
* **Response**:
  * **200 OK**
    ```json
    {
      "success": true,
      "message": "User deleted successfully"
    }
    ```
  * **401 Unauthorized** - Invalid or missing token
  * **404 Not Found** - User not found

### **PUT** `/api/user/email`

Update user email address.

* **Authentication**: Required (Bearer token)
* **Body**:
  ```json
  {
    "email": "new@example.com"
  }
  ```
* **Validations**:
  * Email must be valid format
  * Email must be unique
* **Response**:
  * **200 OK**
    ```json
    {
      "success": true,
      "message": "User email updated successfully"
    }
    ```
  * **400 Bad Request** - Invalid email or email already exists
  * **401 Unauthorized** - Invalid or missing token

### **PUT** `/api/user/username`

Update username.

* **Authentication**: Required (Bearer token)
* **Body**:
  ```json
  {
    "username": "newusername"
  }
  ```
* **Validations**:
  * Username must be provided
  * Username must be unique (if enforced)
* **Response**:
  * **200 OK**
    ```json
    {
      "success": true,
      "message": "Username updated successfully"
    }
    ```
  * **400 Bad Request** - Invalid username
  * **401 Unauthorized** - Invalid or missing token

### **PUT** `/api/user/password`

Update user password.

* **Authentication**: Required (Bearer token)
* **Body**:
  ```json
  {
    "password": "newSecurePassword123"
  }
  ```
* **Validations**:
  * Password must be at least 8 characters
* **Response**:
  * **200 OK**
    ```json
    {
      "success": true,
      "message": "Password updated successfully"
    }
    ```
  * **400 Bad Request** - Invalid password
  * **401 Unauthorized** - Invalid or missing token

## Implementation Status

| Endpoint | Frontend Usage | Backend Implementation | Documentation |
|----------|----------------|----------------------|---------------|
| `GET /api/user` | ✅ Used in `useUser.ts` | ❌ Missing | ✅ This document |
| `DELETE /api/user` | ✅ Used in `deleteUser()` | ❌ Missing | ✅ This document |
| `PUT /api/user/email` | ✅ Used in `updateUserEmail()` | ❌ Missing | ✅ This document |
| `PUT /api/user/username` | ✅ Used in `updateUsername()` | ❌ Missing | ✅ This document |
| `PUT /api/user/password` | ✅ Used in `updateUserPassword()` | ❌ Missing | ✅ This document |

## Impact

- All user profile functionality is broken
- Profile page will not load user data
- Users cannot update their profile information
- Account deletion functionality does not work

## Recommendations

1. **Implement user management routes and controllers** in the backend
2. **Add user routes to app.ts** under `/api/user/*`
3. **Create integration tests** for these endpoints
4. **Update existing documentation** to include these APIs

## Related Files

### Frontend
- `/apps/frontend/hooks/useUser.ts` - Contains all user management logic
- `/apps/frontend/app/[lang]/account/profile/page.tsx` - Profile page using these APIs

### Backend (Missing)
- Need: `/apps/backend/src/entities/users/user.routes.ts`
- Need: `/apps/backend/src/entities/users/user.controller.ts`
- Exists: `/apps/backend/src/entities/users/user.model.ts`