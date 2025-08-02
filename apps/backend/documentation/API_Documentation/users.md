# 👤 Users API

## 📁 Entity Documentation
**[View Users Entity README →](../../src/entities/users/README.md)** *(User Management and Preferences)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/users/me`](#get-user-profile) | GET | Get current user profile | 🔐 Bearer |
| [`/api/users/preferences`](#get-preferences) | GET | Get user preferences | 🔐 Bearer |
| [`/api/users/preferences`](#update-preferences) | PUT | Update user preferences | 🔐 Bearer |

---

## 🙋 Get User Profile

**Endpoint:** `GET /api/users/me`

Retrieves the authenticated user's profile information. Password fields are automatically excluded.

### 📥 Request

**Headers Required:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 📤 Success Response (200)

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

### ❌ Error Responses

```json
{
  "success": false,
  "error": "Not authorized, no token"
}
```

```json
{
  "success": false,
  "error": "Not authorized, token failed"
}
```

```json
{
  "success": false,
  "error": "User not found"
}
```

### 🔒 Security Notes
- UUID v4 primary keys
- Passwords never included in responses
- User can only access own profile

---

## ⚙️ Get Preferences

**Endpoint:** `GET /api/users/preferences`

Retrieves user's personalized settings. Returns empty object if no preferences set.

### 📥 Request

**Headers Required:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "language": "en",
    "breakWarnings": true
  }
}
```

### 📋 Preference Fields
- **theme**: UI theme ("light", "dark")
- **language**: Locale setting ("en", "es", etc.)
- **breakWarnings**: Show break reminders (boolean)

### 💡 Note
Returns `{}` if no preferences are configured.

---

## 🔧 Update Preferences

**Endpoint:** `PUT /api/users/preferences`

Updates user preferences with partial updates supported. Unspecified fields remain unchanged.

### 📥 Request

```json
{
  "theme": "dark",
  "language": "en",
  "breakWarnings": true
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": {
    "theme": "dark",
    "language": "en",
    "breakWarnings": true
  }
}
```

### ✨ Update Behavior
- All fields optional
- Partial updates supported
- Returns complete preferences object
- Existing values preserved if not specified

### ❌ Error Response (400)

```json
{
  "success": false,
  "error": "Invalid JSON format"
}
```
