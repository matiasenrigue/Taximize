# Shift Signals

## Overview

Shift signals are the core mechanism for tracking driver work status in real-time. They function as a state machine that records every status change during a driver's shift, ensuring accurate time tracking and preventing invalid state transitions.

## Signal Types

The system supports four signal types:

- **`start`** - Begins a new shift
- **`pause`** - Temporarily pauses the shift (e.g., for breaks)
- **`continue`** - Resumes work after a pause
- **`stop`** - Ends the current shift

## Architecture

### Components

1. **ShiftSignal Model** (`shiftSignal.model.ts`)
   - Sequelize model defining the database schema
   - Stores: timestamp, shift_id, signal type, and optional planned_duration_ms

2. **ShiftSignal Service** (`shiftSignal.service.ts`)
   - Core business logic for signal validation and processing
   - Handles signal registration and state transitions
   - Integrates with Shift, Ride, and Pause services

3. **ShiftSignal Controller** (`shiftSignal.controller.ts`)
   - REST API endpoints for signal operations
   - Uses abstract handler pattern for consistent error handling
   - Includes special "skip pause" functionality

## How It Works

### State Transition Rules

The system enforces strict validation rules to maintain data integrity:

| Current State | Valid Next Signals | Invalid Transitions |
|---------------|-------------------|---------------------|
| No shift | `start` only | `pause`, `continue`, `stop` |
| Started | `pause`, `stop` | `continue`, `start` |
| Paused | `continue`, `stop` | `pause`, `start` |
| Continued | `pause`, `stop` | `continue`, `start` |
| Stopped | `start` only | `pause`, `continue`, `stop` |

### Additional Validation Rules

1. **Active Ride Check**: No signals can be processed while the driver has an active ride
2. **Single Active Shift**: Only one active shift is allowed per driver at any time
3. **Signal Validation**: All transitions are validated through `SignalValidation.isValidTransition()`

### Signal Processing Flow

#### Start Signal
```typescript
handleStartSignal(driverId, timestamp, duration?)
```
1. Validates signal transition
2. Creates new shift record
3. Registers start signal in database

#### Pause Signal
```typescript
handlePauseSignal(driverId, timestamp, pauseDuration?)
```
1. Validates signal transition
2. Registers pause signal with optional planned duration
3. No separate Pause record created (inferred from signals)

#### Continue Signal
```typescript
handleContinueSignal(driverId, timestamp)
```
1. Validates signal transition
2. Saves the pause period via PauseService
3. Registers continue signal

#### Stop Signal
```typescript
handleStopSignal(driverId, timestamp)
```
1. Validates signal transition
2. Calculates and saves shift statistics
3. **Important**: Deletes all shift signals after statistics are saved
4. Returns computed metrics (duration, earnings, breaks, etc.)

## API Endpoints

All endpoints are protected and require authentication:

- `POST /api/shifts/start-shift` - Start a new shift
  - Body: `{ timestamp?, duration? }`
  
- `POST /api/shifts/pause-shift` - Pause current shift
  - Body: `{ timestamp?, pauseDuration? }`
  
- `POST /api/shifts/continue-shift` - Resume from pause
  - Body: `{ timestamp? }`
  
- `POST /api/shifts/end-shift` - End current shift
  - Body: `{ timestamp? }`
  
- `POST /api/shifts/skip-pause` - Register a zero-duration pause
  - Body: `{ timestamp? }`

## Special Features

### Skip Pause
The `skipPause` handler allows drivers to register an instant pause-continue sequence, useful for mandatory break logging without actual time off.

### Automatic Cleanup
When a shift ends, all associated shift signals are deleted to:
- Reduce database storage
- Improve query performance
- Maintain clean historical data

### Integration Points

- **RideService**: Checks for active rides before allowing signals
- **ShiftService**: Manages shift lifecycle and statistics
- **PauseService**: Handles pause period calculations

## Error Handling

The controller uses a consistent error handling pattern:
- Invalid transitions return user-friendly error messages
- All handlers extend `ShiftSignalHandler` for uniform behavior
- Errors are mapped to appropriate HTTP responses via `ResponseHandler`

## Best Practices

1. Always check for active rides before processing signals
2. Validate state transitions to prevent data corruption
3. Use the provided service methods rather than direct database access
4. Handle edge cases (e.g., missing active shift) gracefully
5. Maintain atomicity when processing signals that affect multiple entities