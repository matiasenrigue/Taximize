// Other services
import { RideService } from '../rides/ride.service';
import PauseService from '../shift-pauses/pause.service';
import { ShiftService } from '../shifts/shift.service';

// Models
import ShiftSignal from './shiftSignal.model';
import Shift from '../shifts/shift.model';


import { SignalValidation, Signal } from './utils/signalValidation';



/**
 * Service layer for managing shift signal operations.
 * 
 * This service handles the business logic for shift state transitions,
 * ensuring signals follow valid state machine rules and coordinating
 * with related services like rides, pauses, and shifts.
 */
abstract class ShiftSignalService {

    /**
     * Validates whether a driver can perform a specific signal transition.
     * 
     * Checks multiple conditions:
     * - Driver must not have an active ride
     * - The signal transition must follow valid state machine rules
     * 
     * @param driverId - The unique identifier of the driver
     * @param newSignal - The signal type to validate ('start', 'stop', 'pause', 'continue')
     * @returns Promise<boolean> - True if the signal is valid
     * @throws Error if the signal transition is invalid
     */
    static async isValidSignal(driverId: string, newSignal: string): Promise<boolean> {
        
        // Check if driver has active ride - if so, no signals can be received
        const hasActiveRide = await RideService.hasActiveRide(driverId);
        if (hasActiveRide) {
            return false;
        }

        // Get last signal for the driver
        const lastSignal = await ShiftService.getLastSignal(driverId);
        
        // Check if the new signal is valid based on the last signal
        const isValid = SignalValidation.isValidTransition(lastSignal, newSignal as Signal);
        if (!isValid) {
            // This error is handled in the controller
            throw new Error(`Invalid signal transition: ${newSignal}`);
        }
        return true;
    }


    /**
     * Records a shift signal in the database.
     * 
     * Creates a new ShiftSignal record associated with the driver's active shift.
     * For pause signals, can optionally store the planned pause duration.
     * 
     * @param driverId - The unique identifier of the driver
     * @param timestamp - Unix timestamp when the signal occurred
     * @param signal - The signal type to register
     * @param additionalData - Optional data (e.g., planned duration for pause signals)
     */
    static async registerSignal(driverId: string, timestamp: number, signal: string, additionalData?: number): Promise<void> {

        const activeShift = await ShiftService.getActiveShift(driverId);
        if (activeShift) {
            await ShiftSignal.create({
                timestamp: new Date(timestamp),
                shift_id: activeShift.id,
                signal: signal as Signal,
                planned_duration_ms: (signal === 'pause' && additionalData) ? additionalData : null
            });
        }

    }



    /**
     * ---------------------------------
     * -- Individual signal handlers ---
     * ---------------------------------
     * 
     * The following methods handle specific signal types,
     * each performing validation and executing appropriate business logic.
     */



    


    /**
     * Handles the start shift signal.
     * 
     * Creates a new shift for the driver and registers the start signal.
     * Validates that the driver can start a shift (no active shift/ride).
     * 
     * @param driverId - The unique identifier of the driver
     * @param timestamp - Unix timestamp when the shift starts
     * @param duration - Optional planned shift duration in milliseconds
     * @throws Error if driver already has an active shift or ride
     */
    static async handleStartSignal(driverId: string, timestamp: number, duration?: number): Promise<void> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'start');

        // Create new shift if possible
        await ShiftService.createShift(driverId, timestamp, duration);

        // Register the start signal
        await this.registerSignal(driverId, timestamp, 'start', duration);

    }


    /**
     * Handles the stop/end shift signal.
     * 
     * Finalizes the active shift by:
     * - Computing all shift statistics (duration, earnings, breaks, etc.)
     * - Saving the shift data
     * - Cleaning up all associated shift signals
     * 
     * @param driverId - The unique identifier of the driver
     * @param timestamp - Unix timestamp when the shift ends
     * @returns Shift summary with statistics (total duration, earnings, breaks, etc.)
     * @throws Error if no active shift exists
     */
    static async handleStopSignal(driverId: string, timestamp: number): Promise<any> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'stop');

        // Get the shift ID before ending it
        const activeShift = await ShiftService.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift to end');
        }
        const shiftId = activeShift.id;

        // Save the shift with all computed statistics
        const data = await ShiftService.saveShift(driverId);    

        // DON'T register stop signal, we will delete all the shift signals
        await ShiftService.deleteShiftSignals(driverId, shiftId);

        return data;

        // Return format:
        // {
        //     totalDuration: total shift duration in milliseconds
        //     passengerTime: time spent with passengers in milliseconds
        //     pauseTime: total break time in milliseconds
        //     idleTime: time available but not with passengers
        //     numBreaks: number of pause periods
        //     averageBreak: average pause duration in milliseconds
        //     totalEarnings: total earnings in cents
        // }
    }



    /**
     * Handles the pause shift signal.
     * 
     * Marks the shift as paused without creating a separate pause record.
     * The pause start time and duration are tracked via the shift signal itself.
     * 
     * @param driverId - The unique identifier of the driver
     * @param timestamp - Unix timestamp when the pause starts
     * @param pauseDuration - Optional planned pause duration in milliseconds
     * @throws Error if no active shift exists or shift is already paused
     */
    static async handlePauseSignal(driverId: string, timestamp: number, pauseDuration?: number): Promise<void> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'pause');

        // Note: Pause tracking is handled via shift signals rather than
        // separate pause records. This simplifies the data model while
        // maintaining full pause history through the signals.

        // Register the pause signal
        await this.registerSignal(driverId, timestamp, 'pause', pauseDuration);
    }


    /**
     * Handles the continue/resume shift signal.
     * 
     * Resumes a paused shift by:
     * - Validating the shift is currently paused
     * - Saving the completed pause period
     * - Registering the continue signal
     * 
     * @param driverId - The unique identifier of the driver
     * @param timestamp - Unix timestamp when the shift resumes
     * @throws Error if no paused shift exists to continue
     */
    static async handleContinueSignal(driverId: string, timestamp: number): Promise<void> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'continue');
        
        // Save the pause period
        await PauseService.saveShiftPause(driverId);

        // Register the continue signal
        await this.registerSignal(driverId, timestamp, 'continue');
    }

}


export default ShiftSignalService;

