# Hotspots

AI-powered passenger demand forecasting based on temporal and spatial patterns. The darker zones indicate higher probability of finding passengers, helping drivers optimize their positioning for maximum efficiency

<img src="../../../documentation/media/Hotspots.gif" alt="Hotspots Demo" width="200"/>


## The Caching Strategy

> ⚠️ **Important**: This is a first-implementation compromise. See [Caching Strategy: A Pragmatic First Implementation](#caching-strategy-a-pragmatic-first-implementation) for limitations and why we knowingly ship with this "not perfect" stategy

Here's the thing - ML predictions are expensive to compute, but they don't change every second. So we built a smart caching layer:

- **Fresh data window**: 1 hour
- **Fallback mechanism**: Always return *something* to the driver
- **Retry logic**: Up to 5 attempts when fetching new predictions

The flow goes like this:
1. Check if we have data from the last hour → return it if yes
2. If not, try to fetch fresh predictions from the ML API
3. If the API fails, dig up the most recent cached data (could be days old, but better than nothing)
4. Only throw an error if we have absolutely no data to show


## The API Connection

The system talks to a Flask-based ML service that:
1. Takes a UTC timestamp
2. Converts it to NYC time (because that's where the taxis are!)
3. Runs predictions based on historical patterns, weather, events, etc.
4. Returns top pickup zones

We send timestamps in ISO format: `2024-03-14T15:30:00.000Z`


## Caching Strategy: A Pragmatic First Implementation

### Why We Use Stale Cache as Fallback

We're fully aware that serving potentially days-old hotspot predictions when the ML API fails isn't ideal. In fact, it goes against the whole point of "real-time" predictions. In production, hotspot predictions that don't represent real-time conditions can actually harm driver earnings by sending them to zones that *were* busy but aren't anymore. 

### The Current Reality vs. The Ideal

**Current Implementation:**
- 1-hour cache window (way too long for rush hour dynamics)
- Falls back to ANY cached data when ML API fails
- No distinction between weekday/weekend patterns
- No time-of-day awareness in cache invalidation

**What It Should Be:**
- 10-minute cache windows during peak hours (or less!)
- 30-minute windows during off-peak
- Different cache strategies for different times/days
- Hard cutoff for stale data (e.g., never show data > X hours old)
- Graceful degradation with clear user messaging about data freshness

**MVP Philosophy**: Get something working first, optimize later