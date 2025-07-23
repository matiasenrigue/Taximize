# Rides

## Overview

Rides are the fundamental earning units in the driver platform. Each ride represents a single passenger trip from pickup to destination, tracking location data, timing, earnings, and ML-predicted profitability scores. The ride system enforces strict business rules to ensure data integrity and seamless integration with shifts and driver states.

## Architecture

### Components

1. **Ride Model** (`ride.model.ts`)
   - Sequelize model with UUID primary key and soft deletes
   - Enforces unique constraint: only one active ride per shift
   - Stores coordinates, timing, earnings, and ML predictions

2. **Ride Service** (`ride.service.ts`)
   - Core business logic for ride lifecycle management
   - Validates driver eligibility and ride constraints
   - Integrates with Shift and ML services

3. **Ride Controller** (`ride.controller.ts`)
   - REST API endpoints for ride operations
   - Handles coordinate validation and error responses
   - Transforms between API and model formats

4. **ML Service** (`ride.mlService.ts`)
   - Integrates with machine learning API for ride scoring
   - Maps coordinates to NYC zones for prediction
   - Provides fallback behavior when ML is unavailable

5. **Zone Detector** (`utils/zoneDetector.ts`)
   - Determines NYC zones from GPS coordinates
   - Uses ray-casting algorithm for polygon detection
   - Essential for ML predictions based on pickup/dropoff zones

## How It Works

### Ride Lifecycle

#### 1. Ride Evaluation (Optional)
Before starting a ride, drivers can evaluate potential profitability:
```
POST /api/rides/evaluate-ride
```
- Maps coordinates to NYC zones
- Queries ML model for quality prediction
- Returns rating (1-5 scale) or null if ML unavailable

#### 2. Starting a Ride
```
POST /api/rides/start-ride
```
**Pre-conditions:**
- Driver must have an active shift
- Shift must not be paused
- No other ride can be in progress

**Process:**
1. Validates all coordinates are within bounds
2. Creates ride record with predicted score
3. Returns ride ID and start time

#### 3. During the Ride
```
GET /api/rides/current
```
- Returns current ride status with elapsed time
- Shows original destination coordinates
- Used by frontend for live tracking

#### 4. Ending a Ride
```
POST /api/rides/end-ride
```
**Process:**
1. Records actual fare and distance
2. Calculates earnings per minute
3. Updates shift statistics automatically
4. Returns complete ride metrics

### Business Rules

1. **Single Active Ride**: Database constraint ensures only one active ride per shift
2. **Shift State Validation**: Cannot start rides while paused or without active shift
3. **Coordinate Validation**: All lat/lng values must be within valid geographic bounds
4. **Automatic Calculations**: Earnings per minute calculated on ride completion
5. **Soft Deletes**: Rides use paranoid mode for data retention

### ML Integration

The system uses machine learning to predict ride profitability:

1. **Zone Detection**: GPS coordinates mapped to NYC zones using polygon boundaries
2. **ML Scoring**: XGBoost model predicts percentile score based on:
   - Pickup zone
   - Dropoff zone
   - Time of day
3. **Rating Conversion**: 0-1 percentile converted to 1-5 star rating
4. **Graceful Degradation**: Returns null rating if ML service fails

### Integration Points

- **ShiftService**: Validates active shift before ride operations
- **ShiftSignals**: Checks pause state to prevent rides during breaks
- **ShiftCalculations**: Auto-updates shift metrics after ride completion
- **DataAPIClient**: Connects to ML scoring service

## API Endpoints

All endpoints require authentication via `authenticateDriver` middleware:

- `POST /api/rides/evaluate-ride` - Get ML prediction for coordinates
  - Body: `{ startLatitude, startLongitude, destinationLatitude, destinationLongitude }`

- `POST /api/rides/start-ride` - Begin a new ride
  - Body: `{ startLatitude, startLongitude, destinationLatitude, destinationLongitude, address, predictedScore, timestamp? }`

- `GET /api/rides/current` - Get active ride status
  - Returns: Current ride details or error if none active

- `POST /api/rides/end-ride` - Complete the current ride
  - Body: `{ fareCents, actualDistanceKm, timestamp? }`

## Data Flow

### Starting a Ride
```
Driver Request → Controller → Validate Coordinates → Check Shift Status → 
Check Pause State → Check Active Rides → Create Ride → Return Success
```

### Ending a Ride
```
Driver Request → Controller → Find Active Ride → Calculate Metrics → 
Update Ride → Trigger Shift Recalculation → Return Summary
```

## Error Handling

Common errors and their meanings:

- `No active shift found` - Driver must start shift first
- `Cannot start ride while on break` - Driver must resume shift
- `Another ride is already in progress` - Must end current ride
- `Ride not found` - Invalid ride ID provided
- `Ride is already ended` - Cannot end completed ride

## Best Practices

1. Always validate coordinates before processing
2. Check shift and pause states before ride operations
3. Use the service layer rather than direct model access
4. Handle ML service failures gracefully
5. Maintain atomic operations for ride state changes
6. Let database constraints enforce business rules