
## Schema

### 1. **ShiftSignals**

Records every heartbeat (“signal”) a driver emits about their shift.

| Column       | Type                    | Constraints                                            | Description                  |
| ------------ | ----------------------- | ------------------------------------------------------ | ---------------------------- |
| `id`         | UUID (PK)               | default UUIDV4, not null                               | Primary key                  |
| `timestamp`  | TIMESTAMP (UTC)         | not null                                               | When the signal was sent     |
| `shift_id`   | UUID (FK → shift.id)    | not null                                               | Which shift sent the signal |
| `signal`     | ENUM                    | values: `start`, `stop`, `pause`, `continue`; not null | What kind of signal this is  |
| `created_at` | TIMESTAMP (UTC)         | default now()                                          | Record creation time         |
| `updated_at` | TIMESTAMP (UTC)         |                                                        | Record update time           |


#### Methods / Procedures

1. **manageExpiredShifts** (Runs every hour --> No need to configure that logic to auto run now)

   - **Purpose:** auto-close or purge any shift whose last signal is not `stop` older than the “expiration” threshold (2 days?)
   - **Logic:**
     1. Find each driver with no `stop` signal and last signal > N hours ago.
     2. If they have rides recorded during that window:
        - Generate a synthetic `stop` at the end-of-last-ride timestamp → call **saveShift**.
     3. Otherwise:
        - Delete their stale `ShiftSignals` (they never actually worked).
     4. Log every action and notify drivers of auto-closures.

2. **isValidSignal(driverId, newSignal)**

   * **Purpose:** checks that the incoming `newSignal` makes sense given the driver’s last signal
   * If `hasActiveRide(driverId) === True` no signal can be recieved 
   * **Logic table:**

   | Last Signal | New Signal | Valid? | Notes                                |
   | ----------- | ---------- | ------ | ------------------------------------ |
   | *none*      | `start`    | ✓      | begin first shift                    |
   | *none*      | others     | ✕      | must `start` before any other signal |
   | `start`     | `pause`    | ✓      | can pause after start                |
   | `start`     | `stop`     | ✓      | can end without pausing              |
   | `start`     | `continue` | ✕      | nothing to continue yet              |
   | `pause`     | `continue` | ✓      | resume after pause                   |
   | `pause`     | `stop`     | ✓      | end even if paused                   |
   | `pause`     | `pause`    | ✕      | already paused                       |
   | `pause`     | `start`    | ✕      | shift already started                |
   | `continue`  | `pause`    | ✓      | can pause again                      |
   | `continue`  | `stop`     | ✓      | can end after working period         |
   | `continue`  | `continue` | ✕      | already working                      |
   | `continue`  | `start`    | ✕      | shift in progress                    |
   | `stop`      | `start`    | ✓      | start a new shift after stopping     |
   | `stop`      | others     | ✕      | must `start` first                   |

 ```js
function canReceiveSignal(driverId: string, newSignal: Signal): boolean {
  if (hasActiveRide(driverId)) return false;
  return isValidTransition(lastSignal, newSignal);
}

```


3. **handleSignal(driverId, timestamp, signal)**

   * Validate via **isValidSignal**
   * If `signal === 'start'` → register entry in ShiftDB, only adding ShiftID and StartDate
  * If `signal === 'stop'` → call **saveShift** (then purge that shift’s signals)
  * If `signal === 'continue'` → call **saveShiftPause**
   * Insert into `ShiftSignals`

4. **getCurrentShiftStatus(driverId)**

   * Fetch last signal for driver
   * Return object:

     ```js
     {
       isOnShift:    lastSignal === 'start' || lastSignal === 'continue' || lastSignal === 'pause',
       shiftStart:   timestamp of most recent ‘start’ after last ‘stop’,
       isPaused:     lastSignal === 'pause',
       pauseStart:   timestamp of last ‘pause’ (if paused),
       lastPauseEnd: timestamp of last ‘continue’ (if any),
     }
     ```

5. **driverIsAvailable()**

  * If the last signal received was `start` or `continue` the driver is available for rides (else not)

---

### 2. **ShiftPauses**

Logs each break interval within a shift.

| Column        | Type                 | Constraints              | Description               |
| ------------- | -------------------- | ------------------------ | ------------------------- |
| `id`          | UUID (PK)            | default UUIDV4, not null | Primary key               |
| `shift_id`    | UUID (FK → shift.id)  | not null                | Which shift sent the signal |
| `pause_start` | TIMESTAMP (UTC)      | not null                 | When pause began          |
| `pause_end`   | TIMESTAMP (UTC)      | not null                 | When pause ended          |
| `duration_ms` | BIGINT               | not null                 | `pause_end - pause_start` |
| `created_at`  | TIMESTAMP (UTC)      | default now()            |                           |
| `updated_at`  | TIMESTAMP (UTC)      |                          |                           |

---

### 3. **Shifts**

Summarizes a completed shift once the driver sends `stop`.

| Column              | Type                 | Constraints              | Description                                       |
| ------------------- | -------------------- | ------------------------ | ------------------------------------------------- |
| `id`                | UUID (PK)            | default UUIDV4, not null | Primary key                                       |
| `driver_id`         | UUID (FK → users.id) | not null                 | Which driver                                      |
| `shift_start`       | TIMESTAMP (UTC)      | not null                 | Timestamp of `start`                              |
| `shift_end`         | TIMESTAMP (UTC)      |                          | Timestamp of `stop`                               |
| `total_duration_ms` | BIGINT               |                          | `shift_end - shift_start`                         |
| `work_time_ms`      | BIGINT               |                          | `total_duration_ms - sum(pause durations)`        |
| `break_time_ms`     | BIGINT               |                          | sum of all pause durations                        |
| `num_breaks`        | INT                  |                          | number of entries in `ShiftPauses` for this shift |
| `avg_break_ms`      | BIGINT               |                          | `break_time_ms / num_breaks`                      |
| `created_at`        | TIMESTAMP (UTC)      | default now()            |                                                   |
| `updated_at`        | TIMESTAMP (UTC)      |                          |                                                   |

#### Save-Time Computations

* **computeBreaks(shiftStart, shiftEnd, driverId):**
  gathers all `ShiftPauses` between those timestamps → sums durations, counts, computes average
* **computeWorkTime:**
  gather all `Rides for the shift` and computes: total earnings, average earnings, rides numbers, avg ride score, iddle time (time where taxi driver was looking for passenger, but not paused nor doing a ride)

---

## API: Shift Controllers & Routes

All endpoints are prefixed with `/api/shifts` and protected by JWT (`protect` middleware).

| Route             | Method | Controller fn     | Description                                   |
| ----------------- | ------ | ----------------- | --------------------------------------------- |
| `/signal`         | POST   | `emitSignal`      | Send a raw signal (`start`/`pause`/... )      |
| `/start-shift`    | POST   | `startShift`      | Convenience wrapper for `{ signal: 'start' }` |
| `/pause-shift`    | POST   | `pauseShift`      | `{ signal: 'pause' }`                         |
| `/continue-shift` | POST   | `continueShift`   | `{ signal: 'continue' }`                      |
| `/end-shift`      | POST   | `endShift`        | `{ signal: 'stop' }`                          |
| `/current`        | GET    | `getCurrentShift` | Fetch ongoing shift state                     |


---

## Controllers

* **`emitSignal(req, res)`**
  parses signal + timestamp → calls **isValidSignal** → inserts into `ShiftSignals` → dispatches to **saveShift** or **saveShiftPause** as needed → returns new status

* **`startShift`**, **`pauseShift`**, etc.
  simply call `emitSignal` with the corresponding signal

* **`getCurrentShift`**
  calls **getCurrentShiftStatus** → returns JSON


---


## Models

* **`ShiftSignal`** (Sequelize model → `shift_signals`)
* **`ShiftPause`** (→ `shift_pauses`)
* **`Shift`** (→ `shifts`)

Each defined with the columns above; use hooks or explicit service-layer logic for the “save” computations.

---

## Utilities

* **signalValidation** — implements the transition table
* **shiftCalculator** — given `shift_start`, `shift_end`, and pauses, computes durations, totals, averages

---

## Directory Structure

```
src/
├── controllers/
│   └── shiftController.ts
├── models/
│   ├── shiftSignalModel.ts
│   ├── shiftPauseModel.ts
│   └── shiftModel.ts
├── routes/
│   └── shiftRoutes.ts
├── services/
│   └── shiftService.ts    # contains validation, saveShift, saveShiftPause, cleanup logic
├── utils/
│   └── shiftCalculator.ts
└── tests/
    └── shift.tests.ts
```

---




#### **POST** `/api/shifts/signal`

* **Body**

  ```json
  {
    "signal": "start" | "pause" | "continue" | "stop",
    "timestamp": 1718500000000  // optional; defaults to now()
  }
  ```
* **Responses**

  * **200 OK**

    ```json
    { "success": true, "message": "Signal accepted", "data": { /* updated status */ } }
    ```
  * **400 Bad Request** `{ "success": false, "error": "Cannot receive shift signal: driver has an active ride"}`

---

### Convenience Endpoints

You can call these instead of `/signal` directly:

#### **POST** `/api/shifts/start-shift`

* No body needed (server uses `signal: 'start'`)
* **200 OK** `{ success: true, message: "Shift started successfully, Ready to Go" }`
* **400** `{"success": false, "error": "There is already an active Shift started"}`

#### **POST** `/api/shifts/pause-shift`

* **200 OK** `{ success: true, message: "Shift paused successfully" }`
* **400** `{"success": false, "error": "No active shift to pause or shift already paused, or driver has an active ride"}` 

#### **POST** `/api/shifts/continue-shift`

* **200 OK** `{ success: true, message: "Shift continued successfully" }`
* **400** `{"success": false, "error": "No paused shift to continue"}` 

#### **POST** `/api/shifts/end-shift`

* **200 OK**

  ```json
  {
    "success": true,
    "message": "Shift ended successfully",
    "data": {
      "totalDuration": 28800000,
      "workTime": 26000000,
      "breakTime": 2800000,
      "numBreaks": 2,
      "averageBreak": 1400000,
      "totalEarnings": 45.50,
    }
  }
  ```
* **400** `{"success": false, "error": "No active shift to end", or driver has an active ride}` 

---

### **GET** `/api/shifts/current`

* **200 OK**

  ```json
  {
    "success": true,
    "data": {
      "isOnShift": true,
      "shiftStart": 1718500000000,
      "isPaused": false,
      "pauseStart": null,
      "lastPauseEnd": 1718503600000,
      "isOnRide": true,
      "rideStartLatitude": 53.349805,
      "rideStartLongitude": -6.26031,
      "rideDestinationAddress": "123 Example Street, Dublin"
    }
  }
  ```
* **400** on error


