# TDD - Edit & Delete Operations

## Unit-Test Scenarios

### Ride Edit Operations

#### Business Rules Validation (`rideService.ts`)

* 0 - Test that `canEditRide(rideId, userId)` returns false when the ride is currently active (`end_time IS NULL`).
* 1 - Test that `canEditRide(rideId, userId)` returns false when the ride doesn't belong to the requesting user.
* 2 - Test that `canEditRide(rideId, userId)` returns true when the ride is completed and belongs to the user.
* 3 - Test that `validateRideEditFields(editData)` throws validation error when trying to edit immutable fields (`id`, `shift_id`, `driver_id`, `start_time`, `start_latitude`, `start_longitude`, `predicted_score`).
* 4 - Test that `validateRideEditFields(editData)` accepts valid editable fields (`destination_latitude`, `destination_longitude`, `distance_km`, `earning_cents`, `end_time`).
* 5 - Test that `validateRideEditFields(editData)` throws when `end_time` is before `start_time`.
* 6 - Test that `validateRideEditFields(editData)` throws when `distance_km` is negative or zero.
* 7 - Test that `validateRideEditFields(editData)` throws when `earning_cents` is negative.
* 8 - Test that `validateRideEditFields(editData)` throws when coordinates are out of valid range (lat: -90/90, lng: -180/180).
* 9 - Test that `validateRideEditFields(editData)` throws when `start_time` is modified to be in the future.
* 10 - Test that `editRide(rideId, editData, userId)` successfully updates allowed fields and recalculates shift statistics.
* 11 - Test that `editRide(rideId, editData, userId)` automatically updates `earning_per_min` when `earning_cents` or time is modified.

### Ride Delete Operations

#### Soft Delete Implementation (`rideService.ts`)

* 12 - Test that `deleteRide(rideId, userId)` returns false when ride doesn't exist or doesn't belong to user.
* 13 - Test that `deleteRide(rideId, userId)` returns false when trying to delete an active ride (`end_time IS NULL`).
* 14 - Test that `deleteRide(rideId, userId)` successfully sets `deleted_at` timestamp for completed rides.
* 15 - Test that `deleteRide(rideId, userId)` triggers shift statistics recalculation after deletion.
* 16 - Test that `restoreRide(rideId, userId)` sets `deleted_at` to null for soft-deleted rides.
* 17 - Test that `restoreRide(rideId, userId)` returns false when ride is not soft-deleted or doesn't belong to user.
* 18 - Test that all ride queries automatically exclude soft-deleted records (`WHERE deleted_at IS NULL`).
* 19 - Test that `getRideById(rideId, includeSoftDeleted = false)` respects the soft delete filter.
* 20 - Test that `getRideById(rideId, includeSoftDeleted = true)` returns soft-deleted rides when explicitly requested.

### Shift Edit Operations

#### Business Rules Validation (`shiftService.ts`)

* 21 - Test that `canEditShift(shiftId, userId)` returns false when the shift is currently active (`shift_end IS NULL`).
* 22 - Test that `canEditShift(shiftId, userId)` returns false when the shift doesn't belong to the requesting user.
* 23 - Test that `canEditShift(shiftId, userId)` returns true when the shift is completed and belongs to the user.
* 24 - Test that `validateShiftEditFields(editData, shiftId)` accepts valid editable fields (`shift_start`, `shift_end`).
* 25 - Test that `validateShiftEditFields(editData, shiftId)` throws when trying to edit auto-calculated fields (`total_duration_ms`, `work_time_ms`, `break_time_ms`, `num_breaks`, `avg_break_ms`).
* 26 - Test that `validateShiftEditFields(editData, shiftId)` throws when shift duration exceeds 24 hours.
* 27 - Test that `validateShiftEditFields(editData, shiftId)` throws when `shift_end` is before `shift_start`.
* 28 - Test that `validateShiftTimeConsistency(shiftId, newStart, newEnd)` throws when new shift times don't encompass all associated rides.
* 29 - Test that `validateShiftTimeConsistency(shiftId, newStart, newEnd)` throws when new shift times don't encompass all break periods.
* 30 - Test that `editShift(shiftId, editData, userId)` successfully updates shift times and auto-recalculates all derived fields.
* 31 - Test that `editShift(shiftId, editData, userId)` maintains consistency with all associated ride timestamps.

### Shift Delete Operations

#### Cascade Rules and Soft Delete (`shiftService.ts`)

* 32 - Test that `canDeleteShift(shiftId, userId)` returns false when shift has associated non-deleted rides.
* 33 - Test that `canDeleteShift(shiftId, userId)` returns false when shift doesn't belong to requesting user.
* 34 - Test that `canDeleteShift(shiftId, userId)` returns false when trying to delete an active shift (`shift_end IS NULL`).
* 35 - Test that `canDeleteShift(shiftId, userId)` returns true when shift is completed, belongs to user, and has no associated rides.
* 36 - Test that `deleteShift(shiftId, userId)` successfully sets `deleted_at` timestamp for valid shifts.
* 37 - Test that `deleteShift(shiftId, userId)` also soft-deletes all associated ShiftSignal and ShiftPause records.
* 38 - Test that `restoreShift(shiftId, userId)` sets `deleted_at` to null and restores associated records.
* 39 - Test that `restoreShift(shiftId, userId)` returns false when shift is not soft-deleted or doesn't belong to user.
* 40 - Test that all shift queries automatically exclude soft-deleted records.
* 41 - Test that `getShiftWithRideCheck(shiftId)` correctly identifies shifts that cannot be deleted due to associated rides.

### Statistics Recalculation (`shiftCalculator.ts`)

* 42 - Test that `recalculateShiftStats(shiftId)` recalculates all derived fields when rides are edited.
* 43 - Test that `recalculateShiftStats(shiftId)` recalculates all derived fields when rides are deleted.
* 44 - Test that `recalculateShiftStats(shiftId)` correctly handles shifts with no remaining rides after deletions.
* 45 - Test that `recalculateShiftStats(shiftId)` maintains accuracy for `total_duration_ms`, `work_time_ms`, `break_time_ms`.
* 46 - Test that `recalculateShiftStats(shiftId)` correctly updates `num_breaks` and `avg_break_ms`.

---

## Integration-Test Scenarios

### Ride Edit Endpoints (`/api/rides/:rideId`, protected)

* 47 - Test that `PUT /api/rides/:rideId` with valid edit data returns 200 and updated ride information.
* 48 - Test that `PUT /api/rides/:rideId` with invalid rideId returns 404 + "Ride not found".
* 49 - Test that `PUT /api/rides/:rideId` for ride not owned by authenticated user returns 403 + "Unauthorized to edit this ride".
* 50 - Test that `PUT /api/rides/:rideId` for active ride returns 400 + "Cannot edit active ride. End the ride first".
* 51 - Test that `PUT /api/rides/:rideId` with immutable field changes returns 400 + "Cannot modify immutable fields".
* 52 - Test that `PUT /api/rides/:rideId` with invalid coordinates returns 400 + "Invalid coordinates provided".
* 53 - Test that `PUT /api/rides/:rideId` with negative distance returns 400 + "Distance must be positive".
* 54 - Test that `PUT /api/rides/:rideId` with negative earnings returns 400 + "Earnings must be positive".
* 55 - Test that `PUT /api/rides/:rideId` with end_time before start_time returns 400 + "End time must be after start time".
* 56 - Test that `PUT /api/rides/:rideId` successfully updates shift statistics after ride modification.

### Ride Delete Endpoints (`/api/rides/:rideId`, protected)

* 57 - Test that `DELETE /api/rides/:rideId` for completed ride returns 200 + "Ride deleted successfully".
* 58 - Test that `DELETE /api/rides/:rideId` with invalid rideId returns 404 + "Ride not found".
* 59 - Test that `DELETE /api/rides/:rideId` for ride not owned by user returns 403 + "Unauthorized to delete this ride".
* 60 - Test that `DELETE /api/rides/:rideId` for active ride returns 400 + "Cannot delete active ride. End the ride first".
* 61 - Test that `DELETE /api/rides/:rideId` for already deleted ride returns 400 + "Ride is already deleted".
* 62 - Test that `POST /api/rides/:rideId/restore` successfully restores soft-deleted ride and returns 200.
* 63 - Test that `POST /api/rides/:rideId/restore` for non-deleted ride returns 400 + "Ride is not deleted".
* 64 - Test that `POST /api/rides/:rideId/restore` for ride not owned by user returns 403 + "Unauthorized".
* 65 - Test that `GET /api/rides` excludes soft-deleted rides from results.
* 66 - Test that ride deletion triggers automatic shift statistics recalculation.

### Shift Edit Endpoints (`/api/shifts/:shiftId`, protected)

* 67 - Test that `PUT /api/shifts/:shiftId` with valid time changes returns 200 and updated shift with recalculated statistics.
* 68 - Test that `PUT /api/shifts/:shiftId` with invalid shiftId returns 404 + "Shift not found".
* 69 - Test that `PUT /api/shifts/:shiftId` for shift not owned by user returns 403 + "Unauthorized to edit this shift".
* 70 - Test that `PUT /api/shifts/:shiftId` for active shift returns 400 + "Cannot edit active shift. End the shift first".
* 71 - Test that `PUT /api/shifts/:shiftId` with auto-calculated field changes returns 400 + "Cannot modify auto-calculated fields".
* 72 - Test that `PUT /api/shifts/:shiftId` with shift duration > 24 hours returns 400 + "Shift duration cannot exceed 24 hours".
* 73 - Test that `PUT /api/shifts/:shiftId` with end_time before start_time returns 400 + "Shift end must be after start time".
* 74 - Test that `PUT /api/shifts/:shiftId` with times that don't encompass rides returns 400 + "Shift times must encompass all associated rides".
* 75 - Test that `PUT /api/shifts/:shiftId` with times that don't encompass breaks returns 400 + "Shift times must encompass all break periods".
* 76 - Test that `PUT /api/shifts/:shiftId` automatically recalculates all derived statistics after successful update.

### Shift Delete Endpoints (`/api/shifts/:shiftId`, protected)

* 77 - Test that `DELETE /api/shifts/:shiftId` for shift without rides returns 200 + "Shift deleted successfully".
* 78 - Test that `DELETE /api/shifts/:shiftId` with invalid shiftId returns 404 + "Shift not found".
* 79 - Test that `DELETE /api/shifts/:shiftId` for shift not owned by user returns 403 + "Unauthorized to delete this shift".
* 80 - Test that `DELETE /api/shifts/:shiftId` for active shift returns 400 + "Cannot delete active shift. End the shift first".
* 81 - Test that `DELETE /api/shifts/:shiftId` for shift with associated rides returns 400 + "Cannot delete shift with associated rides. Delete rides first".
* 82 - Test that `DELETE /api/shifts/:shiftId` for already deleted shift returns 400 + "Shift is already deleted".
* 83 - Test that `POST /api/shifts/:shiftId/restore` successfully restores soft-deleted shift and returns 200.
* 84 - Test that `POST /api/shifts/:shiftId/restore` for non-deleted shift returns 400 + "Shift is not deleted".
* 85 - Test that `POST /api/shifts/:shiftId/restore` for shift not owned by user returns 403 + "Unauthorized".
* 86 - Test that `GET /api/shifts` excludes soft-deleted shifts from results.
* 87 - Test that shift deletion also soft-deletes associated ShiftSignal and ShiftPause records.

### Data Consistency Endpoints (Admin/Testing)

* 88 - Test that cascade delete warnings properly identify shifts that cannot be deleted due to rides.
* 89 - Test that statistics recalculation maintains data integrity across all related entities.
* 90 - Test that soft delete queries consistently exclude deleted records across all endpoints.
* 91 - Test that restore operations maintain referential integrity and data consistency.
* 92 - Test that concurrent edit/delete operations are handled safely with proper locking mechanisms.