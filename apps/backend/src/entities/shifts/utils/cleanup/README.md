# Expired Data Cleanup

## Overview

The `ExpiredDataCleanup` utility manages stale data by automatically closing abandoned rides and shifts when users log in. This prevents "ghost" data from accumulating when drivers forget to properly end their rides or shifts.

## How It Works

The cleanup runs automatically when a user logs in and only affects that specific user's data. It executes in the background without blocking the login process.

### Cleanup Process

1. **Expired Rides (4+ hours)**
   - Finds all active rides that started more than 4 hours ago
   - Closes them with:
     - `end_time`: Current timestamp
     - `earning_cents`: 0
     - `earning_per_min`: 0
     - `distance_km`: 0
   - **Rationale**: If a ride has been active for 4+ hours, it's likely the driver forgot to end it

2. **Expired Shifts (1+ days)**
   - Finds the user's active shift (only one allowed per driver)
   - Checks if the last signal was sent more than 1 day ago
   - Takes different actions based on whether rides exist:
     - **With rides**: Creates a synthetic "stop" signal at the last signal timestamp and properly ends the shift
     - **Without rides**: Deletes the shift entirely as it has no meaningful data
   - **Rationale**: If there's been no activity for a full day, the shift was likely abandoned

### Important Notes

- **Order matters**: Rides are cleaned up first, then shifts
- **User-specific**: Only affects the logged-in user's data
- **Non-blocking**: Runs asynchronously to avoid slowing down login
- **Conservative**: Only cleans up truly stale data (4 hours for rides, 1 day for shifts)

## Configuration

Time thresholds are defined as constants in `expiredDataCleanup.ts`:

```typescript
RIDE_EXPIRY_HOURS = 4     // Rides inactive for 4+ hours
SHIFT_EXPIRY_DAYS = 1     // Shifts inactive for 1+ days
```

## Usage

The cleanup is triggered automatically in the auth controller during login:

```typescript
// In auth.controller.ts login handler
ExpiredDataCleanup.performLoginCleanup(user.id);
```

## User Control

**Important**: Even after automatic cleanup, drivers retain full control over their data:
- Closed rides can be edited to correct earnings, distance, or times
- Ended shifts can be modified to adjust start/end times or other details
- The cleanup simply provides sensible defaults for abandoned sessions

This means drivers who forgot to end a ride/shift can still go back and update their records with the correct information.

## Why This Approach?

This cleanup strategy balances several concerns:

1. **Data Integrity**: Prevents incomplete data from affecting analytics
2. **User Experience**: Doesn't interfere with active sessions
3. **Performance**: Only processes one user's data at a time
4. **Safety**: Conservative thresholds prevent accidental data loss
5. **Flexibility**: Users can always edit their data after cleanup

The cleanup ensures that forgotten sessions don't pollute the database while still giving drivers reasonable time to complete their work naturally.