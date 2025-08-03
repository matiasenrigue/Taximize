# ⏰ Shifts API

## 📁 Entity Documentation
**[View Shifts Entity README →](../../src/entities/shifts/README.md)** *(Signal-Based State Management and Business Rules)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/shifts/start-shift`](#start-shift) | POST | Begin new work shift | 🔐 Bearer |
| [`/api/shifts/pause-shift`](#pause-shift) | POST | Take a break | 🔐 Bearer |
| [`/api/shifts/continue-shift`](#continue-shift) | POST | Resume after break | 🔐 Bearer |
| [`/api/shifts/end-shift`](#end-shift) | POST | Complete shift with stats | 🔐 Bearer |
| [`/api/shifts/skip-pause`](#skip-pause) | POST | Reset break reminder timer | 🔐 Bearer |
| [`/api/shifts/current`](#get-current-status) | GET | Check shift/ride status | 🔐 Bearer |
| [`/api/shifts/debug`](#debug-status) | GET | Debug shift state | 🔐 Bearer |
| [`/api/shifts/`](#get-all-shifts) | GET | List all driver shifts | 🔐 Bearer |

---

## 🚀 Start Shift

**Endpoint:** `POST /api/shifts/start-shift`

Begins a new work shift. Only one active shift allowed per driver.

### 📥 Request

```json
{
  "timestamp": 1704123600000,
  "duration": 28800000
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "message": "Shift started successfully, Ready to Go",
  "data": {}
}
```

### ❌ Error Response (400)

```json
{
  "success": false,
  "error": "There is already an active Shift started"
}
```

### 📏 Limits
- **Default Duration**: 8 hours
- **Maximum Duration**: 12 hours

---

## ⏸️ Pause Shift

**Endpoint:** `POST /api/shifts/pause-shift`

Temporarily pauses shift for breaks. Cannot pause during active ride.

### 📥 Request

```json
{
  "timestamp": 1704127200000,
  "pauseDuration": 1800000
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "message": "Shift paused successfully",
  "data": {}
}
```

### ⚠️ Validation Rules
- ❌ Cannot pause if already paused
- ❌ Cannot pause during active ride
- ✅ Optional planned duration

---

## ▶️ Continue Shift

**Endpoint:** `POST /api/shifts/continue-shift`

Resumes work after a break.

### 📥 Request

```json
{
  "timestamp": 1704129000000
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "message": "Shift continued successfully",
  "data": {}
}
```

### 🔄 Side Effects
- Saves pause period to database
- Updates break statistics

---

## 🏁 End Shift

**Endpoint:** `POST /api/shifts/end-shift`

Completes shift and calculates comprehensive statistics.

### 📥 Request

```json
{
  "timestamp": 1704152400000
}
```

### 📤 Success Response (200)

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

### 📊 Calculated Metrics
- **totalDuration**: Total shift time (ms)
- **workTimeMs**: Active work time (ms)
- **breakTimeMs**: Total break time (ms)
- **numBreaks**: Number of breaks taken
- **averageBreak**: Average break duration (ms)
- **totalEarnings**: Total earnings in dollars

### 🧹 Important Note
All shift signals are deleted after statistics are saved.

---

## ⏭️ Skip Pause

**Endpoint:** `POST /api/shifts/skip-pause`

Registers instant pause-continue to reset 3-hour break reminder.

### 📥 Request

```json
{
  "timestamp": 1704130800000
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "message": "Pause skipped successfully",
  "data": {}
}
```

### 💡 Use Case
When prompted for mandatory break after 3 hours, drivers can skip to continue working and reset the timer.

---

## 📍 Get Current Status

**Endpoint:** `GET /api/shifts/current`

Retrieves comprehensive shift and ride status.

### 📥 Request

**Headers Required:**
```json
{
  "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 📤 Response - Active Shift (200)

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

### 📤 Response - No Active Shift (200)

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

---

## 🐛 Debug Status

**Endpoint:** `GET /api/shifts/debug`

Detailed debugging information for troubleshooting.

### 📤 Success Response (200)

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

## 📋 Get All Shifts

**Endpoint:** `GET /api/shifts/`

Returns all driver shifts (active and completed).

### 📤 Success Response (200)

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
  }
]
```

---

## 🔄 State Management

### Valid State Transitions

| Current State | Valid Actions | Invalid Actions |
|--------------|---------------|-----------------|
| No shift | `start` | `pause`, `continue`, `end` |
| Active | `pause`, `end` | `start`, `continue` |
| Paused | `continue`, `end` | `start`, `pause` |

### 🚧 Additional Constraints
- 🚗 No signals during active ride
- 🔒 Single active shift per driver
- 🕐 Automatic cleanup on login
