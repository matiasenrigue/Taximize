# Edit & Delete Operations Strategy


### Quick Validation Reference
**Rides:**
- ❌ Edit if `end_time IS NULL`
- ❌ Edit immutable fields (`start_time`, `start_latitude`, etc.)
- ✅ Edit `destination_*`, `distance_km`, `earning_cents`, `end_time`

**Shifts:**
- ❌ Edit if `shift_end IS NULL` 
- ❌ Delete if has non-deleted rides
- ✅ Edit times (must encompass all rides)


---


## Rides Operations

**Data Consistency**
   - Update shift statistics when rides are deleted (or edited)
   - Recalculate driver performance metrics
   - Maintain referential integrity with shift records

### Edit Ride Operations

#### **Business Rules for Ride Editing**

1. **Active Ride Restrictions**
   - Cannot edit rides that are currently in progress (`end_time IS NULL`)
   - Must end the ride first before making any modifications

2. **Basic Data Integrity Rules**
   - `end_time` must be after `start_time`
   - `distance_km` must be positive
   - `earning_cents` must be positive
   - Coordinates must be within valid ranges (-90/90 lat, -180/180 lng)
   - Cannot modify `start_time` to be in the future (relative to edit hour)

#### **Allowed Edit Fields**
- `destination_latitude`, `destination_longitude` (route corrections)
- `distance_km` (actual vs estimated distance)
- `earning_cents` (fare adjustments)
- `end_time` (time corrections)

#### **Forbidden Edit Fields**
- `id`, `shift_id`, `driver_id` (immutable identifiers)
- `start_time`, `start_latitude`, `start_longitude` (pickup immutable)
- `predicted_score` (ML prediction historical record)

### Delete Ride Operations

#### **Business Rules for Ride Deletion**

1. **Soft Delete Policy**
   - Implement soft deletes with `deleted_at` timestamp
   - Drivers can delete any of their completed rides


### Query Behavior
- All standard queries exclude soft-deleted records (`WHERE deleted_at IS NULL`)
- Restore endpoints can recover soft-deleted records
- No hard deletes - data preserved for potential recovery


---


## 🕐 Shift Operations

### Edit Shift Operations

#### **Business Rules for Shift Editing**

1. **Active Shift Restrictions**
   - Cannot edit shifts that are currently active (`shift_end IS NULL`)
   - Must end shift first, then edit historical data

2. **Temporal Boundaries**
   - Shifts can span up to 24 hours (handles night shifts)
   - `shift_start` and `shift_end` within reasonable timeframe

3. **Consistency with Rides**
   - Shift timeframe must encompass all associated rides
   - Cannot edit shift times that would invalidate ride timestamps (and vice versa)
   - Automatic recalculation of shift statistics when rides change

4. **Break Time Validation**
   - Break times must fall within shift boundaries
   - Basic validation to prevent obviously incorrect data

#### **Allowed Edit Fields**
- `shift_start`, `shift_end` (time corrections)
- Manual break adjustments via pause records

#### **Auto-Recalculated Fields**
- `total_duration_ms`
- `work_time_ms` 
- `break_time_ms`
- `num_breaks`
- `avg_break_ms`


### Delete Shift Operations

#### **Business Rules for Shift Deletion**

1. **Cascade Rules**
   - Cannot delete shifts with associated rides
   - Must delete rides first, then shift
   - Clear warning to driver about data loss

2. **Soft Delete Implementation**
   - Use `deleted_at` timestamp
   - Simple restoration capability


-----

## Simple Implementation Strategy

### API Endpoints

```typescript
// Ride Operations
PUT    /api/rides/:rideId                    // Edit ride
DELETE /api/rides/:rideId                    // Soft delete ride
POST   /api/rides/:rideId/restore            // Restore deleted ride

// Shift Operations  
PUT    /api/shifts/:shiftId                  // Edit shift
DELETE /api/shifts/:shiftId                  // Soft delete shift
POST   /api/shifts/:shiftId/restore          // Restore deleted shift
```