> Last update: 16/06/25

## Schema

### USER

#### Table: `users`

* **id** (UUID, PK, default UUIDV4)
* **email** (string, unique, not null; validated as email)
* **username** (string, not null)
* **password** (string, not null; stored as bcrypt hash, min length 8)
* **created\_at**, **updated\_at** (timestamps, underscored in Postgres)

---

## API: Authentication Routes

All routes are mounted under **`/api/auth`**.

| Route      | HTTP Method | Middleware    | Controller | Description                                                     |
| ---------- | ----------- | ------------- | ---------- | --------------------------------------------------------------- |
| `/signup`  | POST        | —             | `signup`   | Register a new user                                             |
| `/signin`  | POST        | —             | `signin`   | Authenticate user; issue access & refresh tokens                |
| `/refresh` | POST        | cookie-parser | `refresh`  | Swap valid refresh token (HttpOnly cookie) for new access token |


---

## Controllers

* **`authController.signup`**

  * Input validation → check existing user → `User.create()` → return 201
* **`authController.signin`**

  * Lookup by email → `user.matchPassword()` → generate tokens → set cookie → return 200
* **`authController.refresh`**

  * Read & verify cookie → new access token → return 200

All wrapped with `express-async-handler` to catch errors and forward to `errorMiddleware`.

---

## Middleware

* **`authMiddleware.protect`**

  * Checks `Authorization: Bearer <token>` header
  * Verifies JWT → looks up `User.findByPk(id)` → attaches `req.user`

* **`errorMiddleware.errorHandler`**
  * Catches thrown errors, sends JSON `{ success: false, error: err.message }`

---

## Models

* **`userModel.ts`**

  * Defines `User` class extends Sequelize `Model`
  * Hooks:

    * **beforeSave**: hash password when changed
  * Instance method:

    * `matchPassword(entered: string): Promise<boolean>`

---

## Utils

* **`generateTokens.ts`**

  * `generateAccessToken(id: string)`: JWT 15 m with `ACCESS_TOKEN_SECRET`
  * `generateRefreshToken(id: string)`: JWT 7 d with `REFRESH_TOKEN_SECRET`

---


### Request / Response Details

#### **POST** `/api/auth/signup`

* **Body**:

  ```json
  {
    "email":    "user@example.com",
    "username": "myname",
    "password": "verySecure123"
  }
  ```
* **Validations**:

  * All fields required
  * `email` must match `/^\S+@\S+\.\S+$/`
  * `password.length >= 8`
* **Responses**:

  * **201 Created**

    ```json
    {
      "success": true,
      "message": "User registered successfully",
      "data": {
        "userId":   "<uuid>",
        "username": "myname"
      }
    }
    ```
  * **400 Bad Request** (missing fields / invalid email or password)
  * **400 Bad Request** (email already exists)

#### **POST** `/api/auth/signin`

* **Body**:

  ```json
  {
    "email":    "user@example.com",
    "password": "verySecure123"
  }
  ```
* **Behavior**:

  1. Verify credentials via `User.matchPassword()` (bcrypt).
  2. On success, generate

     * **Access Token** (15 m expiry, signed with `ACCESS_TOKEN_SECRET`)
     * **Refresh Token** (7 d expiry, signed with `REFRESH_TOKEN_SECRET`)
  3. Set refresh token in **HttpOnly** cookie (path `/api/auth/refresh`).
  4. Return access token in JSON.
* **Responses**:

  * **200 OK** with `{ success: true, data: { token: "<jwt>" } }`
  * **400 Bad Request** on invalid creds or missing fields

#### **POST** `/api/auth/refresh`

* **Cookies**: must include `refreshToken`
* **Behavior**:

  1. Read `req.cookies.refreshToken`.
  2. Verify via `jsonwebtoken.verify(...)`.
  3. Issue new access token (`generateAccessToken(id)`).
* **Responses**:

  * **200 OK** with `{ success: true, data: { token: "<jwt>" } }`
  * **401** if missing cookie
  * **403** if token invalid

---

## API: User Routes

All routes are mounted under **`/api/users`** and require authentication via JWT token.

| Route         | HTTP Method | Middleware  | Controller    | Description                          |
| ------------- | ----------- | ----------- | ------------- | ------------------------------------ |
| `/me/stats`   | GET         | protect     | `getMyStats`  | Get user statistics (total rides)    |

### Request / Response Details

#### **GET** `/api/users/me/stats`

* **Headers**:
  ```
  Authorization: Bearer <access_token>
  ```
* **Behavior**:
  1. Authenticate user via JWT token
  2. Count total non-deleted rides for the authenticated user
  3. Return statistics object
* **Responses**:
  * **200 OK**
    ```json
    {
      "success": true,
      "data": {
        "totalRides": 42
      }
    }
    ```
  * **401 Unauthorized** (missing or invalid token)


