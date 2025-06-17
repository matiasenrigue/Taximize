# Services Business Logic Documentation

This document provides comprehensive documentation of all business logic implemented in the services layer. The services contain the core business rules and operations for the ride-sharing driver application.

## Overview

The services layer consists of two main service classes:
- **ShiftService**: Manages driver shift operations, state transitions, and time tracking
- **RideService**: Manages ride operations, fare calculations, and ride lifecycle

All timestamps are handled in **UTC format** throughout the system.

---

# Shift Management (ShiftService)

## Core Business Rules

### Shift State Machine
Drivers can be in one of four shift states with specific transition rules:

| Current State | Valid Next States | Description |
|--------------|------------------|-------------|
| `null` (No shift) | `start` | Driver can only start a new shift |
| `start` (Active) | `pause`, `stop` | Driver can pause or end their shift |
| `pause` (Paused) | `continue`, `stop` | Driver can resume or end their shift |
| `continue` (Active) | `pause`, `stop` | Driver can pause or end their shift |
| `stop` (Ended) | None | Terminal state - shift is completed |

### Signal Validation Rules
- **No signals accepted during active rides**: If a driver has an active ride, they cannot change their shift state
- **Sequential validation**: Each signal is validated against the driver's current state
- **Timestamp tracking**: All state changes are timestamped for accurate time calculations

## Shift Operations

### Starting a Shift
```typescript
handleSignal(driverId: string, timestamp: number, 'start')
```
- Creates a new shift record with start time
- Records 'start' signal with timestamp
- Validates driver has no active shift

### Pausing a Shift
```typescript
handleSignal(driverId: string, timestamp: number, 'pause')
```
- Records 'pause' signal with timestamp
- Driver cannot receive ride requests while paused
- Break time starts accumulating

### Continuing a Shift
```typescript
handleSignal(driverId: string, timestamp: number, 'continue')
```
- Records 'continue' signal with timestamp
- Creates a shift pause record for the break period
- Driver becomes available for rides again

### Ending a Shift
```typescript
handleSignal(driverId: string, timestamp: number, 'stop')
```
- Records 'stop' signal with timestamp
- Calculates and saves shift statistics:
  - Total duration (in milliseconds)
  - Work time (total duration minus break time)
  - Break time (sum of all pause periods)
  - Number of breaks
  - Average break duration
- Cleans up shift signals after saving statistics

## Shift Statistics Calculation

### Break Time Calculation
- **Source**: All pause/continue signal pairs during the shift
- **Calculation**: Sum of `(continue_timestamp - pause_timestamp)` for all break periods
- **Filtering**: Only includes breaks that fall within the shift timeframe

### Work Time Calculation
```
Work Time = Total Shift Duration - Total Break Time
```

### Average Break Duration
```
Average Break = Total Break Time / Number of Breaks
```

## Expired Shift Management

### Automatic Cleanup Policy
**Trigger**: Shifts older than **48 hours** without a 'stop' signal

**Business Rules**:
1. **With Rides**: If the shift has recorded rides:
   - Generate synthetic 'stop' signal at the end time of the last ride
   - Save shift with calculated statistics up to that point
   - Preserves driver's work record and earnings

2. **Without Rides**: If no rides were recorded:
   - Delete the entire shift record and associated signals
   - Assumes the shift was accidentally started or not used

**Implementation**:
```typescript
manageExpiredShifts(): Promise<void>
```
- Runs as scheduled job or on-demand
- Finds stale signals older than 48 hours
- Applies cleanup rules based on ride history

---

# Ride Management (RideService)

## Core Business Rules

### Ride Lifecycle States
1. **Active**: `end_time` is `null`
2. **Completed**: `end_time` is populated with actual end timestamp

### Driver Availability Requirements
To start a ride, a driver must:
- Have an active shift (`start` or `continue` state)
- Not be in paused state
- Not have another active ride

### Coordinate Validation
All geographic coordinates are validated:
- **Latitude**: Must be between -90 and 90 degrees
- **Longitude**: Must be between -180 and 180 degrees
- **Required**: All four coordinates (start_lat, start_lng, dest_lat, dest_lng) are mandatory

## Ride Operations

### Ride Evaluation
```typescript
evaluateRide(startLat, startLng, destLat, destLng): Promise<number>
```
- **Purpose**: ML prediction scoring for ride quality/profitability
- **Current Implementation**: Returns random score (1-5) for testing
- **Future**: Will integrate with actual ML model for route optimization

### Starting a Ride
```typescript
startRide(driverId, shiftId, coordinates): Promise<RideResult>
```
- **Validation**: Checks driver availability and coordinate validity
- **Prediction**: Gets ML score for the route
- **Record Creation**: Creates ride record with:
  - Start coordinates and timestamp
  - Destination coordinates
  - Predicted score
  - Associated shift ID

### Ride Status Tracking
```typescript
getRideStatus(driverId, overrideDestination?): Promise<RideStatus>
```
- **Real-time calculation**: Computes elapsed time, distance, estimated fare
- **Flexible destination**: Allows override of original destination for final calculations
- **Distance calculation**: Uses Haversine formula for accurate geographic distance

### Ending a Ride
```typescript
endRide(rideId, fareCents, actualDistanceKm): Promise<RideResult>
```
- **Statistics calculation**:
  - Total ride duration in milliseconds
  - Earnings per minute rate
  - Final distance and fare recording
- **Validation**: Ensures ride exists and is not already ended

## Fare Calculation

### Fare Structure
```typescript
Base Fare: $2.50
Time Rate: $0.30 per minute
Distance Rate: $1.20 per kilometer
```

### Calculation Formula
```
Total Fare = Base Fare + (Time Rate × Minutes) + (Distance Rate × Kilometers)
```

### Distance Calculation
Uses **Haversine formula** for accurate distance between GPS coordinates:
```typescript
computeDistanceKm(startLat, startLng, destLat, destLng): number
```

## Expired Ride Management

### Automatic Cleanup Policy
**Trigger**: Rides active for more than **4 hours**

**Business Rules**:
- Assumes driver forgot to end the ride
- Automatically ends the ride with:
  - `earning_cents`: 0 (nullified earnings)
  - `earning_per_min`: 0
  - `distance_km`: 0
  - `end_time`: Current timestamp

**Implementation**:
```typescript
manageExpiredRides(): Promise<void>
```
- Finds rides started more than 4 hours ago with `end_time = null`
- Sets earnings to zero to prevent incorrect payouts
- Maintains ride record for audit purposes

---

# Validation and Safety Rules

## Signal Validation
- **State machine enforcement**: Prevents invalid state transitions
- **Active ride blocking**: No shift signals accepted during active rides
- **Timestamp validation**: Ensures chronological order of events

## Coordinate Validation
- **Geographic bounds**: Validates latitude/longitude ranges
- **Type checking**: Ensures coordinates are numeric values
- **Completeness**: Requires all four coordinates for ride operations

## Driver Availability Logic
```typescript
driverIsAvailable(driverId): Promise<boolean>
```
Returns `true` only if:
- Driver has active shift
- Last signal is 'start' or 'continue' (not 'pause' or 'stop')
- Driver has no active rides

## Ride Conflict Prevention
```typescript
canStartRide(driverId): Promise<boolean>
```
Prevents multiple active rides by checking:
- Driver availability status
- No existing active rides for the driver

---

# Data Integrity and Cleanup

## Automatic Maintenance Jobs

### Expired Shift Cleanup (48-hour rule)
- **Frequency**: Should run daily via cron job
- **Purpose**: Prevents database bloat from abandoned shifts
- **Business benefit**: Maintains accurate driver statistics

### Expired Ride Cleanup (4-hour rule)
- **Frequency**: Should run hourly via cron job
- **Purpose**: Prevents incorrect fare calculations from forgotten rides
- **Business benefit**: Protects against fraudulent earnings

## Signal Cleanup
- **When**: After successful shift completion
- **What**: Removes intermediate shift signals after computing final statistics
- **Why**: Reduces database size while preserving essential shift data

---

# Time Handling

## UTC Timestamp Policy
- **All timestamps stored in UTC**: Ensures consistency across time zones
- **Client-side conversion**: Frontend handles local time display
- **Duration calculations**: Always performed on UTC millisecond values

## Timestamp Sources
1. **User-provided**: Optional timestamp in API requests
2. **System-generated**: `Date.now()` when timestamp not provided
3. **Database-generated**: Automatic timestamps for certain operations

---

# Integration Points

## Service Dependencies
```
ShiftService ← RideService (driver availability checks)
RideService → ShiftService (active ride validation)
```

## Utility Dependencies
- **SignalValidation**: State machine validation
- **ShiftCalculator**: Break and work time calculations
- **RideCalculator**: Distance and fare calculations
- **MlStub**: Ride scoring (placeholder for ML integration)

---

# Error Handling

## Business Logic Errors
- **Invalid transitions**: "Invalid signal transition: {signal}"
- **Availability conflicts**: "Cannot start ride—either no active shift or another ride in progress"
- **Missing resources**: "No active shift to pause/continue/end"

## Validation Errors
- **Coordinate errors**: "Invalid latitude/longitude provided"
- **Missing data**: "Missing required coordinates/fields"
- **Type errors**: "Invalid fare or distance values"

---

# Future Enhancements

## Planned Features
1. **Real ML Integration**: Replace MlStub with actual machine learning model
2. **Dynamic Fare Calculation**: Surge pricing based on demand
3. **Advanced Shift Analytics**: Productivity metrics and recommendations
4. **Route Optimization**: Integration with mapping services

## Scalability Considerations
- **Batch processing**: For expired ride/shift cleanup at scale
- **Event-driven architecture**: Real-time updates via message queues
- **Caching layer**: For frequently accessed driver availability status 