# Shifts

## Overview

Shifts are the primary work tracking unit for drivers, representing a complete work session from start to finish. Each shift tracks timing, location, earnings, and work metrics while enforcing business rules around driver state management. The shift system uses a signal-based architecture to maintain accurate state tracking and integrates tightly with rides, pauses, and ML predictions.

## Architecture

### Components

1. **Shift Model** (`shift.model.ts`)
   - Sequelize model with UUID primary key and soft deletes
   - Stores start/end times, locations, earnings, and work metrics
   - Enforces single active shift per driver constraint

2. **Shift Service** (`shift.service.ts`)
   - Core business logic for shift lifecycle management
   - Handles shift creation, updates, and metric calculations
   - Coordinates with ShiftSignals, Pauses, and Rides

3. **Shift Controller** (`shift.controller.ts`)
   - REST API endpoints for shift operations
   - Returns current shift status with ride information
   - Handles shift history and statistics retrieval

4. **Shift Repository** (`shift.repository.ts`)
   - Data access layer for shift operations
   - Provides methods for querying active and historical shifts
   - Handles complex queries with proper filtering

5. **Shift Calculation Utils** (`utils/ShiftCalculationUtils.ts`)
   - Computes shift metrics from signals, pauses, and rides
   - Calculates work time, break time, earnings, and averages
   - Handles edge cases in metric calculations

## How It Works

### Shift Lifecycle

Shifts use a signal-based state machine (managed by ShiftSignals module):

1. **Starting a Shift**
   - Creates shift record with start time and optional location
   - Sets planned duration (default: 8 hours, max: 12 hours)
   - Generates `start` signal via ShiftSignals

2. **During the Shift**
   - Driver can pause/resume using ShiftSignals
   - Rides are tracked and linked to the shift
   - Real-time status available via `/current` endpoint

3. **Ending a Shift**
   - Calculates all metrics using ShiftCalculationUtils
   - Updates shift record with final statistics
   - Deletes all signals to maintain clean data

### Business Rules

1. **Single Active Shift**: Only one active shift allowed per driver
2. **Maximum Duration**: Shifts cannot exceed 12 hours planned duration
3. **Signal-Based State**: All state changes go through ShiftSignals
4. **Automatic Cleanup**: Expired shifts cleaned up on login (see cleanup utils)
5. **Metric Calculation**: Final metrics computed from related data, not tracked incrementally

### Integration Points

- **ShiftSignals**: Manages all state transitions (start/pause/continue/stop)
- **Rides**: Tracks earnings and work activity during shift
- **Pauses**: Records break periods for labor compliance
- **ExpiredDataCleanup**: Handles abandoned shifts automatically

## API Endpoints

All endpoints require authentication via `authenticateDriver` middleware:

- `GET /api/shifts/current` - Get current shift status with ride info
  - Returns: Shift state, duration, pause info, and active ride details

- `GET /api/shifts` - Get paginated shift history
  - Query params: `page`, `limit`, `sortBy`, `order`, `startDate`, `endDate`
  - Returns: Array of shifts with computed metrics

- `GET /api/shifts/:id` - Get specific shift details
  - Returns: Complete shift data with all metrics

- `GET /api/shifts/stats` - Get aggregated shift statistics
  - Query params: `startDate`, `endDate`
  - Returns: Total earnings, hours, rides, and averages

## Data Flow

### Shift Creation
```
Start Signal → Create Shift Record → Set Active Status → Return Shift ID
```

### Shift Completion
```
Stop Signal → Fetch Signals/Pauses/Rides → Calculate Metrics → 
Update Shift → Delete Signals → Return Final Stats
```

### Current Status
```
Get Active Shift → Check Signal State → Get Active Ride → 
Calculate Durations → Return Combined Status
```

## Metric Calculations

ShiftCalculationUtils computes the following from raw data:

- **Total Duration**: Time from first start to final stop signal
- **Work Time**: Total duration minus all pause periods
- **Break Time**: Sum of all pause durations
- **Number of Breaks**: Count of pause periods
- **Average Break**: Mean duration of pauses
- **Total Earnings**: Sum of all ride earnings
- **Total Distance**: Sum of all ride distances
- **Number of Rides**: Count of completed rides

## Error Handling

Common errors and their meanings:

- `Driver already has an active shift` - Must end current shift first
- `Shift not found` - Invalid shift ID provided
- `Not authorized to access this shift` - Shift belongs to different driver
- `Invalid shift duration` - Duration exceeds maximum allowed

## Automatic Cleanup

The system includes automatic cleanup for abandoned shifts:

- Shifts inactive for 24+ hours are automatically closed
- Cleanup runs on user login via `ExpiredDataCleanup`
- Shifts with rides: Properly ended with calculated metrics
- Shifts without rides: Deleted as they contain no useful data

## Best Practices

1. Use ShiftSignals for all state changes, never modify shifts directly
2. Always check for active shifts before creating new ones
3. Let ShiftCalculationUtils handle all metric computations
4. Handle the current status endpoint for real-time UI updates
5. Implement proper error handling for shift conflicts
6. Trust the automatic cleanup to handle edge cases