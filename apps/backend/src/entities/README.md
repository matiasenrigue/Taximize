# Entities

This directory contains the core business entities and their associated logic for the backend application. Each entity is organized as a self-contained module with its own controllers, services, models, routes, and tests.

> Link to the DB documentation file in backend/documentation

## Entity Relationships and Interactions

The backend follows a hierarchical data model where entities are interconnected through well-defined relationships:


### Key Entity Interactions

#### 1. **Tracking of driver states via Signal Validation**
- Other entities get their actions done if and only if the signal is validated by signal validation entity
- This is used by shifts, pauses and rides (to check if they can start)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                     DRIVER STATE TRACKING VIA SIGNAL VALIDATION             │
└─────────────────────────────────────────────────────────────────────────────┘

    Driver Action Request              Signal Validation Gateway
    ────────────────────              ──────────────────────────
           │                                      │
           │                          ┌───────────────────────┐
           ▼                          │  SignalValidation     │
    ┌─────────────┐                   │  .isValidTransition() │
    │   Driver    │                   │                       │
    │   Sends     │────────────────▶  │  Valid Transitions:  │
    │   Signal    │                   │  • null → start       │
    └─────────────┘                   │  • start → pause/stop │
                                      │  • pause → continue/  │
                                      │            stop       │
                                      │  • continue → pause/  │
                                      │               stop    │
                                      │  • stop → (none)      │
                                      └──────────┬────────────┘
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

##### Ride Workflow (Separate from Signal Validation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              RIDE WORKFLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

    Driver Requests Ride                     Ride Eligibility Checks
    ───────────────────                      ──────────────────────
           │                                            │
           │                                 ┌──────────────────────┐
           ▼                                 │   RideService       │
    ┌─────────────┐                          │   .canStartRide()   │
    │   Driver    │                          │                     │
    │  Requests   │─────────────────────────▶│   Checks:           │
    │    Ride     │                          │   1. Active shift?  │
    └─────────────┘                          │   2. Not paused?    │
                                             │   3. No active ride?│
                                             └──────────┬──────────┘
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
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Check Active│ NO  │    DENY     │     │ Check Last  │     │ Check Active│
│   Shift?    ├────▶│  No Active  │     │   Signal    │     │    Ride?    │
│             │     │    Shift    │     │             │     │             │
└──────┬──────┘     └─────────────┘     └──────┬──────┘     └──────┬──────┘
       │ YES                                    │                    │
       ▼                                        ▼                    ▼
┌─────────────┐                          ┌─────────────┐     ┌─────────────┐
│   Continue  │                          │  Is Paused? │ YES │    DENY     │
│   to Next   │                          │             ├────▶│ Ride Already│
│    Check    │                          │             │     │   Active    │
└─────────────┘                          └──────┬──────┘     └─────────────┘
                                                │ NO                 │ NO
                                                ▼                    ▼
                                         ┌─────────────┐     ┌─────────────┐
                                         │   Continue  │     │   ALLOW     │
                                         │   to Next   │     │ Start Ride  │
                                         │    Check    │     │             │
                                         └─────────────┘     └─────────────┘
```

#### 2. **Every Signal means an action that needs to be registered**
- 'start-shift-signal' means that a shift started, so it needs to be registered in the DB with a new entry
- end shift signal means that shift ended with some activity, so that entry in the DB needs to be edited (with calculations of earnings, breaks, etc...)
- The same happens with rides and pauses (although pauses don't register the first pause, they only create the entry on pause end thanks to time stamps in the signals)

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

### 3. One ride can only be started if a shift is active
- Rides can only be started during an active, non-paused shift

### 4. One pause can only be started if a shift is active
- **Pauses** are derived from shift signals and store calculated break periods





### Business Rules Enforcement

1. **One Active Shift Rule**: Enforced by unique index on `shifts` table where `shift_end IS NULL`
2. **One Active Ride Rule**: Enforced by unique index on `rides` table where `end_time IS NULL`
3. **No Rides During Pause**: Validated in ride service by checking last shift signal
