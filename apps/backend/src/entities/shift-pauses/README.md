# Shift Pauses

## Overview

The Shift Pauses entity manages pause tracking during driver shifts. It records when drivers take breaks, calculates pause durations, and provides pause information for shift reporting.

## Architecture

The entity follows a simple two-component structure:

- **`pause.model.ts`** - Sequelize model representing pause records in the database
- **`pause.service.ts`** - Business logic for creating and retrieving pause information

## How It Works

### Pause Detection

Pauses are automatically detected through shift signals:
1. When a driver sends a `pause` signal, the system starts tracking
2. When a `continue` signal is received, the pause ends
3. Duration is calculated from the difference between these signals

### Data Model

```typescript
{
  id: UUID,
  shift_id: UUID,         // Links to the parent shift
  pause_start: Date,      // When the pause began
  pause_end: Date,        // When the pause ended  
  duration_ms: number,    // Calculated duration in milliseconds
  created_at: Date,
  updated_at: Date
}
```

## Key Features

### Automatic Pause Recording
- `saveShiftPause(driverId)` - Creates pause records by analyzing shift signals
- Finds matching pause/continue signal pairs
- Calculates duration automatically

### Pause Information Retrieval
- `getPauseInfo(driverId)` - Returns current pause status for active drivers
- `getPausesForShift(shiftId)` - Gets all pauses for a specific shift

## Integration Points

- **Shift Signals** - Reads pause/continue signals to detect break periods
- **Shifts** - Links pauses to their parent shift for reporting
- **Reports** - Pause data is included in shift summaries and analytics

## Design Rationale

The pause tracking system is intentionally simple - it relies on the existing shift signals infrastructure rather than implementing a separate pause tracking mechanism. This ensures consistency and reduces complexity while providing accurate break time tracking for compliance and reporting purposes.