# Shift Signals

Shift signals are the core mechanism for tracking driver work status in real-time. They function as a state machine that records every status change during a driver's shift, ensuring accurate time tracking and preventing invalid state transitions

## 📖 API Documentation
**[View Complete API Reference →](../../../documentation/API_Documentation/shifts.md)** *(Signals are managed through shift endpoints)*

### 🔄 **Persistent State Management**
This allows the FrontEnd to be able to restart the page and keep the user exactly where they where, by tracking their last which was their last action and when it was made

> 🔍 **Notice**: Watch how page reloads maintain exact state - timers continue running and current page stays unchanged!

<table>
<tr>
<td><img src="../../../documentation/media/reload-breaks.gif" alt="Break State Persistence" width="300"/></td>
<td><img src="../../../documentation/media/reload-ride.gif" alt="Ride State Persistence" width="300"/></td>
</tr>
</table>

## 📡 Signal Types

The system supports four signal types:

- **`start`** - Begins a new shift
- **`pause`** - Temporarily pauses the shift (e.g., for breaks)
- **`continue`** - Resumes work after a pause
- **`stop`** - Ends the current shift

## 🏗️ Architecture

### 🔧 Components

1. **ShiftSignal Model** (`shiftSignal.model.ts`)

2. **ShiftSignal Service** (`shiftSignal.service.ts`)
   - Core business logic for signal validation and processing: handles signal registration and state transitions
   - Integrates with Shift, Ride, and Pause services

3. **ShiftSignal Controller** (`shiftSignal.controller.ts`)
   - REST API endpoints for signal operations: uses abstract handler pattern for consistent error handling


## ⚙️ How It Works

### 🔄 State Transition Rules

The system enforces strict validation rules to maintain data integrity:

| Current State | Valid Next Signals | Invalid Transitions |
|---------------|-------------------|---------------------|
| No shift | `start` only | `pause`, `continue`, `stop` |
| Started | `pause`, `stop` | `continue`, `start` |
| Paused | `continue`, `stop` | `pause`, `start` |
| Continued | `pause`, `stop` | `continue`, `start` |
| Stopped | `start` only | `pause`, `continue`, `stop` |

### 🔍 Additional Validation Rules

- **Active Ride Check**: No signals can be processed while the driver has an active ride
- **Single Active Shift**: Only one active shift is allowed per driver at any time
- **Signal Validation**: All transitions are validated through `SignalValidation.isValidTransition()`

### 📩 Signal Processing Flow

#### Start Signal: `POST /api/shifts/start-shift`

1. Validates signal transition
2. Creates new shift record
3. Registers start signal in database

#### Pause Signal: `POST /api/shifts/pause-shift`

1. Validates signal transition
2. Registers pause signal with optional planned duration
3. No separate Pause record created (inferred from signals)

#### Continue Signal: `POST /api/shifts/continue-shift`

1. Validates signal transition
2. Saves the pause period via PauseService
3. Registers continue signal

#### Stop Signal `POST /api/shifts/end-shift`

1. Validates signal transition
2. Calculates and saves shift statistics
3. **Important**: Deletes all shift signals after statistics are saved
4. Returns computed metrics (duration, earnings, breaks, etc.)


### ⏭️ Skip Pause `POST /api/shifts/skip-pause`

The `skipPause` handler allows drivers to register an instant pause-continue sequence. This is useful because for security reasons, when a shift has been going on for 3 hours we prompt the driver to take a break. However if the user doesn't want to, he/she will click to not have the break. This signal is the way to trick the backend into thinking that the user took a pause, so we are not constantly prompting the user to take a pause when he/she doesn't want to
