

## Schema

### Rides

Tracks each passenger trip taken by a driver.

| Column                  | Type                  | Constraints                  | Description                                |
| ----------------------- | --------------------- | ---------------------------- | ------------------------------------------ |
| `id`                    | UUID (PK)             | default UUIDV4, not null     | Primary key                                |
| `shift_id`              | UUID (FK → shifts.id) | not null                     | Which shift this ride belongs to           |
| `driver_id`             | UUID (FK → user.id)   | not null                     | Which driver this ride belongs to           |
| `start_latitude`        | DOUBLE PRECISION      | not null                     | Latitude where ride began                  |
| `start_longitude`       | DOUBLE PRECISION      | not null                     | Longitude where ride began                 |
| `destination_latitude`  | DOUBLE PRECISION      | not null                     | Planned destination latitude               |
| `destination_longitude` | DOUBLE PRECISION      | not null                     | Planned destination longitude              |
| `start_time`            | TIMESTAMP (UTC)       | not null                     | Epoch ms when ride started                 |
| `predicted_score`       | SMALLINT              | not null, default random 1–5 | ML-model score (1–5) to help driver decide |
| `end_time`              | TIMESTAMP (UTC)       | nullable                     | Epoch ms when ride ended                   |
| `earning_cents`         | INTEGER               | nullable                     | Actual fare in cents                       |
| `earning_per_min`       | INTEGER               | nullable                     | Fare-per-minute in cents                   |
| `distance_km`           | DOUBLE PRECISION      | nullable                     | Total kilometers driven                    |
| `created_at`            | TIMESTAMP (UTC)       | default now()                | Record creation timestamp                  |
| `updated_at`            | TIMESTAMP (UTC)       |                              | Record last update timestamp               |

> Avoid Race condition: 2 rides starting simultaneously:

 ```sql
ALTER TABLE rides
ADD CONSTRAINT one_active_ride_per_shift
UNIQUE (shift_id) WHERE end_time IS NULL;
```

#### Service-Layer Methods

1. **hasActiveRide(driverId)**

   * **Purpose:** returns `true` if the driver’s most recent `Ride` has `end_time IS NULL`.
   * **SQL:**

     ```sql
     SELECT 1 
       FROM rides r
       JOIN shifts s ON r.shift_id = s.id
       WHERE s.driver_id = :driverId
         AND r.end_time IS NULL
       ORDER BY r.start_time DESC
       LIMIT 1;
     ```

2. **canStartRide(driverId)**

   * **Purpose:** ensures

     1. `driverIsAvailable() === true` --> the driver is currently on an active shift (`signals` logic: last signal ∈ {`start`,`continue`}), and
     2. `hasActiveRide(driverId)` is false.

3. **evaluateRide(startLat, startLng, destLat, destLng)**

   * **Purpose:** calls the ML model to generate `predicted_score` ∈ \[1,5].
   * **Temporary Stub:** returns a uniformly random integer between 1 and 5.

4. **startRide(driverId, shiftId, coords)**

   * **Checks:**

     * `canStartRide(driverId)`
     * `coordinateValidation()`: if (lat < -90 || lat > 90 || lng < -180 || lng > 180) throw BadRequest;

   * **Action:**

     * Call `evaluateRide(...)`
     * Insert new `Ride` with `end_time`, `earning_*`, `distance_km` = NULL.
     * Return newly created `ride.id` & `predicted_score`.

5. **endRide(rideId, fareCents, actualDistanceKm)**

   * **Action:**

     * Calculate `end_time = now()`,
       `distance_km = actualDistanceKm`,
       `earning_cents = fareCents`,
       `earning_per_min = fareCents ÷ duration_min`
     * Update the `Ride` row.

6. **getRideStatus(driverId, \[overrideDestination])**

   * **Purpose:** returns current trip summary, recalculating distance/time/fare if the driver’s final dropoff differs.


7. **manageExpiredRides** (Runs every hour --> No need to configure that logic to auto run now)

   - **Purpose:** auto-close or purge any active Ride who is going on for the last 4 hours
   - **Logic:**
     1. Nullify every ride and put duration 0

---

## Ride APIs

All endpoints under **`/api/rides`**, protected by `protect` middleware.

### 1. Evaluate Ride

* **URL:** `POST /api/rides/evaluate-ride`
* **Body:**

  ```json
  {
    "start_latitude":     53.349805,
    "start_longitude":    -6.260310,
    "destination_latitude": 53.343794,
    "destination_longitude": -6.254573
  }
  ```
* **Success (200 OK):**

  ```json
  {
    "success": true,
    "rating": 4
  }
  ```
* **Error (400 Bad Request):**

  ```json
  {
    "success": false,
    "error": "Invalid coordinates provided"
  }
  ```

### 2. Start Ride

* **URL:** `POST /api/rides/start-ride`
* **Body:** same as **Evaluate Ride**
* **Success (200 OK):**

  ```json
  {
    "success": true,
    "message": "Ride started successfully",
    "data": {
      "rideId":          "uuid-ride-123",
      "startTime":       1718600000000,
      "predicted_score": 3
    }
  }
  ```
* **Error (400 Bad Request):**

  ```json
  {
    "success": false,
    "error": "Cannot start ride—either no active shift or another ride in progress"
  }
  ```

### 3. Get Ride Status

* **URL:** `POST /api/rides/get-ride-status`
* **Body:**

  ```json
  {
    "destination_latitude":  53.340123,
    "destination_longitude": -6.262321
  }
  ```
* **Success (200 OK):**

  ```json
  {
    "success": true,
    "data": {
      "rideId":            "uuid-ride-123",
      "start_latitude":    53.349805,
      "start_longitude":   -6.260310,
      "current_destination_latitude":  53.340123,
      "current_destination_longitude": -6.262321,
      "elapsed_time_ms":   900000,
      "distance_km":       3.5,
      "estimated_fare_cents": 1050,
    }
  }
  ```
* **Error (400 Bad Request):**

  ```json
  {
    "success": false,
    "error": "No active ride or invalid coordinates"
  }
  ```

### 4. End Ride

* **URL:** `POST /api/rides/end-ride`
* **Body:**

  ```json
  {
    "fare_cents":       1450,
    "actual_distance_km": 4.2
  }
  ```
* **Success (200 OK):**

  ```json
  {
    "success": true,
    "message": "Ride ended successfully",
    "data": {
      "rideId":          "uuid-ride-123",
      "total_time_ms":   1200000,
      "distance_km":     4.2,
      "earning_cents":   1450,
      "earning_per_min": 72
    }
  }
  ```
* **Error (400 Bad Request):**

  ```json
  {
    "success": false,
    "error": "No active ride to end"
  }
  ```

---

## Controllers (`src/controllers/rideController.ts`)

* **`evaluateRide(req, res)`** → stub ML call → return random 1–5
* **`startRide(req, res)`** → validate with service → call `evaluateRide` → create `Ride`
* **`getRideStatus(req, res)`** → fetch active ride → recalc metrics → return summary
* **`endRide(req, res)`** → update ride with end\_time, earnings, distance

All use `express-async-handler` and errors flow to `errorMiddleware`.

---

## Models

* **`rideModel.ts`** (Sequelize → `rides`): defines the columns above and relations

  ```ts
  Ride.belongsTo(Shift, { foreignKey: 'shift_id' });
  ```

---

## Services (`src/services/rideService.ts`)

* **`hasActiveRide(driverId)`**
* **`canStartRide(driverId)`**
* **`evaluateRide(...)`**
* **`startRide(driverId, shiftId, coords)`**
* **`getRideStatus(driverId, destCoords?)`**
* **`endRide(driverId, fareCents, distanceKm)`**

Encapsulates all business logic and DB queries.

---

## Utilities

* **`rideCalculator.ts`**

  * `computeDistanceKm(startLat, startLng, destLat, destLng)`
  * `computeFare(elapsedMs, distanceKm)`
* **`mlStub.ts`**

  * `getRandomScore(): number`


---

## Directory Structure

```
src/
├── controllers/
│   └── rideController.ts
├── models/
│   └── rideModel.ts
├── routes/
│   └── rideRoutes.ts
├── services/
│   └── rideService.ts
├── utils/
│   ├── rideCalculator.ts
│   └── mlStub.ts
└── tests/
    └── ride.tests.ts
```




