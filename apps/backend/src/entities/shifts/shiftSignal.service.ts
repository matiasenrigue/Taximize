// Other services
import { RideService } from '../rides/ride.service';
import { PauseService } from './pause.service';
import { ShiftService } from './shift.service';

// Models
import ShiftSignal from './shiftSignal.model';
import Shift from './shift.model';


import { SignalValidation, Signal } from './utils/signalValidation';



abstract class ShiftSignalService {

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



    // ---------------------------------
    // -- Individual signal handlers ---
    // ---------------------------------


    static async handleStartSignal(driverId: string, timestamp: number, duration?: number): Promise<void> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'start');

        // Create new shift if possible
        await ShiftService.createShift(driverId, timestamp, duration);

        // Register the start signal
        await this.registerSignal(driverId, timestamp, 'start', duration);

    }


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

        // data: {
            //     totalDuration: result.total_duration_ms,
            //     passengerTime: result.work_time_ms,
            //     pauseTime: result.break_time_ms,
            //     idleTime: idleTime,
            //     numBreaks: result.num_breaks,
            //     averageBreak: result.avg_break_ms,
            //     totalEarnings: totalEarningsCents
            // }
    }



    static async handlePauseSignal(driverId: string, timestamp: number, pauseDuration?: number): Promise<void> {
        
        // Validate the signal
        await this.isValidSignal(driverId, 'pause');

        /** 
         * No need to create a new Pause record: 
         * PauseStart and PlannedDuration can be inferred from the ShiftSignal
         */

        // Register the pause signal
        await this.registerSignal(driverId, timestamp, 'pause', pauseDuration);
    }


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

