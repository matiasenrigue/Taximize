# Shifts API Documentation

## Overview

The Shifts API manages driver work shifts, including starting, pausing, continuing, and ending shifts. It also provides endpoints to check current shift status and retrieve shift history. All endpoints require authentication.

**Base URL:** `/api/shifts`

**Authentication:** All endpoints require JWT token

## Endpoints

### 1. Start Shift

**Description:** Starts a new work shift for the authenticated driver. Prevents starting a new shift if one is already active. Optionally accepts a planned duration for the shift.

**URL:** `POST /api/shifts/start-shift`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "timestamp": 1704123600000,
  "duration": 28800000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |
| duration | number | No | Planned shift duration in milliseconds (e.g., 28800000 = 8 hours) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Shift started successfully, Ready to Go",
  "data": {}
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "There is already an active Shift started"
}
```

### Example Usage
```bash
curl -X POST http://localhost:3000/api/shifts/start-shift \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "duration": 28800000
  }'
```

---

### 2. Pause Shift

**Description:** Pauses the driver's active shift. Cannot pause if driver has an active ride or if shift is already paused. Used when drivers take breaks.

**URL:** `POST /api/shifts/pause-shift`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "timestamp": 1704127200000,
  "pauseDuration": 1800000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |
| pauseDuration | number | No | Planned pause duration in milliseconds (e.g., 1800000 = 30 minutes) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Shift paused successfully",
  "data": {}
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "No active shift to pause or shift already paused, or driver has an active ride"
}
```

---

### 3. Continue Shift

**Description:** Resumes a paused shift, allowing the driver to continue working after a break.

**URL:** `POST /api/shifts/continue-shift`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "timestamp": 1704129000000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Shift continued successfully",
  "data": {}
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "No paused shift to continue"
}
```

---

### 4. End Shift

**Description:** Ends the driver's active shift and marks it as completed. Calculates and returns comprehensive shift statistics including total duration, work time, break time, number of breaks, average break duration, and total earnings.

**URL:** `POST /api/shifts/end-shift`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "timestamp": 1704152400000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Shift ended successfully",
  "data": {
    "totalDuration": 28800000,
    "workTimeMs": 25200000,
    "breakTimeMs": 3600000,
    "numBreaks": 2,
    "averageBreak": 1800000,
    "totalEarnings": 125.50
  }
}
```

| Response Field | Type | Description |
|---------------|------|-------------|
| totalDuration | number | Total shift duration in milliseconds |
| workTimeMs | number | Total working time in milliseconds (excludes breaks) |
| breakTimeMs | number | Total break time in milliseconds |
| numBreaks | number | Total number of breaks taken during the shift |
| averageBreak | number | Average break duration in milliseconds |
| totalEarnings | number | Total earnings for the shift in dollars |

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "No active shift to end"
}
```

---

### 5. Skip Pause

**Description:** Registers a zero-duration pause by creating pause and continue signals with the same timestamp. Used when drivers are prompted to take a break every 3 hours but choose to continue working. This prevents the break reminder from appearing again for another 3 hours.

**URL:** `POST /api/shifts/skip-pause`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Request Body
```json
{
  "timestamp": 1704130800000
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| timestamp | number | No | Unix timestamp in milliseconds (defaults to current time) |

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Pause skipped successfully",
  "data": {}
}
```

---

### 6. Get Current Shift Status

**Description:** Retrieves the current shift status including whether the driver is on shift, paused, and if they have an active ride. Provides comprehensive shift and ride information.

**URL:** `GET /api/shifts/current`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

### Response

#### Success Response - No Active Shift (200 OK)
```json
{
  "success": true,
  "data": {
    "isOnShift": false,
    "shiftStart": null,
    "isPaused": false,
    "pauseStart": null,
    "lastPauseEnd": null,
    "duration": null,
    "pauseDuration": null,
    "isOnRide": false,
    "rideStartLatitude": null,
    "rideStartLongitude": null,
    "rideDestinationAddress": null
  }
}
```

#### Success Response - Active Shift (200 OK)
```json
{
  "success": true,
  "data": {
    "isOnShift": true,
    "shiftStart": "2024-01-02T10:00:00.000Z",
    "isPaused": false,
    "pauseStart": null,
    "lastPauseEnd": "2024-01-02T12:30:00.000Z",
    "duration": 14400000,
    "pauseDuration": 1800000,
    "isOnRide": true,
    "rideStartLatitude": 40.7128,
    "rideStartLongitude": -74.0060,
    "rideDestinationAddress": "123 Main St, New York, NY 10001"
  }
}
```

---

### 7. Debug Shift Status

**Description:** Debug endpoint for troubleshooting shift and ride issues. Provides detailed information about active shifts and rides.

**URL:** `GET /api/shifts/debug`

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
  "debug": {
    "hasActiveRide": true,
    "activeShift": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "shift_start": "2024-01-02T10:00:00.000Z",
      "shift_end": null
    },
    "shiftStatus": {
      "isOnShift": true,
      "isPaused": false
    },
    "activeRideInfo": {
      "found": true,
      "rideId": "770e8400-e29b-41d4-a716-446655440000",
      "startTime": "2024-01-02T14:30:00.000Z",
      "shiftId": "N/A"
    }
  }
}
```

---

### 8. Get All Shifts

**Description:** Retrieves all shifts for the authenticated driver, including completed and active shifts. Returns raw database records with snake_case field names.

**URL:** `GET /api/shifts`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

### Response

#### Success Response (200 OK)
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "driver_id": "880e8400-e29b-41d4-a716-446655440000",
    "shift_start": "2024-01-02T10:00:00.000Z",
    "shift_end": "2024-01-02T18:00:00.000Z",
    "total_duration_ms": 28800000,
    "work_time_ms": 25200000,
    "break_time_ms": 3600000,
    "num_breaks": 2,
    "avg_break_ms": 1800000,
    "total_rides": 15,
    "total_distance_km": 145.5,
    "total_earnings_cents": 12550,
    "planned_duration_ms": 28800000
  },
  {
    "id": "990e8400-e29b-41d4-a716-446655440000",
    "driver_id": "880e8400-e29b-41d4-a716-446655440000",
    "shift_start": "2024-01-03T09:00:00.000Z",
    "shift_end": null,
    "total_duration_ms": null,
    "work_time_ms": null,
    "break_time_ms": null,
    "num_breaks": null,
    "avg_break_ms": null,
    "total_rides": null,
    "total_distance_km": null,
    "total_earnings_cents": null,
    "planned_duration_ms": 28800000
  }
]
```

---

## Shift States

| State | Description |
|-------|-------------|
| Active | Shift is ongoing, driver can accept rides |
| Paused | Shift is temporarily paused, driver cannot accept rides |
| Completed | Shift has ended |

## Business Rules

1. **One Active Shift**: Drivers can only have one active shift at a time
2. **No Pause During Ride**: Cannot pause shift while on an active ride
3. **Pause Reminders**: System prompts drivers to take breaks every 3 hours
4. **Skip Pause**: Drivers can register a zero-duration pause to reset break timer

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid operation or state |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Access denied |
| 500 | Internal server error |