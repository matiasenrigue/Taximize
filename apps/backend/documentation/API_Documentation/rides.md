# Rides API Documentation

## Overview

The Rides API manages ride operations including ride evaluation, starting rides, checking ride status, and ending rides with fare calculation. All endpoints require authentication. Rides must be performed during an active shift.

**Base URL:** `/api/rides`

**Authentication:** All endpoints require JWT token

## Endpoints

### 1. Evaluate Ride

**Description:** Evaluates ride coordinates using ML prediction to get a quality score. This helps drivers assess potential rides before accepting them. The score is on a 1-5 scale indicating the predicted ride quality.

**URL:** `POST /api/rides/evaluate-ride`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "startLatitude": 40.7128,
  "startLongitude": -74.0060,
  "destinationLatitude": 40.7580,
  "destinationLongitude": -73.9855
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| startLatitude | number | Yes | Pickup location latitude |
| startLongitude | number | Yes | Pickup location longitude |
| destinationLatitude | number | Yes | Destination latitude |
| destinationLongitude | number | Yes | Destination longitude |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "rating": 4.2
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| rating | number | ML predicted score (1-5 scale) |

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid coordinates"
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/rides/evaluate-ride \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "startLatitude": 40.7128,
    "startLongitude": -74.0060,
    "destinationLatitude": 40.7580,
    "destinationLongitude": -73.9855
  }'
```

---

### 2. Start Ride

**Description:** Starts a new ride for the driver. Requires an active shift that is not paused and validates that no other ride is currently in progress. Stores ride coordinates, address, and predicted score for tracking.

**URL:** `POST /api/rides/start-ride`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "startLatitude": 40.7128,
  "startLongitude": -74.0060,
  "destinationLatitude": 40.7580,
  "destinationLongitude": -73.9855,
  "address": "123 Main St, New York, NY 10001",
  "predictedScore": 4.2,
  "timestamp": 1704156000000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| startLatitude | number | Yes | Pickup location latitude |
| startLongitude | number | Yes | Pickup location longitude |
| destinationLatitude | number | Yes | Destination latitude |
| destinationLongitude | number | Yes | Destination longitude |
| address | string | Yes | Destination address (will be trimmed) |
| predictedScore | number | No | ML predicted score from evaluate endpoint (can be null if ML service is unavailable) |
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Ride started successfully",
  "data": {
    "rideId": "123e4567-e89b-12d3-a456-426614174000",
    "startTime": "2024-01-02T15:20:00.000Z",
    "startLocation": {
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "destination": {
      "latitude": 40.7580,
      "longitude": -73.9855,
      "address": "123 Main St, New York, NY 10001"
    },
    "predictedScore": 4.2
  }
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "No active shift found"
}
```

#### Error Response - Ride Already Active (400 Bad Request)
```json
{
  "success": false,
  "error": "Another ride is already in progress. Please end the current ride first."
}
```

#### Error Response - Shift Paused (400 Bad Request)
```json
{
  "success": false,
  "error": "Cannot start ride while on break. Please continue your shift first."
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/rides/start-ride \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "startLatitude": 40.7128,
    "startLongitude": -74.0060,
    "destinationLatitude": 40.7580,
    "destinationLongitude": -73.9855,
    "address": "123 Main St, New York, NY 10001",
    "predictedScore": 4.2
  }'
```

---

### 3. Get Current Ride Status

**Description:** Retrieves the status and details of the driver's current active ride. Returns ride information including start time, locations, and destination.

**URL:** `GET /api/rides/current`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "rideId": "123e4567-e89b-12d3-a456-426614174000",
    "startTime": "2024-01-02T15:20:00.000Z",
    "startLatitude": 40.7128,
    "startLongitude": -74.0060,
    "destinationLatitude": 40.7580,
    "destinationLongitude": -73.9855,
    "address": "123 Main St, New York, NY 10001",
    "predictedScore": 4.2,
    "status": "in_progress"
  }
}
```

#### Error Response - No Active Ride (404 Not Found)
```json
{
  "success": false,
  "error": "No active ride found"
}
```

### Example Usage
```bash
curl -X GET http://localhost:3000/api/rides/current \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. End Ride

**Description:** Ends the current active ride and calculates final metrics including duration, earnings, and distance. Records the fare amount and actual distance traveled.

**URL:** `POST /api/rides/end-ride`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "fareCents": 2450,
  "actualDistanceKm": 8.5,
  "timestamp": 1704157800000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fareCents | number | Yes | Total fare amount in cents (e.g., 2450 = $24.50) |
| actualDistanceKm | number | Yes | Actual distance traveled in kilometers |
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Ride ended successfully",
  "data": {
    "rideId": "123e4567-e89b-12d3-a456-426614174000",
    "duration": 1800000,
    "durationMinutes": 30,
    "fareCents": 2450,
    "fareAmount": "$24.50",
    "actualDistanceKm": 8.5,
    "startTime": "2024-01-02T15:20:00.000Z",
    "endTime": "2024-01-02T15:50:00.000Z",
    "earningPerMin": 82
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| rideId | string | Unique ride identifier |
| duration | number | Ride duration in milliseconds |
| durationMinutes | number | Ride duration in minutes |
| fareCents | number | Total fare in cents |
| fareAmount | string | Formatted fare amount |
| actualDistanceKm | number | Distance traveled in kilometers |
| startTime | string | ISO 8601 timestamp of ride start |
| endTime | string | ISO 8601 timestamp of ride end |
| earningPerMin | number | Earnings per minute in cents |

#### Error Response - No Active Ride (404 Not Found)
```json
{
  "success": false,
  "error": "No active ride found"
}
```

#### Error Response - Ride Already Ended (400 Bad Request)
```json
{
  "success": false,
  "error": "Ride has already been ended"
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/rides/end-ride \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "fareCents": 2450,
    "actualDistanceKm": 8.5
  }'
```

---

## Ride Flow

1. **Evaluate Ride** - Get ML prediction score for ride quality
2. **Start Ride** - Begin tracking the ride with coordinates and predicted score
3. **Monitor Status** - Check current ride details during the trip
4. **End Ride** - Complete the ride with fare and distance information

## Business Rules

1. **Active Shift Required**: Rides can only be started during an active shift that is not paused
2. **One Ride at a Time**: Drivers cannot have multiple concurrent rides
3. **Sequential Operations**: Must start ride before ending it
4. **Coordinate Validation**: All coordinates must be valid latitude/longitude pairs (-90 to 90 for latitude, -180 to 180 for longitude)
5. **Fare in Cents**: All monetary values are stored in cents to avoid floating-point issues
6. **ML Score Validation**: Predicted scores must be between 0 and 1 (scaled to 1-5 for display)
7. **Positive Values**: Fare and distance values must be positive numbers

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid data or business rule violation |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Not authorized |
| 404 | Not Found - No active ride |
| 500 | Internal server error |