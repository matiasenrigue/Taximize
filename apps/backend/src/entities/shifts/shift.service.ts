import { Shift } from './shift.model';
import { ShiftSignal } from '../shift-signals/shiftSignal.model';
import { Pause } from '../shift-pauses/pause.model';
import { ShiftRepository } from './shift.repository';
import { PauseService } from '../shift-pauses/pause.service';
import { Ride } from '../rides/ride.model';
import { RideRepository } from '../rides/ride.repository';
import { RideService } from '../rides/ride.service';
import { Signal } from './utils/signalValidation';
import { ShiftCalculationUtils } from './utils/ShiftCalculationUtils';
import { Op } from 'sequelize';
import { ShiftCreationData, ShiftEndData, ShiftMetrics } from './shift.types';
import { SHIFT_CONSTANTS, SHIFT_ERRORS } from './shift.constants';

export class ShiftService {

    /**
     * Helper method to get and validate shift ownership
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
     * Helper method to check if shift can be modified
     */
    private static validateShiftNotActive(shift: Shift, action: string): void {
        if (!shift.shift_end) {
            throw new Error(`Cannot ${action} active shift`);
        }
    }

    /**
     * Helper method to get pauses and rides for a shift
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

        // Find shift start time (most recent 'start' after last 'stop')
        const shiftStartSignal = await this.getShiftStartSignal(driverId);

        // Find pause times
        const pauseInfo = await PauseService.getPauseInfo(driverId);
        
        // Get active shift to retrieve planned durations
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


    static async driverIsAvailable(driverId: string): Promise<boolean> {
        // First check if driver has an active shift
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            return false;
        }

        // Then check the last signal - if it's 'pause', driver is not available
        const lastSignal = await this.getLastSignal(driverId);
        
        // If no signal exists (shift created directly), consider driver available
        if (!lastSignal) {
            return true;
        }
        
        // Driver is available if last signal is 'start' or 'continue'
        return lastSignal === 'start' || lastSignal === 'continue';
    }


    static async createShift(driverId: string, timestamp: number, duration?: number): Promise<void> {
        
        // To create a new shift, first check if the driver has an active shift
        const activeShift = await ShiftRepository.findActiveByDriverId(driverId);
        if (activeShift !== null) {
            throw new Error(SHIFT_ERRORS.SHIFT_ALREADY_ACTIVE);
        }
        
        // Shift get created with default values
        const shiftData: ShiftCreationData = {
            driver_id: driverId,
            shift_start: new Date(timestamp),
            planned_duration_ms: duration || SHIFT_CONSTANTS.DEFAULT_PLANNED_DURATION_MS
        };
        
        await Shift.create(shiftData as any);
    }


    static async saveShift(driverId: string): Promise<any> {
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) {
            throw new Error('No active shift to save');
        }

        return await this.saveShiftByShiftId(activeShift.id);
    }


    static async deleteShiftSignals(driverId: string, shiftId?: string): Promise<void> {
        // If shiftId is provided, use it directly. Otherwise, try to find active shift
        const targetShiftId = shiftId || (await ShiftService.getActiveShift(driverId))?.id;
        if (targetShiftId) {
            await ShiftSignal.destroy({
                where: { shift_id: targetShiftId }
            });
        }
    }




    static async getLastSignal(driverId: string): Promise<Signal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        const lastSignal = await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });

        return lastSignal ? lastSignal.signal : null;
    }

    private static async getLastSignalWithDetails(driverId: string): Promise<ShiftSignal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        return await ShiftSignal.findOne({
            where: { shift_id: activeShift.id },
            order: [['timestamp', 'DESC']]
        });
    }

    static async getActiveShift(driverId: string): Promise<Shift | null> {
        return await ShiftRepository.findActiveByDriverId(driverId);
    }

    private static async getShiftStartSignal(driverId: string): Promise<ShiftSignal | null> {
        // Get active shift for driver first
        const activeShift = await this.getActiveShift(driverId);
        if (!activeShift) return null;

        // Find most recent 'start' signal after last 'stop' signal
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

    private static async saveShiftByShiftId(shiftId: string): Promise<Shift> {
        const shift = await ShiftRepository.findById(shiftId);
        if (!shift) {
            throw new Error(SHIFT_ERRORS.SHIFT_NOT_FOUND);
        }

        // Check if there are any active rides for this shift
        const hasActiveRide = await RideRepository.hasActiveRideForShift(shiftId);

        if (hasActiveRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        const shiftEnd = new Date();
        
        const endData: ShiftEndData = {
            shift_end: shiftEnd,
            total_duration_ms: shiftEnd.getTime() - shift.shift_start.getTime()
        };
        
        // Get pauses and rides for calculations
        const { pauses, rides } = await this.getShiftRelatedData(shiftId);

        // Use the new utils to calculate and update shift data
        await ShiftCalculationUtils.updateShiftCalculations(shift, 'full', pauses, rides);
        
        // Update with calculated values
        await shift.update({
            ...shift.dataValues, // Include calculated values from ShiftCalculationUtils
            shift_end: shiftEnd  // Ensure shift_end is set after spreading
        });

        // Clean up shift signals for this shift
        await ShiftSignal.destroy({
            where: { shift_id: shiftId }
        });

        return shift;
    }

    static async editShift(shiftId: string, driverId: string, updateData: any): Promise<Shift> {
        // Get shift with authorization check
        const shift = await this.getShiftWithAuth(shiftId, driverId);
        
        // Check if shift is active
        this.validateShiftNotActive(shift, 'edit');

        // Validate temporal boundaries
        const newStart = updateData.shift_start ? new Date(updateData.shift_start) : shift.shift_start;
        const newEnd = updateData.shift_end ? new Date(updateData.shift_end) : shift.shift_end;

        if (newEnd && newStart >= newEnd) {
            throw new Error('Shift start must be before shift end');
        }

        // Check max shift duration limit
        if (newEnd) {
            const duration = newEnd.getTime() - newStart.getTime();
            if (duration > SHIFT_CONSTANTS.MAX_SHIFT_DURATION_MS) {
                throw new Error(SHIFT_ERRORS.INVALID_SHIFT_DURATION);
            }
        }

        // Check consistency with rides

        const rides = await RideRepository.findAllByShift(shiftId);

        for (const ride of rides) {
            if (ride.start_time < newStart || (ride.end_time && ride.end_time > newEnd!)) {
                throw new Error('Shift must encompass all rides');
            }
        }

        // Check break times are within shift
        const signals = await ShiftSignal.findAll({
            where: { 
                shift_id: shiftId,
                signal: 'pause'
            }
        });

        for (const signal of signals) {
            if (signal.timestamp < newStart || signal.timestamp > newEnd!) {
                throw new Error('Break times must be within shift boundaries');
            }
        }

        // Update the shift
        await shift.update(updateData);

        // Recalculate statistics
        await this.recalculateShiftStatistics(shiftId);

        // Reload the shift to get the updated values
        await shift.reload();

        return shift;
    }

    static async deleteShift(shiftId: string, driverId: string): Promise<void> {
        // Get shift with authorization check
        const shift = await this.getShiftWithAuth(shiftId, driverId);
        
        // Check if shift is active
        this.validateShiftNotActive(shift, 'delete');

        // Check for associated rides
        const rides = await RideRepository.findAllByShift(shiftId);

        if (rides.length > 0) {
            throw new Error('Cannot delete shift with associated rides. Please delete rides first.');
        }

        // Soft delete the shift
        await shift.destroy();
    }

    static async restoreShift(shiftId: string, driverId: string): Promise<void> {
        // Find the deleted shift (paranoid: false to include soft-deleted records)
        const shift = await Shift.findByPk(shiftId, { paranoid: false });
        if (!shift) {
            throw new Error(SHIFT_ERRORS.SHIFT_NOT_FOUND);
        }

        // Check authorization
        if (shift.driver_id !== driverId) {
            throw new Error('Not authorized to restore this shift');
        }

        // Check if shift is deleted (handle both snake_case and camelCase)
        const deletedAt = shift.deleted_at || (shift as any).deletedAt;
        if (!deletedAt) {
            throw new Error('Shift is not deleted');
        }

        // Restore the shift using Sequelize's restore method
        await shift.restore();
    }

    static async getShiftsByDriver(driverId: string): Promise<Shift[]> {
        const endDate = new Date();
        const startDate = new Date(0); // Beginning of time
        return await ShiftRepository.findByDriverAndDateRange(driverId, startDate, endDate);
    }

    static async getShiftById(shiftId: string, driverId: string): Promise<Shift> {
        return await this.getShiftWithAuth(shiftId, driverId);
    }

    
    static async endShiftById(shiftId: string, driverId: string): Promise<any> {
        const shift = await this.getShiftWithAuth(shiftId, driverId);

        if (shift.shift_end) {
            throw new Error(SHIFT_ERRORS.SHIFT_ALREADY_ENDED);
        }

        // Check if there are any active rides for this shift
        const hasActiveRide = await RideRepository.hasActiveRideForShift(shiftId);

        if (hasActiveRide) {
            throw new Error('Cannot end shift while ride is in progress. Please end the active ride first.');
        }

        await this.saveShiftByShiftId(shiftId);
        
        // Reload shift to get updated data
        await shift.reload();
        
        // Calculate total earnings
        const totalEarnings = shift.total_earnings_cents ? shift.total_earnings_cents / SHIFT_CONSTANTS.CENTS_TO_DOLLARS : 0;
        
        return {
            totalDuration: shift.total_duration_ms || 0,
            workTimeMs: shift.work_time_ms || 0,
            breakTimeMs: shift.break_time_ms || 0,
            numBreaks: shift.num_breaks || 0,
            averageBreak: shift.avg_break_ms || 0,
            totalEarnings: totalEarnings
        };
    }

    private static async recalculateShiftStatistics(shiftId: string): Promise<void> {
        const shift = await ShiftRepository.findById(shiftId);
        if (!shift || !shift.shift_end) return;

        // Get pauses and rides for calculations
        const { pauses, rides } = await this.getShiftRelatedData(shiftId);

        await ShiftCalculationUtils.updateShiftCalculations(shift, 'full', pauses, rides);
    }

} 