# Shifts

Shifts are the primary work tracking unit for drivers, representing a complete work session from start to finish. Each shift tracks timing, location, earnings, and work metrics while enforcing business rules around driver state management

## 📖 API Documentation
**[View Complete API Reference →](../../../documentation/API_Documentation/shifts.md)**

<table>
<tr>
<td><img src="../../../documentation/media/green.png" alt="Good Time to Start" width="200"/></td>
<td><img src="../../../documentation/media/orange_hour.PNG" alt="Moderate Time" width="200"/></td>
<td><img src="../../../documentation/media/red_hour.PNG" alt="Poor Time to Start" width="200"/></td>
</tr>
<tr>
<td align="center"><strong>🟢 Optimal Time</strong></td>
<td align="center"><strong>🟡 Moderate Time</strong></td>
<td align="center"><strong>🔴 Poor Time</strong></td>
</tr>
</table>

## 🏗️ Architecture

### 🔧 Components

1. **Shift Model** (`shift.model.ts`)
   - Enforces single active shift per driver constraint

2. **Shift Service** (`shift.service.ts`)
   - Core business logic for shift lifecycle management: handles shift creation, updates, and metric calculations

3. **Shift Controller** (`shift.controller.ts`)
   - REST API endpoints for shift operations

4. **Shift Repository** (`shift.repository.ts`)
   - Data access layer for shift operations
   - Provides methods for querying active and historical shifts

5. **Shift Calculation Utils** (`utils/ShiftCalculationUtils.ts`)
   - Computes shift metrics from signals, pauses, and rides
   - Calculates work time, break time, earnings, and averages

## ⚙️ How It Works

### 🔄 Shift Lifecycle

Shifts use a signal-based state machine (managed by ShiftSignals module):

1. **Starting a Shift**
   - Creates shift record with start time and optional location
   - Sets planned duration (default: 8 hours, max: 12 hours)
   - Generates `start` signal via ShiftSignals

2. **During the Shift**
   - Driver can pause/resume using ShiftSignals
   - Rides are tracked and linked to the shift
   - Real-time status available via `/current` endpoint

3. **Ending a Shift**
   - Calculates all metrics using ShiftCalculationUtils
   - Updates shift record with final statistics
   - Deletes all signals to maintain clean data

### 📋 Business Rules

1. **Single Active Shift**: Only one active shift allowed per driver
2. **Signal-Based State**: All state changes go through ShiftSignals
3. **Automatic Cleanup**: Expired shifts cleaned up on login 
4. **Metric Calculation**: Final metrics computed from related data, not tracked incrementally

### 🔗 Integration Points

- **ShiftSignals**: Manages all state transitions (start/pause/continue/stop)
- **Rides**: Tracks earnings and work activity during shift
- **Pauses**: Records break periods for labor compliance
- **ExpiredDataCleanup**: Handles abandoned shifts automatically

