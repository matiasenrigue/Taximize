# NYC Taxi Zone Data Processing

This directory contains the data and scripts for processing NYC taxi zone boundaries to enable zone detection in our ride-sharing application.

## Files Overview

### 1. `zone_coordinates.csv` (Source Data)
- **Source**: NYC Open Data - NYC Taxi Zones
- **Format**: CSV file with zone information including WKT geometry
- **Key Fields**:
  - `LocationID`: Unique zone identifier
  - `zone`: Human-readable zone name (e.g., "JFK Airport", "Times Square")
  - `borough`: NYC borough (Manhattan, Queens, Brooklyn, Bronx, Staten Island, EWR)
  - `geometry`: Zone boundaries in **WKT (Well-Known Text)** format
  - `centroid_lat`, `centroid_lon`: Pre-calculated center points of each zone

### 2. `process_zones_complete.py` (Processing Script)
- **Purpose**: Converts zone boundaries from NYC's coordinate system to standard GPS coordinates
- **Dependencies**: 
  - `shapely`: For parsing WKT geometry
  - `pyproj`: For coordinate system conversion
- **Install**: `pip install shapely pyproj`
- **Usage**: `python process_zones_complete.py`

### 3. `zone_coordinates_processed.json` (Output)
- **Purpose**: Pre-processed zone data ready for use in the backend
- **Format**: JSON with converted lat/lng polygons
- **Structure**:
  ```json
  {
    "id": 132,
    "name": "JFK Airport",
    "borough": "Queens",
    "centroid": {
      "lat": 40.6396,
      "lon": -73.7828
    },
    "polygons": [
      {
        "exterior": [[lon, lat], ...],
        "holes": [[[lon, lat], ...], ...]
      }
    ]
  }
  ```

## Why These Conversions Are Needed

### The Problem: Coordinate Systems

1. **NYC Data Uses State Plane Coordinates**
   - The NYC taxi zone data uses **EPSG:2263** (NAD83 / New York Long Island)
   - This is a **projected coordinate system** using US survey feet as units
   - Designed for accurate measurements in the New York area
   - Example: `(1032791.0008, 181085.0063)` in feet

2. **GPS Uses WGS84 Coordinates**
   - Standard GPS coordinates use **EPSG:4326** (WGS84)
   - This uses **latitude and longitude** in decimal degrees
   - Universal system for global positioning
   - Example: `(40.6396, -73.7828)` for JFK Airport

### The Solution: Pre-processing in Python

Instead of converting coordinates on every API request, we:

1. **Parse WKT Geometry** once using Shapely
   - WKT (Well-Known Text) is a standard format for representing geometric shapes
   - Example: `POLYGON ((x1 y1, x2 y2, x3 y3, x1 y1))`

2. **Convert Coordinates** using pyproj
   - Transform from EPSG:2263 (State Plane) to EPSG:4326 (WGS84)
   - Handles the complex math of map projections
   - Preserves accuracy while converting units

3. **Generate Pre-processed JSON**
   - Pre-converted polygons ready for point-in-polygon checks
   - No runtime conversion needed
   - Efficient for backend processing

## Backend Usage

The backend uses the processed JSON file with a simple point-in-polygon algorithm:

```typescript
// Check if a GPS coordinate is in a specific NYC taxi zone
const zone = findZoneForCoordinate(40.7580, -73.9855);
// Returns: { name: "Times Sq/Theatre District", ... }
```

This approach ensures:
- ✅ Fast zone detection (no coordinate conversion at runtime)
- ✅ Accurate boundaries (proper projection handling)
- ✅ Simple backend code (just point-in-polygon logic)
- ✅ Easy maintenance (regenerate JSON if zones change)

## Regenerating the Data

If you need to update the zone data:

1. Download the latest CSV from NYC Open Data
2. Replace `zone_coordinates.csv`
3. Run: `python process_zones_complete.py`
4. Copy the generated `zone_coordinates_processed.json` to the backend

## References

- [NYC Taxi Zones Dataset](https://data.cityofnewyork.us/Transportation/NYC-Taxi-Zones/d3c5-ddgc)
- [EPSG:2263 - NAD83 / New York Long Island](https://epsg.io/2263)
- [WKT Format Specification](https://en.wikipedia.org/wiki/Well-known_text_representation_of_geometry)
- [Shapely Documentation](https://shapely.readthedocs.io/)
- [pyproj Documentation](https://pyproj4.github.io/pyproj/)