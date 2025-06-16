# TDD - User Logic

## Unit Tests

### Model: `User` (src/models/userModel.ts)

* **Password hashing hook**

  * Test that when a new user is created, the password is stored as a bcrypt hash (not plain text).
  * Test that when a user is updated *without* changing the password, the existing hash remains unchanged.
  * Test that when a user is updated *with* a new password, the hook re-hashes it.

* **`matchPassword(entered: string)`**

  * Test that `matchPassword` returns `true` when given the correct plain password.
  * Test that `matchPassword` returns `false` when given an incorrect password.

* **Token generators (utils/generateTokens.ts)**

  * Test that `generateAccessToken(id)` produces a JWT containing the right user ID and expires in \~15 minutes.
  * Test that `generateRefreshToken(id)` produces a JWT containing the right user ID and expires in \~7 days.
  * Test that the access token is signed with `ACCESS_TOKEN_SECRET`.
  * Test that the refresh token is signed with `REFRESH_TOKEN_SECRET`.
  * Test that each token’s payload indeed contains the correct user ID (not just that it’s a valid JWT).

### Controller: `authController` (src/controllers/authController.ts)

* **`signup(req, res)`**

  * Test that with valid `{ email, username, password }`, it calls `User.create`, hashes the password, and returns `201` + `{ userId, username }`.
  * Test that with missing fields, it throws a validation error (400).
  * Test that with an email that already exists, it throws a duplicate-email error (400).

* **`signin(req, res)`**

  * Test that when email exists and `matchPassword` is true, it calls token generators, sets the refresh-token cookie, and returns `200` + access token in JSON.
  * Test that with a non-existent email, it throws an “invalid credentials” error (400).
  * Test that with a wrong password (matchPassword false), it throws an “invalid credentials” error (400).
  * Test that missing email or password fields produce a 400.

* **`refresh(req, res)`**

  * Test that with no `refreshToken` cookie, it throws a 401 error.
  * Test that with an invalid refresh JWT, it throws a 403 error.
  * Test that with a valid refresh JWT, it generates a new access token and returns it (200).
  * Test that a valid refresh token for a user who’s since been deleted returns a `403 Forbidden`.

### Middleware: `authMiddleware.protect`

* Test that with no `Authorization` header, it returns 401.
* Test that with a malformed header (`Bearer` missing), it returns 401.
* Test that with an invalid token, it returns 401/403 as appropriate.
* Test that with a valid token, it attaches `req.user` (loaded from DB) and calls `next()`.
* Test that an invalid-credentials error message is the same (i.e. generic) whether the email doesn’t exist or the password is wrong.
* Test that if the JWT is valid but its user ID doesn’t exist in the database, the middleware rejects with an error.

### Error Handler: `errorMiddleware.errorHandler`

* Test that when a controller throws an error, the middleware catches it and sends JSON `{ success: false, error: err.message }` with the right status code.

---

## Integration Tests

> *Run against a test database (e.g. SQLite in-memory) using your full Express app & routes.*

### **POST** `/api/auth/signup`

* Test that valid signup returns 201 and response body `{ success: true, message, data: { userId, username } }`, and user appears in the DB with hashed password.
* Test that signing up twice with the same email returns 400 + error message.
* Test that invalid email format returns 400.
* Test that password length < 8 returns 400.

### **POST** `/api/auth/signin`

* Test full flow:

  1. Create a user via the ORM
  2. Call `/signin` with correct creds → expect 200, JSON `{ token }`, and an HttpOnly cookie set at `/api/auth/refresh`.
* Test that calling `/signin` with wrong email returns 400 + `{ success: false }`.
* Test wrong password returns 400.
* Test missing fields return 400.

### **POST** `/api/auth/refresh`

* Test that without a `refreshToken` cookie, response is 401.
* Test that with a bad cookie, response is 403.
* Test that with a valid refresh token cookie, response is 200 + new access token in JSON.

### Protected Route (e.g. a dummy `/api/auth/me`)

* After signing in, call a protected endpoint with the returned access token in `Authorization: Bearer <token>` → expect 200 and user info.
* Calling the same endpoint without a token → expect 401.
* Calling with an expired or invalid token → expect 401/403.


