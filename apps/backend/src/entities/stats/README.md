# Driver Statistics API Documentation

This document describes the statistics endpoints available for tracking driver performance, earnings, and work patterns.

## Base URL
All statistics endpoints are prefixed with `/api/stats`

## Authentication
All endpoints require JWT authentication with driver role:
- Header: `Authorization: Bearer <token>`

## Endpoints

### 1. Get Shifts by Date Range
Returns shifts and rides for a specified number of past days.

**Endpoint:** `GET /api/stats/shifts-by-days`

**Query Parameters:**
- `days` (optional): Number of days to retrieve (default: 7)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "day": "2025-01-20T00:00:00.000Z",
      "hasRide": true,
      "shifts": [
        {
          "id": "shift-uuid",
          "startDate": "2025-01-20 08:00",
          "endDate": "2025-01-20 16:30",
          "stats": {
            "totalEarnings": 245.50,
            "totalDistance": 87.3,
            "numberOfRides": 12,
            "workTime": 480,
            "breakTime": 30
          },
          "rides": [
            {
              "id": "ride-uuid",
              "startDate": "2025-01-20 08:15",
              "endDate": "2025-01-20 08:40",
              "from": "123 Main St, Sydney",
              "to": "-33.8600, 151.2111",
              "duration": "25 minutes",
              "fare": "$35.50",
              "predictedScore": 4,
              "distanceKm": 7.5,
              "farePerMinute": "$1.42"
            }
          ]
        }
      ]
    }
  ]
}
```

### 2. Get Rides by Day of Week
Returns all shifts and rides for a specific day of the week.

**Endpoint:** `GET /api/stats/rides-by-weekday`

**Query Parameters:**
- `day` (required): Day of week (monday, tuesday, wednesday, thursday, friday, saturday, sunday)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "shift-uuid",
      "startDate": "2025-01-20 08:00",
      "endDate": "2025-01-20 16:30",
      "stats": {
        "totalEarnings": 245.50,
        "totalDistance": 87.3,
        "numberOfRides": 12,
        "workTime": 480,
        "breakTime": 30
      },
      "rides": [
        {
          "id": "ride-uuid",
          "startDate": "2025-01-20 08:15",
          "endDate": "2025-01-20 08:40",
          "from": "123 Main St, Sydney",
          "to": "-33.8600, 151.2111",
          "duration": "25 minutes",
          "fare": "$35.50",
          "predictedScore": 4,
          "distanceKm": 7.5,
          "farePerMinute": "$1.42"
        }
      ]
    }
  ]
}
```

### 3. Get Earnings Statistics
Returns earnings breakdown for a specified period.

**Endpoint:** `GET /api/stats/earnings`

**Query Parameters:**
- `view` (required): "weekly" or "monthly"
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "totalEarnings": 870.50,
    "view": "weekly",
    "startDate": "2025-01-20",
    "endDate": "2025-01-26",
    "breakdown": [
      {
        "label": "Mon",
        "date": "2025-01-20",
        "value": 175.00
      },
      {
        "label": "Tue",
        "date": "2025-01-21",
        "value": 195.00
      }
    ]
  }
}
```

### 4. Get Work Time Statistics
Returns work time breakdown showing time with passengers and idle time.

**Endpoint:** `GET /api/stats/worktime`

**Query Parameters:**
- `view` (required): "weekly" or "monthly"
- `startDate` (required): Start date in YYYY-MM-DD format
- `endDate` (required): End date in YYYY-MM-DD format

**Response:**
```json
{
  "success": true,
  "data": {
    "view": "weekly",
    "startDate": "2025-01-20",
    "endDate": "2025-01-26",
    "breakdown": [
      {
        "label": "Mon",
        "date": "2025-01-20",
        "withPassengerTime": 5.75,
        "emptyTime": 2.25
      },
      {
        "label": "Tue",
        "date": "2025-01-21",
        "withPassengerTime": 6.5,
        "emptyTime": 2.0
      }
    ]
  }
}
```

## Error Responses

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message description"
}
```

Common error codes:
- `400`: Bad Request (invalid parameters)
- `401`: Unauthorized (missing or invalid token)
- `403`: Forbidden (not a driver)
- `500`: Internal Server Error

## Notes

- All dates are handled in UTC
- Date format for shifts and rides: YYYY-MM-DD HH:MM (e.g., "2025-01-20 08:15" = January 20, 2025, 8:15 AM)
- Earnings are returned in decimal format (dollars)
- Work times are returned in hours for statistics endpoints
- Shift stats show work time in minutes for consistency with existing shift data
- Empty time represents idle time between rides within a shift
- Ride details include:
  - `predictedScore`: ML prediction score for the ride (1-5)
  - `distanceKm`: Total distance traveled in kilometers
  - `farePerMinute`: Earnings per minute in dollars
