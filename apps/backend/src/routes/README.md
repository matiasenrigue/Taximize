# API Documentation

This document provides complete API documentation for the backend routes. All routes require proper authentication headers except for the authentication endpoints.

## Base URL

All API endpoints are prefixed with the base URL structure:
- Authentication: `/api/auth`
- Shifts: `/api/shifts` 
- Rides: `/api/rides`

## Authentication

Most protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

# Authentication APIs

## User Sign Up

- **Description:** Registers a new user in the system.
- **URL/Interface Path:** `/api/auth/signup`
- **Request Method:** `POST`
- **Request Body (Input)**

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| email | Body | String | Yes | The desired email address (unique). |
| username | Body | String | Yes | The username. |
| password | Body | String | Yes | The user's password (at least 8 characters). |

Example:
```json
{
  "email": "example@google.com", 
  "username": "example",
  "password": "12345678"
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `201 Created`)
    ```json
    {
        "success": true,
        "message": "User registered successfully",
        "data": {
            "userId": "60d5f2f5c7b5f2a1b8e4b3e2",
            "username": "example"
        }
    }
    ```
  
  - On Error (Status: `400 Bad Request` - e.g., email address already exists)
    ```json
    {
        "success": false,
        "error": "User with this email already exists"
    }
    ```

## User Sign In

- **Description:** Authenticates a user and returns a JWT access token.
- **URL/Interface Path:** `/api/auth/signin`
- **Request Method:** `POST`
- **Request Body (Input)**

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| email | Body | String | Yes | The registered email address. |
| password | Body | String | Yes | The user's password (at least 8 characters). |

Example:
```json
{
  "email": "example@google.com", 
  "password": "12345678"
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "User logged in successfully",
        "data": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    }
    ```
    
    **Note:** A refresh token is also set as an HTTP-only cookie for token refresh purposes.
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "Invalid email or password"
    }
    ```

## Token Refresh

- **Description:** Refreshes the access token using the HTTP-only refresh token cookie.
- **URL/Interface Path:** `/api/auth/refresh`
- **Request Method:** `POST`
- **Request Body (Input):** No request body required (uses HTTP-only cookie)

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "data": {
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        }
    }
    ```
    
  - On Error (Status: `401 Unauthorized`)
    ```json
    {
        "success": false,
        "error": "No refresh token"
    }
    ```
    
  - On Error (Status: `403 Forbidden`)
    ```json
    {
        "success": false,
        "error": "Invalid refresh token"
    }
    ```

---

# Shift APIs

All shift endpoints require authentication via Bearer token.

## Emit Signal (General Shift Management)

- **Description:** Handles general shift signals for starting, pausing, continuing, or stopping shifts.
- **URL/Interface Path:** `/api/shifts/signal`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| signal | Body | String | Yes | Signal type: 'start', 'pause', 'continue', 'stop' |
| timestamp | Body | Number | No | UTC timestamp in milliseconds (uses current time if not provided) |

Example:
```json
{
  "signal": "start",
  "timestamp": 1718275200000
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Signal accepted",
        "data": {
            "isOnShift": true,
            "shiftStart": 1718275200000,
            "isPaused": false,
            "pauseStart": null,
            "lastPauseEnd": null,
            "isOnRide": false,
            "rideStartLatitude": null,
            "rideStartLongitude": null,
            "rideDestinationAddress": null
        }
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "Cannot receive shift signal: driver has an active ride"
    }
    ```

## Start Shift

- **Description:** Starts a new shift for the authenticated driver.
- **URL/Interface Path:** `/api/shifts/start-shift`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| timestamp | Body | Number | No | UTC timestamp in milliseconds (uses current time if not provided) |

Example:
```json
{
  "timestamp": 1718275200000
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Shift started successfully, Ready to Go"
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "There is already an active Shift started"
    }
    ```

## Pause Shift

- **Description:** Pauses the current shift (so that idle time etc. is not tracked).
- **URL/Interface Path:** `/api/shifts/pause-shift`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| timestamp | Body | Number | No | UTC timestamp in milliseconds (uses current time if not provided) |

Example:
```json
{
  "timestamp": 1718278800000
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Shift paused successfully"
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "No active shift to pause or shift already paused, or driver has an active ride"
    }
    ```

## Continue Shift

- **Description:** Unpauses/Continues the current shift.
- **URL/Interface Path:** `/api/shifts/continue-shift`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| timestamp | Body | Number | No | UTC timestamp in milliseconds (uses current time if not provided) |

Example:
```json
{
  "timestamp": 1718280000000
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Shift continued successfully"
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "No paused shift to continue"
    }
    ```

## End Shift

- **Description:** Ends the current shift and returns shift statistics.
- **URL/Interface Path:** `/api/shifts/end-shift`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| timestamp | Body | Number | No | UTC timestamp in milliseconds (uses current time if not provided) |

Example:
```json
{
  "timestamp": 1718304000000
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Shift ended successfully",
        "data": {
            "totalDuration": 28800000,
            "workTime": 26000000,
            "breakTime": 2800000,
            "numBreaks": 2,
            "averageBreak": 1400000,
            "totalEarnings": 45.50
        }
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "No active shift to end, or driver has an active ride"
    }
    ```

## Get Current Shift Status

- **Description:** Returns information on the current shift status. Necessary for the web app to continue working after being closed in the middle of a shift.
- **URL/Interface Path:** `/api/shifts/current`
- **Request Method:** `GET`
- **Authentication:** Required (Bearer token)
- **Request Body (Input):** No request body required.

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "data": {
            "isOnShift": true,
            "shiftStart": 1718275200000,
            "isPaused": false,
            "pauseStart": null,
            "lastPauseEnd": 1718278800000,
            "isOnRide": false,
            "rideStartLatitude": null,
            "rideStartLongitude": null,
            "rideDestinationAddress": null
        }
    }
    ```
    
    **Response Fields:**
    - `isOnShift` (boolean): Whether driver is currently on shift
    - `shiftStart` (number|null): UTC timestamp when shift started
    - `isPaused` (boolean): Whether shift is currently paused
    - `pauseStart` (number|null): UTC timestamp when current pause started
    - `lastPauseEnd` (number|null): UTC timestamp when last pause ended
    - `isOnRide` (boolean): Whether driver is currently on a ride
    - `rideStartLatitude` (number|null): Starting latitude of current ride
    - `rideStartLongitude` (number|null): Starting longitude of current ride
    - `rideDestinationAddress` (string|null): Destination address of current ride

---

# Ride APIs

All ride endpoints require authentication via Bearer token.

## Evaluate Ride

- **Description:** Returns a ride score based on ML prediction from start and destination coordinates.
- **URL/Interface Path:** `/api/rides/evaluate-ride`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| start_latitude | Body | Number | Yes | Starting point latitude |
| start_longitude | Body | Number | Yes | Starting point longitude |
| destination_latitude | Body | Number | Yes | Destination latitude |
| destination_longitude | Body | Number | Yes | Destination longitude |

Example:
```json
{
  "start_latitude": 53.349805,
  "start_longitude": -6.26031,
  "destination_latitude": 53.3437935,
  "destination_longitude": -6.2545726
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "rating": 4
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "Invalid coordinates provided"
    }
    ```

## Start Ride

- **Description:** Starts a new passenger ride. The backend stores the start and destination locations as well as the start time for fare calculation.
- **URL/Interface Path:** `/api/rides/start-ride`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| start_latitude | Body | Number | Yes | Starting point latitude |
| start_longitude | Body | Number | Yes | Starting point longitude |
| destination_latitude | Body | Number | Yes | Destination latitude |
| destination_longitude | Body | Number | Yes | Destination longitude |

Example:
```json
{
  "start_latitude": 53.349805,
  "start_longitude": -6.26031,
  "destination_latitude": 53.3437935,
  "destination_longitude": -6.2545726
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Ride started successfully",
        "data": {
            "rideId": "ride_abc123",
            "startTime": "2025-06-13T11:30:00Z",
            "predicted_score": 4
        }
    }
    ```
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "Cannot start ride—either no active shift or another ride in progress"
    }
    ```

## Get Ride Status

- **Description:** Returns a summary of the current ride. Used to display a summary modal in the frontend. The destination can be overridden as the final destination could differ from the originally planned destination.
- **URL/Interface Path:** `/api/rides/get-ride-status`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| destination_latitude | Body | Number | No | Override destination latitude (if different from original) |
| destination_longitude | Body | Number | No | Override destination longitude (if different from original) |

Example:
```json
{
  "destination_latitude": 53.340123,
  "destination_longitude": -6.262321
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "data": {
            "rideId": "ride_abc123",
            "start_latitude": 53.349805,
            "start_longitude": -6.26031,
            "current_destination_latitude": 53.340123,
            "current_destination_longitude": -6.262321,
            "elapsed_time_ms": 900000,
            "distance_km": 4.2,
            "estimated_fare_cents": 1250
        }
    }
    ```
    
    **Response Fields:**
    - `rideId` (string): Unique identifier for the ride
    - `start_latitude` (number): Starting point latitude
    - `start_longitude` (number): Starting point longitude
    - `current_destination_latitude` (number): Current destination latitude
    - `current_destination_longitude` (number): Current destination longitude
    - `elapsed_time_ms` (number): Time elapsed since ride started (in milliseconds)
    - `distance_km` (number): Estimated distance in kilometers
    - `estimated_fare_cents` (number): Estimated fare in cents
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "No active ride or invalid coordinates"
    }
    ```

## End Ride

- **Description:** Ends the current ride and updates the driver's statistics.
- **URL/Interface Path:** `/api/rides/end-ride`
- **Request Method:** `POST`
- **Authentication:** Required (Bearer token)

| Parameter | Type | Data Type | Required | Description |
| --- | --- | --- | --- | --- |
| fare_cents | Body | Number | Yes | Final fare amount in cents (positive integer) |
| actual_distance_km | Body | Number | Yes | Actual distance traveled in kilometers |

Example:
```json
{
  "fare_cents": 1450,
  "actual_distance_km": 4.5
}
```

- **Response Parameters (Output)**
  - On Success (Status code: `200 OK`)
    ```json
    {
        "success": true,
        "message": "Ride ended successfully",
        "data": {
            "rideId": "ride_abc123",
            "total_time_ms": 1200000,
            "distance_km": 4.5,
            "earning_cents": 1450,
            "earning_per_min": 72.5
        }
    }
    ```
    
    **Response Fields:**
    - `rideId` (string): Unique identifier for the completed ride
    - `total_time_ms` (number): Total ride duration in milliseconds
    - `distance_km` (number): Total distance traveled in kilometers
    - `earning_cents` (number): Total earnings from the ride in cents
    - `earning_per_min` (number): Earnings per minute rate
    
  - On Error (Status: `400 Bad Request`)
    ```json
    {
        "success": false,
        "error": "No active ride to end"
    }
    ```

---

# Global Error Handling

## Unauthorized Access

- **Status Code:** `401 Unauthorized`
- **Description:** Missing or invalid authentication token
- **Response:**
  ```json
  {
      "success": false,
      "error": "Driver authentication required"
  }
  ```
- **Action:** Remove token and redirect to login `/api/auth/signin`

## Forbidden Access

- **Status Code:** `403 Forbidden`
- **Description:** Valid token but insufficient permissions
- **Action:** Redirect to homepage `/`

## Rate Limiting

- **Status Code:** `429 Too Many Requests`
- **Description:** Too many requests from the same IP address
- **Limit:** 100 requests per 15-minute window per IP

---

# Important Notes for Frontend Development

1. **Token Management:** 
   - Access tokens are returned in response body
   - Refresh tokens are set as HTTP-only cookies
   - Use the `/api/auth/refresh` endpoint to get new access tokens

2. **Error Handling:**
   - All responses include a `success` boolean field
   - Error responses include an `error` field with descriptive message
   - Success responses may include a `data` field with response data

3. **Timestamps:**
   - All timestamps are in UTC milliseconds format
   - Optional timestamp parameters default to current time if not provided

4. **Coordinates:**
   - All latitude/longitude values must be valid numbers
   - Invalid coordinates will result in 400 Bad Request errors

5. **Authentication:**
   - Include Bearer token in Authorization header for all protected routes
   - Format: `Authorization: Bearer <your_jwt_token>` 