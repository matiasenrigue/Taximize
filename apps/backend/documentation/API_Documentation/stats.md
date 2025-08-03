# 📊 Statistics API

## 📁 Entity Documentation
**[View Stats Entity README →](../../src/entities/stats/README.md)** *(Analytics Engine and Performance Tracking)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/stats/shifts-by-days`](#shifts-by-days) | GET | Get shift history for N days | 🔐 Bearer + Driver |
| [`/api/stats/rides-by-weekday`](#rides-by-weekday) | GET | Get rides for specific weekday | 🔐 Bearer + Driver |
| [`/api/stats/earnings`](#earnings-statistics) | GET | Earnings breakdown by period | 🔐 Bearer + Driver |
| [`/api/stats/worktime`](#work-time-analysis) | GET | Time split analysis | 🔐 Bearer + Driver |

---

## 📅 Shifts by Days

**Endpoint:** `GET /api/stats/shifts-by-days`

Retrieves shift history organized by date with ride details. Perfect for calendar views.

### 📥 Request

**Query Parameters:**
```json
{
  "days": 7
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "day": "2024-01-02T00:00:00.000Z",
      "hasRide": true,
      "shifts": [
        {
          "id": "550e8400-e29b-41d4-a716-446655440000",
          "startDate": "01/02 09:00",
          "endDate": "01/02 17:00",
          "stats": {
            "totalEarnings": 456.80,
            "totalDistance": 125.5,
            "numberOfRides": 12,
            "workTime": 420,
            "breakTime": 60
          },
          "rides": [
            {
              "id": "ride-123",
              "startDate": "01/02 09:15",
              "endDate": "01/02 09:45",
              "from": "123 Main St, New York, NY",
              "to": "40.7580, -73.9855",
              "duration": "30 minutes",
              "fare": "$32.50",
              "predictedScore": 4.5,
              "distanceKm": 8.2,
              "farePerMinute": "$1.08"
            }
          ]
        }
      ]
    }
  ]
}
```

### 🚀 Performance Note
Uses Redis caching (5-minute TTL) to reduce database load.

---

## 📆 Rides by Weekday

**Endpoint:** `GET /api/stats/rides-by-weekday`

Analyzes ride patterns for specific weekdays. Helps identify weekly trends.

### 📥 Request

**Query Parameters:**
```json
{
  "day": "monday"
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "startDate": "01/08 09:00",
      "endDate": "01/08 17:00",
      "stats": {
        "totalEarnings": 245.50,
        "totalDistance": 85.5,
        "numberOfRides": 8,
        "workTime": 420,
        "breakTime": 60
      },
      "rides": [
        {
          "id": "770e8400-e29b-41d4-a716-446655440000",
          "startDate": "01/08 14:30",
          "endDate": "01/08 15:00",
          "from": "123 Main St, New York, NY",
          "to": "40.7128, -74.0060",
          "duration": "30 minutes",
          "fare": "$24.50",
          "predictedScore": 4.2,
          "distanceKm": 8.5,
          "farePerMinute": "$0.82"
        }
      ]
    }
  ]
}
```

### ❌ Error Response (400)

```json
{
  "success": false,
  "error": "Invalid day of week. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday"
}
```

---

## 💰 Earnings Statistics

**Endpoint:** `GET /api/stats/earnings`

Provides earnings analytics with daily breakdown. Supports weekly and monthly views.

### 📥 Request

**Query Parameters:**
```json
{
  "view": "weekly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 📤 Weekly View Response (200)

```json
{
  "success": true,
  "data": {
    "totalEarnings": 3245.00,
    "view": "weekly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "breakdown": [
      {
        "label": "Mon",
        "date": "2024-01-01",
        "value": 823.00
      },
      {
        "label": "Tue",
        "date": "2024-01-02",
        "value": 456.80
      },
      {
        "label": "Wed",
        "date": "2024-01-03",
        "value": 612.50
      }
    ]
  }
}
```

### 📤 Monthly View Response (200)

```json
{
  "success": true,
  "data": {
    "totalEarnings": 19456.00,
    "view": "monthly",
    "startDate": "2024-01-01",
    "endDate": "2024-06-30",
    "breakdown": [
      {
        "label": "1",
        "date": "2024-01-01",
        "value": 823.00
      },
      {
        "label": "15",
        "date": "2024-01-15",
        "value": 952.00
      },
      {
        "label": "31",
        "date": "2024-01-31",
        "value": 589.50
      }
    ]
  }
}
```

### 📊 View Options
- **weekly**: Days labeled Mon-Sun
- **monthly**: Days labeled by date (1-31)

---

## ⏱️ Work Time Analysis

**Endpoint:** `GET /api/stats/worktime`

Analyzes time split between passenger rides and waiting time.

### 📥 Request

**Query Parameters:**
```json
{
  "view": "weekly",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31"
}
```

### 📤 Success Response (200)

```json
{
  "success": true,
  "data": {
    "view": "weekly",
    "startDate": "2024-01-01",
    "endDate": "2024-01-31",
    "breakdown": [
      {
        "label": "Mon",
        "date": "2024-01-01",
        "withPassengerTime": 6.5,
        "emptyTime": 1.5
      },
      {
        "label": "Tue",
        "date": "2024-01-02",
        "withPassengerTime": 7.0,
        "emptyTime": 1.0
      }
    ]
  }
}
```
