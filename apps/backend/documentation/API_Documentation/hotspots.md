# Hotspots API Documentation

## Overview

The Hotspots API provides real-time ML-based predictions for high-demand taxi pickup zones. It helps drivers identify areas with the highest likelihood of passenger pickups. The API uses intelligent caching to minimize calls to the ML service while providing fresh data.

**Base URL:** `/api/hotspots`

**Authentication:** All endpoints require JWT token

## Endpoints

### 1. Get Hotspot Predictions

**Description:** Retrieves current hotspot predictions showing taxi demand zones. Returns cached data if recent (less than 1 hour old), otherwise fetches fresh predictions from the ML service. If the ML service is unavailable, falls back to the most recent cached data.

**URL:** `GET /api/hotspots/`

**Authentication:** Required (Bearer token)

### Request Parameters

#### Headers
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| Authorization | string | Yes | Bearer token format: `Bearer <access_token>` |

#### Query Parameters
None

#### Request Body
None

### Response

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "zones": [
      {
        "name": "JFK Airport",
        "locationId": 132,
        "count": 145
      },
      {
        "name": "Times Square - Theatre District",
        "locationId": 234,
        "count": 128
      },
      {
        "name": "Penn Station/Madison Sq West",
        "locationId": 164,
        "count": 112
      },
      {
        "name": "Upper East Side North",
        "locationId": 236,
        "count": 98
      },
      {
        "name": "LaGuardia Airport",
        "locationId": 138,
        "count": 87
      }
    ]
  }
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| zones | array | List of hotspot zones ordered by predicted demand |
| zones[].name | string | Human-readable zone name |
| zones[].locationId | number | Unique identifier for the pickup zone |
| zones[].count | number | Predicted number of trips from this zone |

#### Error Response (500 Internal Server Error)
```json
{
  "success": false,
  "message": "Failed to retrieve hotspots data",
  "data": null
}
```

This error occurs when:
- No cached data is available
- ML service is unavailable and no fallback cache exists
- Database connection issues

### Example Usage

```bash
curl -X GET http://localhost:3000/api/hotspots/ \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### JavaScript/Axios Example
```javascript
const getHotspots = async () => {
  try {
    const response = await axios.get('/api/hotspots/', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    });
    
    const hotspots = response.data.data.zones;
    console.log(`Top hotspot: ${hotspots[0].name} with ${hotspots[0].count} predicted trips`);
  } catch (error) {
    console.error('Failed to fetch hotspots:', error.response.data.message);
  }
};
```

---

## Data Management

### Caching Strategy

1. **Fresh Data**: Data less than 1 hour old is considered fresh and returned immediately
2. **Stale Data**: Data older than 1 hour triggers a new ML prediction request
3. **Fallback**: If ML service is unavailable, returns most recent cached data regardless of age
4. **Retry Logic**: Failed ML requests are retried with exponential backoff

### ML Integration

- Predictions are fetched from a Flask-based ML API
- The ML model analyzes historical patterns, time of day, and other factors
- Predictions are updated hourly to reflect changing demand patterns

## Use Cases

1. **Driver Positioning**: Help drivers position themselves in high-demand areas
2. **Shift Planning**: Identify best times and locations to start shifts
3. **Revenue Optimization**: Maximize pickup opportunities by following demand

## Business Rules

1. **Update Frequency**: Predictions refresh every hour automatically
2. **Zone Coverage**: Covers all major NYC taxi zones
3. **Prediction Window**: Shows predicted demand for the current hour
4. **Data Availability**: Service gracefully degrades to cached data if ML is offline

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success - returns hotspot data |
| 401 | Unauthorized - invalid or missing token |
| 500 | Server error - no data available |