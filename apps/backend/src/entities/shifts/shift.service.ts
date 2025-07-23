import { Shift } from './shift.model';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { Pause } from '../shift-pauses/pause.model';
import { ShiftRepository } from './shift.repository';
import PauseService from '../shift-pauses/pause.service';
import { Ride } from '../rides/ride.model';
import { RideRepository } from '../rides/ride.repository';
import { RideService } from '../rides/ride.service';
import { Signal } from '../shift-signals/utils/signalValidation';
import { ShiftCalculationUtils } from './utils/ShiftCalculationUtils';
import { Op } from 'sequelize';
import { ShiftCreationData, ShiftEndData } from './shift.types';
import { SHIFT_CONSTANTS, SHIFT_ERRORS } from './shift.constants';


/**
 * Handles driver shift lifecycle - creation, tracking, signals and metrics.
 * Works with PauseService and RideService for complete shift data.
 */
export class ShiftService {


    /**
     * Gets shift and ensures driver owns it.
     * @throws If shift missing or wrong driver
     */
    private static async getShiftWithAuth(shiftId: string, driverId: string): Promise<Shift> {
        const shift = await ShiftRepository.findById(shiftId);
        if (!shift) {
            throw new Error(SHIFT_ERRORS.SHIFT_NOT_FOUND);
        }

        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to access this shift');
        }

        return shift;
    }



    /**
     * Fetches shift's pauses and rides in parallel.
     * @returns Both pauses and rides arrays
     */
    private static async getShiftRelatedData(shiftId: string): Promise<{ pauses: Pause[], rides: Ride[] }> {
        const [pauses, rides] = await Promise.all([
            Pause.findAll({
                where: { shift_id: shiftId },
                order: [['pause_start', 'ASC']]
            }),
            RideRepository.findAllByShift(shiftId)
        ]);
        return { pauses, rides };
    }


    /**
     * Get current shift status including timing and pause info.
     * @returns Status object or null if no active shift
     */
    static async getCurrentShiftStatus(driverId: string): Promise<{
        isOnShift: boolean;
        shiftStart: number | null;
        isPaused: boolean;
        pauseStart: number | null;
        lastPauseEnd: number | null;
        duration: number | null;
        pauseDuration: number | null;
    } | null> {
        const lastSignal = await this.getLastSignalWithDetails(driverId);
        
        if (!lastSignal) {
            return null;
        }

        const isOnShift = ['start', 'continue', 'pause'].includes(lastSignal.signal);
        if (!isOnShift) {
            return null;
        }

        // Need the 'start' signal that began this shift period
        const shiftStartSignal = await this.getShiftStartSignal(driverId);

        const pauseInfo = await PauseService.getPauseInfo(driverId);
        
        // Need the shift record for planned duration
        const activeShift = await this.getActiveShift(driverId);

        return {
            isOnShift: true,
            shiftStart: shiftStartSignal ? shiftStartSignal.timestamp.getTime() : null,
            isPaused: lastSignal.signal === 'pause',
            pauseStart: lastSignal.signal === 'pause' ? lastSignal.timestamp.getTime() : null,
            lastPauseEnd: pauseInfo.lastPauseEnd ? pauseInfo.lastPauseEnd.getTime() : null,
            duration: activeShift ? activeShift.planned_duration_ms : null,
            pauseDuration: lastSignal.signal === 'pause' ? (lastSignal.planned_duration_ms || null) : null
        };
    }



    /**
     * Check if driver can accept rides (on shift and not paused).
     * @returns true if available
     */
    static async driverIsAvailable(driverId: string): Promise<boolean> {
        // No shift = not available
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            return false;
        }

        const lastSignal = await this.getLastSignal(driverId);
        
        // No signals yet means they just started
        if (!lastSignal) {
            return true;
        }
        
        return lastSignal === 'start' || lastSignal === 'continue';
    }



    /**
     * Start a new shift for driver.
     * @param timestamp Unix timestamp for start time
     * @param duration Planned duration in ms (optional)
     * @throws If already on shift
     */
    static async createShift(driverId: string, timestamp: number, duration?: number): Promise<void> {
        
        // Can't start shift if already on one
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);
        if (activeShift !== null) {
            throw new Error(SHIFT_ERRORS.SHIFT_ALREADY_ACTIVE);
        }
        
        // Create new shift
        const shiftData: ShiftCreationData = {
            driver_id: driverId,
            shift_start: new Date(timestamp),
            planned_duration_ms: duration || SHIFT_CONSTANTS.DEFAULT_PLANNED_DURATION_MS
        };
        
        await Shift.create(shiftData as any);
    }


    /**
     * End driver's current shift.
     * @returns saved shift data
     * @throws If no active shift
     */
    static async saveShift(driverId: string): Promise<any> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift to save');
        }

        return await this.saveShiftByShiftId(activeShift.id);
    }


    /**
     * Remove all signals for a shift (uses active shift if no ID given).
     */
    static async deleteShiftSignals(driverId: string, shiftId?: string): Promise<void> {
        const targetShiftId = shiftId || (await ShiftService.getActiveShift(driverId))?.id;
        if (targetShiftId) {
            await ShiftSignal.destroy({
                where: { shift_id: targetShiftId }
            });
        }
    }




    /**
     * Get last signal type for driver's active shift.
     */
    static async getLastSignal(driverId: string): Promise<Signal | null> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        return lastSignal ? lastSignal.signal : null;
    }


    /**
     * Get last signal with all details.
     */
    private static async getLastSignalWithDetails(driverId: string): Promise<ShiftSignal | null> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        return await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });
    }


    /**
     * Get driver's active shift if exists.
     */
    static async getActiveShift(driverId: string): Promise<Shift | null> {
        return await ShiftRepository.findActiveByDriverId(driverId);
    }



    /**
     * Find the 'start' signal that began current shift period.
     * (After the most recent 'stop' if any)
     */
    private static async getShiftStartSignal(driverId: string): Promise<ShiftSignal | null> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        // Look for 'start' after any 'stop'
        const lastStop = await ShiftSignal.findOne({
            where: { 
                shift_id: activeShift.id,
                signal: 'stop' 
            },
            order: [['timestamp', 'DESC']]
        });

        const whereClause: any = {
            shift_id: activeShift.id,
            signal: 'start'
        };

        if (lastStop) {
            whereClause.timestamp = { [Op.gt]: lastStop.timestamp };
        }

        return await ShiftSignal.findOne({
            where: whereClause,
            order: [['timestamp', 'DESC']]
        });
    }



    /**
     * End shift and calculate all metrics (duration, earnings, breaks).
     * @throws If shift not found or ride still active
     */
    private static async saveShiftByShiftId(shiftId: string): Promise<Shift> {
        const shift = await ShiftRepository.findById(shiftId);
        if (!shift) {
            throw new Error(SHIFT_ERRORS.SHIFT_NOT_FOUND);
        }

        // Can't end shift with active ride
        const hasActiveRide = await RideRepository.hasActiveRideForShift(shiftId);

        if (hasActiveRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        const shiftEnd = new Date();
        
        const endData: ShiftEndData = {
            shift_end: shiftEnd,
            total_duration_ms: shiftEnd.getTime() - shift.shift_start.getTime()
        };
        
        const { pauses, rides } = await this.getShiftRelatedData(shiftId);

        // Calculate all shift metrics
        await ShiftCalculationUtils.updateShiftCalculations(shift, 'full', pauses, rides);
        
        await shift.update({
            ...shift.dataValues,
            shift_end: shiftEnd  // Make sure end time is set
        });

        // Remove signals after saving
        await ShiftSignal.destroy({
            where: { shift_id: shiftId }
        });

        return shift;
    }

    /**
     * Get all shifts for a driver (historical data).
     */
    static async getShiftsByDriver(driverId: string): Promise<Shift[]> {
        const endDate = new Date();
        const startDate = new Date(0);
        return await ShiftRepository.findShiftsInDateRange(driverId, startDate, endDate);
    }



    /**
     * Get shift by ID (with auth check).
     */
    static async getShiftById(shiftId: string, driverId: string): Promise<Shift> {
        return await this.getShiftWithAuth(shiftId, driverId);
    }

    

    /**
     * End specific shift and return summary stats.
     * @returns Summary with durations, earnings, breaks
     * @throws If already ended or ride active
     */
    static async endShiftById(shiftId: string, driverId: string): Promise<any> {
        const shift = await this.getShiftWithAuth(shiftId, driverId);

        if (shift.shift_end) {
            throw new Error(SHIFT_ERRORS.SHIFT_ALREADY_ENDED);
        }

        // Can't end shift with active ride
        const hasActiveRide = await RideRepository.hasActiveRideForShift(shiftId);

        if (hasActiveRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        await this.saveShiftByShiftId(shiftId);
        
        await shift.reload();
        
        const totalEarnings = shift.total_earnings_cents ? shift.total_earnings_cents / 100 : 0;
        
        return {
            totalDuration: shift.total_duration_ms || 0,
            workTimeMs: shift.work_time_ms || 0,
            breakTimeMs: shift.break_time_ms || 0,
            numBreaks: shift.num_breaks || 0,
            averageBreak: shift.avg_break_ms || 0,
            totalEarnings: totalEarnings
        };
    }
}

export default ShiftService;
