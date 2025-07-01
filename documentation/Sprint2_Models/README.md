> Last Update of this folder: 20/12/24
> 
> **⚠️ CRITICAL ISSUE FOUND AND PARTIALLY FIXED**
> A comprehensive analysis of API misalignments between Frontend and Backend has been completed.
> See [API_Misalignment_Analysis.md](../API_Misalignment_Analysis.md) for full details.
>
> **Key Issues:**
> - ✅ **FIXED**: Frontend axios baseURL configuration preventing access to shifts/rides APIs
> - ❌ **MISSING**: User management APIs (documented in [UserManagement.md](UserManagement.md))
> - ⚠️ **GAPS**: Frontend uses local state instead of documented backend APIs for shifts/rides

### Current Class Diagram

> 

```mermaid
classDiagram
    %% Entities
    class User {
        <<table>>
        + UUID id
        + String email
        + String username
        + String password
        + Timestamp created_at
        + Timestamp updated_at

        + matchPassword()
        + generateAccessToken()
        + generateRefreshToken()
    }

    class Ride {
        <<table>>
        + UUID id
        + UUID shift_id
        + UUID driver_id
        + Double start_latitude
        + Double start_longitude
        + Double destination_latitude
        + Double destination_longitude
        + Timestamp start_time
        + Int predicted_score
        + Timestamp end_time
        + Int earning_cents
        + Int earning_per_min
        + Double distance_km
        + Timestamp created_at
        + Timestamp updated_at

        + hasActiveRide()
        + canStartRide()
        + evaluateRide()
        + startRide()
        + endRide()
        + getRideStatus()
        + manageExpiredRides()
    }

    class ShiftSignal {
        <<table>>
        + UUID id
        + Timestamp timestamp
        + UUID shift_id
        + Enum signal
        + Timestamp created_at
        + Timestamp updated_at

        + isValidSignal()
        + handleSignal()
        + getCurrentShiftStatus()
        + manageExpiredShifts()
        + driverIsAvailable()
    }

    class ShiftPause {
        <<table>>
        + UUID id
        + UUID shift_id
        + Timestamp pause_start
        + Timestamp pause_end
        + BigInt duration_ms
        + Timestamp created_at
        + Timestamp updated_at
    }

    class Shift {
        <<table>>
        + UUID id
        + UUID driver_id
        + Timestamp shift_start
        + Timestamp shift_end
        + BigInt total_duration_ms
        + BigInt work_time_ms
        + BigInt break_time_ms
        + Int num_breaks
        + BigInt avg_break_ms
        + Timestamp created_at
        + Timestamp updated_at

        + computeBreaks()
        + computeWorkTime()
    }

    %% Relationships
    User "1" <-- "0..*" Shift : makesShifts
    User "1" <-- "0..*" Ride : makesRides
    Shift "1" <-- "0..*" Ride : hasRides
    Shift "1" <-- "0..*" ShiftSignal : registers
    Shift "1" <-- "0..*" ShiftPause : recordsPauses

```

