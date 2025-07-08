# TDD - Rides and Shift

## Unit-Test Scenarios

### Rides

#### Utilities (`rideCalculator.ts`, `mlStub.ts`)

* Test that when computing distance between two identical coordinates, `computeDistanceKm` returns 0.
* Test that when computing distance between known points, `computeDistanceKm` returns the expected haversine result.
* Test that when passing zero time and distance to `computeFare`, it returns 0.
* Test that when passing positive elapsedMs and distanceKm to `computeFare`, it applies the correct formula.
* Test that `getRandomScore()` always returns an integer between 1 and 5, inclusive.

#### Service Layer (`rideService.ts`)

* Test that `hasActiveRide(driverId)` returns false when there are no rides or all rides have `end_time` set.
* Test that `hasActiveRide(driverId)` returns true when the most recent ride has `end_time == NULL`.
* Test that `canStartRide(driverId)` throws if the driver is not on an active shift.
* Test that `canStartRide(driverId)` throws if there is already an active ride.
* Test that `canStartRide(driverId)` returns true when driver has active shift and no active ride.
* Test that `canStartRide(driverId)` returns **false** when the driver is currently **paused**.
* Test that `evaluateRide(...)` returns an integer between 1–5 given valid coords.
* Test that `startRide(driverId, shiftId, coords)` throws `BadRequest` on invalid latitude/longitude.
* Test that `startRide(driverId, shiftId, coords)` throws if `canStartRide` is false.
* Test that `startRide(...)` inserts a new Ride with `start_time`, `predicted_score`, and null earnings/distance.
* Test that `endRide(rideId, fareCents, actualDistanceKm)` throws if there is no active ride with that ID.
* Test that `endRide(...)` correctly computes `end_time`, `distance_km`, `earning_cents`, and `earning_per_min`.
* Test that `getRideStatus(driverId, overrideDest?)` throws if no active ride exists.
* Test that `getRideStatus(driverId, overrideDest?)` returns elapsed time, recalculated distance and fare when override coordinates provided.
* Test that `manageExpiredShifts()` correctly **identifies** shifts whose last signal is older than the expiration threshold, before purging or auto-closing them.
* Test that `manageExpiredRides()` closes rides older than 4 hours by setting duration 0.
* Test that `manageExpiredRides()` **does not** alter any active ride that began **less than 4 hours** ago.
* Test that inserting a **second** ride for the same `shift_id` with `end_time IS NULL` violates the `one_active_ride_per_shift` unique‐constraint.

### Shifts

#### Signal Validation (`signalValidation` / `isValidSignal`)

For every row in the transition table:

* Test that when last signal is *none* and new is `start`, validation returns true.
* Test that when last signal is *none* and new is any of {`pause`,`continue`,`stop`}, validation returns false.
* Test all valid transitions (`start→pause`, `start→stop`, `pause→continue`, …) return true.
* Test all invalid transitions (`pause→pause`, `continue→continue`, …) return false.
* Test that if `hasActiveRide(driverId)` is true, all new signals are forbidden.

#### Service Layer (`shiftService.ts`, `shiftCalculator.ts`)

* Test that `driverIsAvailable()` returns true only when last signal ∈ {`start`,`continue`}.
* Test that `driverIsAvailable()` returns **false** when the last signal was **`pause`** or **`stop`**.
* Test that `getCurrentShiftStatus(driverId)` on fresh driver returns `{ isOnShift: false, … }`.
* Test that after a `start` signal, `getCurrentShiftStatus` reports `isOnShift: true`, correct `shiftStart`.
* Test that after `pause`, `getCurrentShiftStatus` reports `isPaused: true` and correct `pauseStart`.
* Test that after `continue`, `isPaused: false` and `lastPauseEnd` is set.
* Test that after `stop`, `isOnShift: false` again.
* Test that `handleSignal(driverId, ts, 'start')` creates a new `ShiftSignal` record.
* Test that `handleSignal(..., 'pause')` calls `saveShiftPause` and stores a `ShiftPause`.
* Test that `handleSignal(..., 'stop')` calls `saveShift` and persists a `Shift` summary with correct `total_duration_ms`, `break_time_ms`, etc.
* Test that when `handleSignal` receives a **`pause`** signal, **no** `ShiftPause` record is created until a subsequent **`continue`**.
* Test that `computeBreaks(shiftStart, shiftEnd, driverId)` sums multiple `ShiftPauses` correctly.
* Test that `computeWorkTime` subtracts total break time from shift duration.

#### Cleanup (`manageExpiredShifts`)

* Test that shifts with last signal > 2 days ago and no rides are fully purged.
* Test that shifts with rides but stale signals generate a synthetic `stop` at last ride’s end.
* Test that cleanup logs each action and does not affect active or recently stopped shifts.

---

## Integration-Test Scenarios

### Rides Endpoints (`/api/rides/*`, protected)

* Test that `POST /evaluate-ride` with valid coords returns `{ success: true, rating }` where `rating` ∈ 1–5.
* Test that `POST /evaluate-ride` with out-of-range coords returns 400 + “Invalid coordinates provided.”
* Test that `POST /start-ride` without an active shift returns 400 + “Cannot start ride—either no active shift or another ride in progress.”
* Test that `POST /start-ride` when a ride already in progress returns the same 400 error.
* Test that `POST /start-ride` with valid shift & no active ride returns 200 and includes `rideId`, `startTime`, `predicted_score`.
* Test that `POST /get-ride-status` with no active ride returns 400 + “No active ride or invalid coordinates.”
* Test that `POST /get-ride-status` during a ride returns correct elapsed time, distance, and `estimated_fare_cents`.
* Test that `POST /get-ride-status` with override coords updates `distance_km` and `estimated_fare_cents`.
* Test that `POST /end-ride` with no active ride returns 400 + “No active ride to end.”
* Test that `POST /end-ride` after starting a ride returns 200 with correct `total_time_ms`, `distance_km`, `earning_cents`, `earning_per_min`.

### Shifts Endpoints (`/api/shifts/*`, protected)

* Test that `POST /signal` with `{ signal: 'start' }` when driver off-shift returns 200 + “Signal accepted” and new status.
* Test that **POST** `/api/shifts/signal` with `{ signal: "start" }` when a shift is already active returns **400 Bad Request**.
* Test that `POST /signal` with invalid transition (e.g. `pause` before `start`) returns 400 + appropriate error.
* Test that `POST /signal` while on an active ride returns 400 + “driver has an active ride.”
* Test that convenience `POST /start-shift` when off-shift returns 200 + “Shift started successfully, Ready to Go.”
* Test that `POST /start-shift` when already on-shift returns 400 + “There is already an active Shift started.”
* Test that `POST /pause-shift` when on-shift returns 200 + “Shift paused successfully.”
* Test that `POST /pause-shift` when not on-shift or already paused returns 400 + proper error.
* Test that `POST /continue-shift` after a pause returns 200 + “Shift continued successfully.”
* Test that `POST /continue-shift` when not paused returns 400.
* Test that `POST /end-shift` when on-shift returns 200 and includes `totalDuration`, `workTime`, `breakTime`, `numBreaks`, `averageBreak`, `totalEarnings`.
* Test that `POST /end-shift` when no active shift returns 400 + appropriate error.
* Test that `GET /current` during different signal states returns the correct flags (`isOnShift`, `isPaused`) and timestamps.
* Test that **GET** `/api/shifts/current` when the driver is on an active ride returns **`isOnRide: true`** in the response.
* (Optional) Test that running `manageExpiredShifts` via a hidden endpoint or cron simulation properly closes/purges old shifts.


