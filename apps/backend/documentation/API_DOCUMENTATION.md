# Taxi App Backend API Documentation

## Overview
This document provides comprehensive API documentation for the Taxi App backend service.

## Base URL
```
http://localhost:5000/api
```

## Authentication
All endpoints (except auth endpoints) require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/signup
Create a new user account.
```json
Request:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

#### POST /api/auth/signin
Login with existing credentials.
```json
Request:
{
  "email": "john@example.com",
  "password": "securepassword"
}

Response:
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### Shift Endpoints

#### POST /api/shifts/start-shift
Start a new shift for the driver.
```json
Request:
{
  "timestamp": 1704067200000,  // optional, defaults to current time
  "duration": 28800000         // optional, planned duration in ms (8 hours)
}

Response:
{
  "success": true,
  "message": "Shift started successfully, Ready to Go"
}
```

#### POST /api/shifts/pause-shift
Pause the current shift.
```json
Request:
{
  "timestamp": 1704067200000,     // optional, defaults to current time
  "pauseDuration": 1800000        // optional, planned pause duration in ms (30 minutes)
}

Response:
{
  "success": true,
  "message": "Shift paused successfully"
}
```

#### POST /api/shifts/continue-shift
Continue a paused shift.
```json
Request:
{
  "timestamp": 1704067200000  // optional, defaults to current time
}

Response:
{
  "success": true,
  "message": "Shift continued successfully"
}
```

#### POST /api/shifts/end-shift
End the current shift.
```json
Request:
{
  "timestamp": 1704067200000  // optional, defaults to current time
}

Response:
{
  "success": true,
  "message": "Shift ended successfully",
  "data": {
    "totalDuration": 28800000,
    "passengerTime": 21600000,
    "pauseTime": 3600000,
    "idleTime": 3600000,
    "numBreaks": 2,
    "averageBreak": 1800000,
    "totalEarnings": 15000  // in cents
  }
}
```

#### POST /api/shifts/skip-pause
Skip a pause (registers a 0-minute pause).
```json
Request:
{
  "timestamp": 1704067200000  // optional, defaults to current time
}

Response:
{
  "success": true,
  "message": "Pause skipped successfully"
}
```

#### GET /api/shifts/current
Get current shift status.
```json
Response:
{
  "success": true,
  "data": {
    "isOnShift": true,
    "shiftStart": 1704067200000,
    "isPaused": false,
    "pauseStart": null,
    "lastPauseEnd": 1704070800000,
    "duration": 28800000,           // planned shift duration
    "pauseDuration": 1800000,       // current pause's planned duration (if paused)
    "isOnRide": false,
    "rideStartLatitude": null,
    "rideStartLongitude": null,
    "rideDestinationAddress": null
  }
}
```

#### GET /api/shifts/debug
Debug endpoint to diagnose shift and ride status issues.
```json
Response:
{
  "success": true,
  "debug": {
    "hasActiveRide": false,
    "activeShift": {
      "id": "shift-uuid",
      "start": "2024-01-01T12:00:00.000Z",
      "end": null
    },
    "shiftStatus": {
      "isOnShift": true,
      "isPaused": false
    },
    "activeRideInfo": null
  }
}
```

### Ride Endpoints

#### POST /api/rides/evaluate-ride
Evaluate a potential ride using ML prediction.
```json
Request:
{
  "startLatitude": 53.349805,
  "startLongitude": -6.260310,
  "destinationLatitude": 53.339805,
  "destinationLongitude": -6.250310
}

Response:
{
  "success": true,
  "rating": 4  // 1-5 rating
}
```

#### POST /api/rides/start-ride
Start a new ride.
```json
Request:
{
  "startLatitude": 53.349805,
  "startLongitude": -6.260310,
  "destinationLatitude": 53.339805,
  "destinationLongitude": -6.250310
}

Response:
{
  "success": true,
  "message": "Ride started successfully",
  "data": {
    "rideId": "ride-uuid",
    "startTime": 1704067200000,
    "predictedScore": 4
  }
}
```

#### GET /api/rides/current
Get current ride status.
```json
Response:
{
  "success": true,
  "data": {
    "rideId": "ride-uuid",
    "startLatitude": 53.349805,
    "startLongitude": -6.260310,
    "currentDestinationLatitude": 53.339805,
    "currentDestinationLongitude": -6.250310,
    "elapsedTimeMs": 600000,
    "destinationAddress": "123 Main St, Dublin"
  }
}
```

#### POST /api/rides/end-ride
End the current ride.
```json
Request:
{
  "fareCents": 1500,
  "actualDistanceKm": 5.2
}

Response:
{
  "success": true,
  "message": "Ride ended successfully",
  "data": {
    "rideId": "ride-uuid",
    "totalTimeMs": 600000,
    "distanceKm": 5.2,
    "earningCents": 1500,
    "earningPerMin": 150
  }
}
```

## Error Responses
All errors follow this format:
```json
{
  "success": false,
  "error": "Error message here"
}
```

Common error codes:
- 400: Bad Request - Invalid input or business rule violation
- 401: Unauthorized - Missing or invalid JWT token
- 403: Forbidden - Not authorized to access resource
- 404: Not Found - Resource not found
- 500: Internal Server Error

## Business Rules

### Shift Rules
1. Only one active shift per driver
2. Cannot start a new shift if one is already active
3. Cannot receive signals (pause/continue/stop) while on a ride
4. Must end all rides before ending shift

### Ride Rules
1. Must have an active shift to start a ride
2. Cannot start a ride while on pause
3. Only one active ride at a time
4. Cannot pause shift while on a ride

### Time Standards
- All timestamps are stored and returned in milliseconds (Unix timestamp)
- Database stores timestamps in UTC
- No explicit timezone conversion in the API

## Debug Endpoint Usage

The `/api/shifts/debug` endpoint is particularly useful for diagnosing issues where:
- The shift status shows no active ride but ending the shift fails
- There's a discrepancy between what different endpoints report
- You need to verify the actual database state

Example scenario:
```bash
# Check current status
GET /api/shifts/current
# Returns: isOnRide: false

# Try to end shift
POST /api/shifts/end-shift
# Returns: Error: "Cannot end shift while ride is in progress"

# Debug the issue
GET /api/shifts/debug
# Shows the actual state and helps identify phantom rides or state inconsistencies
```