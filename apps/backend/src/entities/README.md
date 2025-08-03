# Entities

This directory contains the core business entities and their associated logic for the backend application. Each entity is organized as a self-contained module with its own controllers, services, models, routes, and tests.

> Link to the DB documentation file in backend/documentation

## Entity Relationships and Interactions

The backend follows a hierarchical data model where entities are interconnected through well-defined relationships. The following diagrams illustrate the three core interaction patterns in the system:

---

### 1. Signal State Machine - Driver State Transitions

All driver state changes must pass through the SignalValidation gateway, which ensures only valid transitions occur. This prevents impossible states like starting multiple shifts or pausing when not working.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DRIVER STATE TRACKING VIA SIGNAL VALIDATION             │
└─────────────────────────────────────────────────────────────────────────────┘

    Driver Action Request              Signal Validation Gateway
    ────────────────────              ──────────────────────────
           │                                      │
           │                          ┌───────────────────────────┐
           ▼                          │  SignalValidation         │
    ┌─────────────┐                   │                           │
    │   Driver    │                   │                           │
    │   Sends     │────────────────▶  │  Valid Transitions:       │
    │   Signal    │                   │  • null → start           │
    └─────────────┘                   │  • start → pause/stop     │
                                      │  • pause → continue/stop  │
                                      │  • continue → pause/ stop │
                                      │  • stop → (none)          │
                                      │                           │
                                      └──────────┬────────────────┘
                                                 │
                                     ┌───────────┴────────────┐
                                     │                        │
                                  Valid?                   Invalid?
                                     │                        │
                                     ▼                        ▼
                          ┌──────────────────┐      ┌─────────────────┐
                          │ Signal Accepted  │      │ Signal Rejected │
                          │                  │      │                 │
                          │ Triggers Entity  │      │ No State Change │
                          │ Actions:         │      │                 │
                          └────────┬─────────┘      └─────────────────┘
                                   │
                        ┌──────────┴──────────┐
                        │                     │
                        ▼                     ▼
                ┌──────────────┐      ┌──────────────┐
                │    SHIFTS    │      │    PAUSES    │
                ├──────────────┤      ├──────────────┤
                │ start signal │      │ pause signal │
                │ → new shift  │      │ → new pause  │
                │              │      │              │
                │ stop signal  │      │ continue     │
                │ → end shift  │      │ → end pause  │
                └──────────────┘      └──────────────┘

Example Signal Flow:
────────────────────
1. Driver sends 'start' signal → Validation checks (null→start) ✓ → Shift created
2. Driver sends 'pause' signal → Validation checks (start→pause) ✓ → Pause created  
3. Driver sends 'continue' signal → Validation checks (pause→continue) ✓ → Pause ends
4. Driver sends 'pause' signal → Validation checks (continue→pause) ✓ → New pause
5. Driver sends 'stop' signal → Validation checks (pause→stop) ✓ → Shift ends
```

---

### 2. Ride Eligibility System

Rides have their own validation workflow separate from signals. A ride can only start if all three conditions are met: active shift, not paused, and no current ride.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RIDE WORKFLOW                                  │
└─────────────────────────────────────────────────────────────────────────────┘

    Driver Requests Ride                     Ride Eligibility Checks
    ───────────────────                      ──────────────────────
           │                                            │
           │                                 ┌──────────────────────┐
           ▼                                 │   RideService        │
    ┌─────────────┐                          │   .canStartRide()    │
    │   Driver    │                          │                      │
    │  Requests   │─────────────────────────▶│   Checks:            │
    │    Ride     │                          │   1. Active shift?   │
    └─────────────┘                          │   2. Not paused?     │
                                             │   3. No active ride? │
                                             └──────────┬───────────┘
                                                        │
                                          ┌─────────────┴─────────────┐
                                          │                           │
                                     All Pass?                   Any Fail?
                                          │                           │
                                          ▼                           ▼
                               ┌───────────────────┐       ┌──────────────────┐
                               │   Ride Allowed    │       │   Ride Denied    │
                               │                   │       │                  │
                               │ • Create ride     │       │ Return reason:   │
                               │ • Get ML score    │       │ • No shift       │
                               │ • Track location  │       │ • Shift paused   │
                               │                   │       │ • Ride active    │
                               └───────────────────┘       └──────────────────┘

Detailed Check Flow:
───────────────────
                          Step 1: Check Active Shift
                          ──────────────────────────
                         ┌───────────────────────┐
                         │   Has Active Shift?   │
                         └──────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    NO                              YES
                    │                               │
                    ▼                               ▼
          ┌─────────────────┐              ┌─────────────────┐
          │  🚫 DENY RIDE   │              │   Continue to   │
          │                 │              │   Next Check    │
          │ Reason:         │              └────────┬────────┘
          │ No Active Shift │                       │
          └─────────────────┘                       ▼
                                    
                          Step 2: Check Pause Status
                          ───────────────────────────
                         ┌───────────────────────┐
                         │  Last Signal = Pause? │
                         └──────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    YES                             NO
                    │                               │
                    ▼                               ▼
          ┌─────────────────┐              ┌─────────────────┐
          │  🚫 DENY RIDE   │              │   Continue to   │
          │                 │              │   Next Check    │
          │ Reason:         │              └────────┬────────┘
          │ Shift is Paused │                       │
          └─────────────────┘                       ▼

                          Step 3: Check Active Ride
                          ──────────────────────────
                         ┌───────────────────────┐
                         │   Has Active Ride?    │
                         └──────────┬────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    YES                             NO
                    │                               │
                    ▼                               ▼
          ┌─────────────────┐              ┌─────────────────┐
          │  🚫 DENY RIDE   │              │  ✅ ALLOW RIDE  │
          │                 │              │                 │
          │ Reason:         │              │ All checks pass │
          │ Ride Already    │              │ Create new ride │
          │ Active          │              └─────────────────┘
          └─────────────────┘
```

---

### 3. Signal-to-Database Action Mapping

Every signal and action triggers specific database operations. Shifts and rides follow a CREATE-UPDATE pattern, while pauses uniquely use retroactive creation - storing timestamps at pause start but only creating the database entry when the pause ends.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SIGNAL TO DATABASE ACTION MAPPING                         │
└─────────────────────────────────────────────────────────────────────────────┘

                              Signal Events
                                   │
    ┌──────────────────────────────┼──────────────────────────────┐
    │                              │                              │
    ▼                              ▼                              ▼
┌─────────────┐            ┌─────────────┐                ┌─────────────┐
│   SHIFTS    │            │   PAUSES    │                │    RIDES    │
└─────────────┘            └─────────────┘                └─────────────┘

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SHIFT SIGNALS → DATABASE ACTIONS
─────────────────────────────────
┌────────────────┐         ┌─────────────────────────────────────┐
│ 'start' signal │  ────▶  │ CREATE new shift entry              │
└────────────────┘         │ - shift_id (generated)              │
                           │ - driver_id                         │
                           │ - shift_start = NOW()               │
                           │ - shift_end = NULL                  │
                           │ - status = 'active'                 │
                           └─────────────────────────────────────┘

┌────────────────┐         ┌─────────────────────────────────────┐
│ 'stop' signal  │  ────▶  │ UPDATE existing shift entry         │
└────────────────┘         │ - shift_end = NOW()                 │
                           │ - Calculate total_duration          │
                           │ - Calculate total_earnings          │
                           │ - Calculate total_breaks            │
                           │ - Update ride_count                 │
                           │ - status = 'completed'              │
                           └─────────────────────────────────────┘

PAUSE SIGNALS → DATABASE ACTIONS (Retroactive)
──────────────────────────────────────────────
┌────────────────┐         ┌─────────────────────────────────────┐
│ 'pause' signal │  ────▶  │ NO immediate DB action              │
└────────────────┘         │ (timestamp stored in signal table)  │
                           └─────────────────────────────────────┘
                                          ↓
┌────────────────┐         ┌─────────────────────────────────────┐
│'continue'signal│  ────▶  │ CREATE pause entry (retroactive)    │
└────────────────┘         │ - pause_id (generated)              │
                           │ - shift_id (current shift)          │
                           │ - start_time = pause signal time    │
                           │ - end_time = continue signal time   │
                           │ - duration = calculated             │
                           └─────────────────────────────────────┘

RIDE LIFECYCLE → DATABASE ACTIONS
─────────────────────────────────
┌────────────────┐         ┌─────────────────────────────────────┐
│  Start Ride    │  ────▶  │ CREATE new ride entry               │
└────────────────┘         │ - ride_id (generated)               │
                           │ - shift_id (current shift)          │
                           │ - start_time = NOW()                │
                           │ - start_location                    │
                           │ - destination_location              │
                           │ - predicted_score (ML)              │
                           │ - end_time = NULL                   │
                           │ - status = 'active'                 │
                           └─────────────────────────────────────┘

┌────────────────┐         ┌─────────────────────────────────────┐
│   End Ride     │  ────▶  │ UPDATE existing ride entry          │
└────────────────┘         │ - end_time = NOW()                  │
                           │ - actual_duration = calculated      │
                           │ - actual_earnings = calculated      │
                           │ - status = 'completed'              │
                           └─────────────────────────────────────┘

Timeline Example:
─────────────────
Time    Signal/Action       Database Effect
────    ─────────────       ───────────────
08:00   start signal    →   INSERT shift (id=123, start=08:00)
08:30   Start ride      →   INSERT ride (shift_id=123, start=08:30)
09:00   End ride        →   UPDATE ride (end=09:00, earnings=$25)
09:15   pause signal    →   (no DB action, timestamp recorded)
09:45   continue signal →   INSERT pause (start=09:15, end=09:45, duration=30min)
10:00   Start ride      →   INSERT ride (shift_id=123, start=10:00)
10:30   End ride        →   UPDATE ride (end=10:30, earnings=$30)
11:00   stop signal     →   UPDATE shift (end=11:00, total_earnings=$55, breaks=30min)
```

---

### 4. Automatic Cleanup on Login

The system automatically manages stale data when drivers log in, ensuring abandoned shifts and rides don't accumulate in the database. This cleanup runs asynchronously without blocking the login process.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       AUTOMATIC CLEANUP ON LOGIN                             │
└─────────────────────────────────────────────────────────────────────────────┘

                               Driver Login
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Auth Controller   │
                         │   signin endpoint   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                │
             Login Success                    Async Background
                    │                                │
                    ▼                                ▼
         ┌─────────────────────┐      ┌──────────────────────────┐
         │  Return JWT Token   │      │  ExpiredDataCleanup      │
         │  to User            │      │  .performLoginCleanup()  │
         └─────────────────────┘      └────────────┬─────────────┘
                                                   │
              ┌────────────────────────────────────┴────────┐
              │                                             │
              ▼                                             ▼
   ┌─────────────────────┐                       ┌─────────────────────┐
   │  Clean Expired      │                       │  Clean Expired      │
   │  Rides (Step 1)     │                       │  Shifts (Step 2)    │
   └──────────┬──────────┘                       └──────────┬──────────┘
              │                                             │
              ▼                                             ▼

STEP 1: EXPIRED RIDES CLEANUP                 STEP 2: EXPIRED SHIFTS CLEANUP
─────────────────────────────                  ──────────────────────────────

Find rides where:                              Find active shift where:
• driver_id = logged_in_user                   • driver_id = logged_in_user
• end_time IS NULL                             • shift_end IS NULL
• start_time < (NOW - 4 hours)                 • last_signal < (NOW - 1 day)

         │                                              │
         ▼                                              ▼
                                                        
For each expired ride:                         Check if shift has rides?
• SET end_time = NOW()                                 │
• SET earning_cents = 0                     ┌──────────┴──────────┐
• SET earning_per_min = 0                   │                     │
• SET distance_km = 0                       YES                   NO
                                            │                     │
                                            ▼                     ▼
                                    ┌────────────────┐   ┌────────────────┐
                                    │ Create 'stop'  │   │ Delete empty   │
                                    │ signal at last │   │ shift entirely │
                                    │ signal time    │   │                │
                                    │                │   │ (No data to    │
                                    │ End shift with │   │  preserve)     │
                                    │ calculations   │   └────────────────┘
                                    └────────────────┘

Cleanup Thresholds:
──────────────────
• Rides: 4+ hours of inactivity → Closed with 0 earnings
• Shifts: 1+ day of inactivity → Ended (with rides) or Deleted (empty)

Important Notes:
───────────────
• User-specific: Only affects logged-in driver's data
• Non-blocking: Runs async, doesn't delay login
```

---

### Business Rules Enforcement

The system enforces these rules through database constraints and service-level validations:

1. **One Active Shift Rule**: Unique index on `shifts` table where `shift_end IS NULL`
2. **One Active Ride Rule**: Unique index on `rides` table where `end_time IS NULL`  
3. **No Rides During Pause**: Validated by checking the last shift signal
4. **Valid State Transitions**: Enforced by SignalValidation before any state change
