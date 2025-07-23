# Statistics API Documentation

## Overview

The Statistics API provides comprehensive analytics for drivers including shift history, ride patterns, earnings reports, and work time analysis. All endpoints require authentication and driver authorization.

**Base URL:** `/api/stats`

**Authentication:** All endpoints require JWT token and driver role

## Endpoints

### 1. Get Shifts for Last N Days

**Description:** Retrieves shift history for the specified number of days organized by date. Returns an array of days, each containing shifts for that day along with ride details. Useful for calendar views and reviewing recent work patterns.

**URL:** `GET /api/stats/shifts-by-days`

**Authentication:** Required (Bearer token + driver role)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| days | number | No | Number of days to retrieve (default: 7) |

### Response

#### Success Response (200 OK)
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
    },
    {
      "day": "2024-01-01T00:00:00.000Z",
      "hasRide": false,
      "shifts": []
    }
  ]
}
```

### Example Usage
```bash
curl -X GET "http://localhost:3000/api/stats/shifts-by-days?days=14" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 2. Get Rides by Day of Week

**Description:** Retrieves all shifts containing rides for a specific day of the week. Returns complete shift information with filtered rides for the specified weekday. Helps identify patterns in ride frequency and earnings by weekday.

**URL:** `GET /api/stats/rides-by-weekday`

**Authentication:** Required (Bearer token + driver role)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| day | string | Yes | Day of week (monday, tuesday, wednesday, thursday, friday, saturday, sunday) |

### Response

#### Success Response (200 OK)
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
    },
    {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "startDate": "01/01 10:00",
      "endDate": "01/01 18:30",
      "stats": {
        "totalEarnings": 320.00,
        "totalDistance": 123.0,
        "numberOfRides": 10,
        "workTime": 480,
        "breakTime": 30
      },
      "rides": [
        {
          "id": "880e8400-e29b-41d4-a716-446655440000",
          "startDate": "01/01 10:15",
          "endDate": "01/01 10:45",
          "from": "456 Park Ave, New York, NY",
          "to": "40.7580, -73.9855",
          "duration": "30 minutes",
          "fare": "$32.00",
          "predictedScore": 4.7,
          "distanceKm": 12.3,
          "farePerMinute": "$1.07"
        }
      ]
    }
  ]
}
```

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "Invalid day of week. Must be one of: monday, tuesday, wednesday, thursday, friday, saturday, sunday"
}
```

### Example Usage
```bash
curl -X GET "http://localhost:3000/api/stats/rides-by-weekday?day=monday" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 3. Get Earnings Statistics

**Description:** Provides earnings analytics with daily breakdown for the specified date range. In weekly view, days are labeled by weekday (Mon-Sun). In monthly view, days are labeled by date (1-31). Returns total earnings and daily values.

**URL:** `GET /api/stats/earnings`

**Authentication:** Required (Bearer token + driver role)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| view | string | Yes | Aggregation type: "weekly" or "monthly" |
| startDate | string | Yes | Start date in YYYY-MM-DD format |
| endDate | string | Yes | End date in YYYY-MM-DD format |

### Response

#### Success Response - Weekly View (200 OK)
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
      },
      {
        "label": "Thu",
        "date": "2024-01-04",
        "value": 534.20
      },
      {
        "label": "Fri",
        "date": "2024-01-05",
        "value": 689.30
      },
      {
        "label": "Sat",
        "date": "2024-01-06",
        "value": 0
      },
      {
        "label": "Sun",
        "date": "2024-01-07",
        "value": 129.20
      }
    ]
  }
}
```

#### Success Response - Monthly View (200 OK)
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
        "label": "2",
        "date": "2024-01-02",
        "value": 456.80
      },
      {
        "label": "3",
        "date": "2024-01-03",
        "value": 612.50
      },
      {
        "label": "15",
        "date": "2024-01-15",
        "value": 952.00
      },
      {
        "label": "28",
        "date": "2024-01-28",
        "value": 734.20
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

#### Error Response (400 Bad Request)
```json
{
  "success": false,
  "error": "The 'view' parameter is required and must be one of [weekly, monthly]."
}
```

### Example Usage
```bash
curl -X GET "http://localhost:3000/api/stats/earnings?view=weekly&startDate=2024-01-01&endDate=2024-01-31" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

### 4. Get Work Time Statistics

**Description:** Analyzes work time split between time with passengers and empty time (waiting between rides). Returns daily breakdown with hours spent in each category. In weekly view, days are labeled by weekday (Mon-Sun). In monthly view, days are labeled by date (1-31).

**URL:** `GET /api/stats/worktime`

**Authentication:** Required (Bearer token + driver role)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| view | string | Yes | Aggregation type: "weekly" or "monthly" |
| startDate | string | Yes | Start date in YYYY-MM-DD format |
| endDate | string | Yes | End date in YYYY-MM-DD format |

### Response

#### Success Response - Weekly View (200 OK)
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
      },
      {
        "label": "Wed",
        "date": "2024-01-03",
        "withPassengerTime": 5.75,
        "emptyTime": 2.25
      },
      {
        "label": "Thu",
        "date": "2024-01-04",
        "withPassengerTime": 6.25,
        "emptyTime": 1.75
      },
      {
        "label": "Fri",
        "date": "2024-01-05",
        "withPassengerTime": 7.5,
        "emptyTime": 0.5
      },
      {
        "label": "Sat",
        "date": "2024-01-06",
        "withPassengerTime": 0,
        "emptyTime": 0
      },
      {
        "label": "Sun",
        "date": "2024-01-07",
        "withPassengerTime": 3.0,
        "emptyTime": 1.0
      }
    ]
  }
}
```

#### Error Response - Invalid Date Range (400 Bad Request)
```json
{
  "success": false,
  "error": "startDate must be before or equal to endDate"
}
```

### Example Usage
```bash
curl -X GET "http://localhost:3000/api/stats/worktime?view=monthly&startDate=2024-01-01&endDate=2024-06-30" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Common Parameters

### Date Formats
- All dates use YYYY-MM-DD format (e.g., "2024-01-15")
- Times are returned in ISO 8601 format with timezone

### Monetary Values
- Monetary values in responses are in decimal format (dollars)
- The `totalEarnings` field in shift stats is in dollars
- The `fare` field in rides is formatted as a string with dollar sign (e.g., "$32.50")

### Duration Values
- `workTime` and `breakTime` in shift stats are in minutes
- `duration` in rides is formatted as a human-readable string (e.g., "30 minutes")
- `withPassengerTime` and `emptyTime` in worktime stats are in hours (decimal format)

## Use Cases

1. **Performance Review**: Analyze earnings and work patterns over time
2. **Tax Preparation**: Export earnings data for specific periods
3. **Schedule Optimization**: Identify most profitable days and times
4. **Work-Life Balance**: Monitor total work hours and pause compliance

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 400 | Bad Request - Invalid parameters or date range |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Not a driver |
| 500 | Internal server error |