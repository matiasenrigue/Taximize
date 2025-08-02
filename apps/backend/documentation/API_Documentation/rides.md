# 🚖 Rides API

## 📁 Entity Documentation
**[View Rides Entity README →](../../src/entities/rides/README.md)** *(Architecture, Business Rules, and ML Integration)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/rides/evaluate-ride`](#evaluate-ride) | POST | Get ML quality score for potential ride | 🔐 Bearer |
| [`/api/rides/start-ride`](#start-ride) | POST | Begin tracking a new ride | 🔐 Bearer |
| [`/api/rides/current`](#get-current-ride) | GET | Check active ride status | 🔐 Bearer |
| [`/api/rides/end-ride`](#end-ride) | POST | Complete ride with fare details | 🔐 Bearer |

---

## 🎯 Evaluate Ride

**Endpoint:** `POST /api/rides/evaluate-ride`

Pre-evaluates ride profitability using ML predictions. Returns a quality score (1-5 scale) to help drivers make informed decisions.

### 📥 Request

```json
{
  "startLatitude": 40.7128,
  "startLongitude": -74.0060,
  "destinationLatitude": 40.7580,
  "destinationLongitude": -73.9855
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": {
    "rating": 4.2
  }
}
```

### 🤖 ML Integration
- Maps coordinates to NYC zones
- Returns 1-5 rating scale
- Returns `null` if ML service unavailable

---

## 🚀 Start Ride

**Endpoint:** `POST /api/rides/start-ride`

Begins tracking a new ride. Validates shift state and enforces single active ride constraint.

### ⚠️ Prerequisites
- ✅ Active shift (not paused)
- ✅ No other ride in progress
- ✅ Valid coordinates

### 📥 Request

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

### 📤 Success Response (200)

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

### ❌ Common Errors

```json
{
  "success": false,
  "error": "No active shift found"
}
```

```json
{
  "success": false,
  "error": "Another ride is already in progress. Please end the current ride first."
}
```

```json
{
  "success": false,
  "error": "Cannot start ride while on break. Please continue your shift first."
}
```

---

## 📍 Get Current Ride

**Endpoint:** `GET /api/rides/current`

Retrieves details of the active ride including elapsed time and destination.

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

### ❌ Error Response (404)

```json
{
  "success": false,
  "error": "No active ride found"
}
```

---

## 🏁 End Ride

**Endpoint:** `POST /api/rides/end-ride`

Completes the active ride, records fare/distance, and calculates earnings metrics.

### 📥 Request

```json
{
  "fareCents": 2450,
  "actualDistanceKm": 8.5,
  "timestamp": 1704157800000
}
```

### 💡 Important Notes
- **fareCents**: Use cents to avoid floating-point issues (2450 = $24.50)
- **actualDistanceKm**: Must be positive number
- **timestamp**: Optional, defaults to current time

### 📤 Success Response (200)

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

### 📊 Calculated Metrics
- **duration**: Total ride time in milliseconds
- **durationMinutes**: Human-readable duration
- **earningPerMin**: Cents earned per minute

---

## 🔄 Ride Workflow

```
1. 🎯 Evaluate Ride → Get ML quality score
2. 🚀 Start Ride → Begin tracking (if score acceptable)
3. 📍 Monitor Status → Check current ride details
4. 🏁 End Ride → Record fare and complete
```
