# Rides

Each ride represents a single passenger trip from pickup to destination, tracking location data, timing, earnings, and ML-predicted profitability scores. The ride system enforces strict business rules to ensure data integrity and seamless integration with shifts and driver states.

<table>
<tr>
<td><img src="../../../documentation/media/3_stars_ride.gif" alt="3 Star Ride" width="250"/></td>
<td><img src="../../../documentation/media/5_stars_ride.gif" alt="5 Star Ride" width="250"/></td>
</tr>
</table>

## Architecture

### Components

1. **Ride Model** (`ride.model.ts`)
   - Enforces unique constraint: only one active ride per shift

2. **Ride Service** (`ride.service.ts`)
   - Core business logic for ride lifecycle management: validates driver eligibility and ride constraints

3. **Ride Controller** (`ride.controller.ts`)
   - REST API endpoints for ride operations: handles coordinate validation and error responses

4. **ML Service** (`ride.mlService.ts`)
   - Integrates with machine learning API for ride scoring: Maps coordinates to NYC zones for prediction

5. **Zone Detector** (`utils/zoneDetector.ts`)
   - Determines NYC zones from GPS coordinates: Essential for ML predictions based on pickup/dropoff zones

## How It Works

### Ride Lifecycle

#### 1. Ride Evaluation: `POST /api/rides/evaluate-ride`
Before starting a ride, drivers can evaluate potential profitability:

- Maps coordinates to NYC zones
- Queries ML model for quality prediction
- Returns rating (1-5 scale) or null if ML unavailable

#### 2. Starting a Ride: `POST /api/rides/start-ride`

**Pre-conditions:**
- Driver must have an active (and not paused) shift 
- No other ride can be in progress


#### 3. During the Ride: `GET /api/rides/current`

- Used by frontend for live tracking: Returns current ride status with elapsed time

#### 4. Ending a Ride: `POST /api/rides/end-ride`

**Process:**
1. Records actual fare and distance
2. Calculate ride statistic
3. Returns complete ride metrics


### Business Rules

1. **Single Active Ride**: Database constraint ensures only one active ride per shift
2. **Shift State Validation**: Cannot start rides while paused or without active shift
3. **Coordinate Validation**: All lat/lng values must be within valid geographic bounds

