# Hotspots

## What Are Hotspots?

Hotspots are predicted high-demand pickup zones for taxi drivers in NYC. The system fetches real-time predictions from a machine learning API and caches them locally to reduce API calls and improve response times.

Think of it as a smart heat map that tells drivers where they're most likely to find passengers based on current conditions.

## The Caching Strategy

Here's the thing - ML predictions are expensive to compute, but they don't change every second. So we built a smart caching layer:

- **Fresh data window**: 1 hour
- **Fallback mechanism**: Always return *something* to the driver
- **Retry logic**: Up to 5 attempts when fetching new predictions

The flow goes like this:
1. Check if we have data from the last hour → return it if yes
2. If not, try to fetch fresh predictions from the ML API
3. If the API fails, dig up the most recent cached data (could be days old, but better than nothing)
4. Only throw an error if we have absolutely no data to show

## Data Structure

The hotspots data is stored as JSONB in PostgreSQL:

```json
{
  "zones": [
    {
      "name": "Times Square - Theatre District",
      "locationId": 234,
      "count": 125
    },
    {
      "name": "JFK Airport",
      "locationId": 132,
      "count": 89
    }
    // ... more zones
  ]
}
```

Each zone represents:
- `name`: Human-readable zone name
- `locationId`: NYC taxi zone ID
- `count`: Predicted number of trip requests (rounded to nearest integer)

## The API Connection

The system talks to a Flask-based ML service that:
1. Takes a UTC timestamp
2. Converts it to NYC time (because that's where the taxis are!)
3. Runs predictions based on historical patterns, weather, events, etc.
4. Returns top pickup zones

We send timestamps in ISO format: `2024-03-14T15:30:00.000Z`

## Service Methods Breakdown

### `isHotspotDataRecent()`
Quick check: "Do we have data from the last hour?" Returns the data if yes, null if no.

### `hotspotsApiCall()`
The actual API call to the ML service. Handles:
- UTC timestamp formatting
- Data transformation (ML format → our format)
- Error logging

### `fetchNewHotspotsData()`
The persistent fetcher. Will try up to 5 times to get fresh data because network hiccups happen. If successful, stores in database and returns. If all attempts fail, returns false.

### `retrieveCachedHotspotsData()`
Last resort data retrieval. Grabs the most recent hotspot data from the database, regardless of age. Because showing week-old hotspots is better than showing nothing.

### `getHotspotsData()`
The main orchestrator. This is what the controller calls. It manages the entire flow of checking freshness, fetching new data, and falling back to cache.

## Why This Design?

**No expiry cleanup needed**: Unlike shifts or rides, old hotspot data doesn't hurt anything. It's just historical predictions sitting in the database.

**Simple model**: Just an ID, JSONB data field, and timestamps. No complex relationships or state management.

**Resilient by design**: The multi-layer fallback ensures drivers always get some data, even if:
- The ML API is down
- Network issues occur  
- The prediction service is overloaded

**Performance focused**: Most requests hit the 1-hour cache, making responses nearly instant.

## API Endpoint

`GET /api/hotspots/` (Protected)

Returns:
```json
{
  "success": true,
  "data": {
    "zones": [...]
  }
}
```

Or on total failure:
```json
{
  "success": false,
  "message": "No hotspots data available",
  "data": null
}
```

## Future Considerations

The 1-hour cache window is a balance between freshness and API load. During rush hours, predictions might change faster. During quiet times, they're stable for hours. The window could be made dynamic based on time of day.

The 5-retry limit prevents infinite loops but ensures temporary network issues don't break the feature. It's a magic number that works well in practice.

The JSONB storage gives us flexibility to evolve the data structure without migrations. Maybe we'll add surge pricing predictions or weather conditions in the future - the schema can handle it.