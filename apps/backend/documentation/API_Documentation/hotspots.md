# 🔥 Hotspots API

## 📁 Entity Documentation
**[View Hotspots Entity README →](../../src/entities/hotspots/README.md)** *(Architecture, Caching Strategy, and ML Integration)*

## 📋 Quick Reference

| Endpoint | Method | Description | Auth Required |
|----------|--------|-------------|---------------|
| [`/api/hotspots/`](#get-hotspot-predictions) | GET | Get ML-predicted high-demand zones | 🔐 Bearer |

---

## 📍 Get Hotspot Predictions

**Endpoint:** `GET /api/hotspots/`

Retrieves current ML-based predictions for high-demand taxi pickup zones. Uses intelligent caching to balance freshness with performance.

### 🔄 Caching Behavior
- **Fresh Data**: Returns immediately if < 1 hour old
- **Stale Data**: Triggers new ML prediction if > 1 hour old
- **Fallback**: Serves cached data (even days old) if ML service fails
- **Retry Logic**: Up to 5 attempts with exponential backoff

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

### 📊 Response Fields
- **zones**: Array of hotspot zones ordered by predicted demand
- **name**: Human-readable zone name
- **locationId**: Unique NYC taxi zone identifier
- **count**: Predicted number of trips from this zone

### ❌ Error Response (500)

```json
{
  "success": false,
  "message": "Failed to retrieve hotspots data",
  "data": null
}
```

### ⚠️ Important Notes
- **Always Returns Data**: Never empty - will serve stale cache rather than fail
- **Time Zone**: UTC timestamps converted to NYC time for ML predictions
- **Cache Window**: 1-hour cache acknowledged as "too long" for real-time (MVP compromise)

